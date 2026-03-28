from io import StringIO
from unittest.mock import Mock, patch

import requests
from django.core.management import call_command
from django.test import TestCase

from music.itunes_client import batch_lookup, fetch_ids_from_rss, full_lookup
from music.management.commands.seed_playlists import PLAYLISTS
from music.management.commands.seed_playlists import STATIC_TRACK_IDS
from music.models import Playlist, Track
from music.serializers import PlaylistTracksSerializer, TrackSerializer


class MusicModelsTests(TestCase):
	"""Validate Playlist and Track model behavior."""

	def test_track_many_to_many_playlist(self):
		"""A track should be attachable to multiple playlists."""
		rock = Playlist.objects.create(name='Rock', slug='rock', rss_url='https://example.org/rock')
		pop = Playlist.objects.create(name='Pop', slug='pop', rss_url='https://example.org/pop')
		track = Track.objects.create(
			itunes_id=1234,
			title='Song',
			artist='Artist',
			kind='song',
			preview_url='https://example.org/preview.m4a',
			artwork_url='https://example.org/artwork.jpg',
		)

		track.playlists.add(rock, pop)

		self.assertEqual(track.playlists.count(), 2)
		self.assertTrue(rock.tracks.filter(itunes_id=1234).exists())
		self.assertTrue(pop.tracks.filter(itunes_id=1234).exists())


class ITunesClientTests(TestCase):
	"""Validate iTunes parsing and error handling logic."""

	@patch('music.itunes_client.requests.get')
	def test_fetch_ids_from_rss_parses_valid_entries_and_skips_bad_ones(self, mock_get):
		"""RSS parser should keep valid rows and skip malformed data."""
		response = Mock()
		response.raise_for_status.return_value = None
		response.json.return_value = {
			'feed': {
				'entry': [
					{
						'id': {'attributes': {'im:id': '111'}},
						'im:name': {'label': 'Song 1'},
						'im:artist': {'label': 'Artist 1'},
						'category': {'attributes': {'term': 'song'}},
						'im:image': [
							{'label': 'small'},
							{'label': 'medium'},
							{'label': 'https://img.example/170x170bb.jpg'},
						],
					},
					{
						# malformed entry: missing id block
						'im:name': {'label': 'Invalid'},
					},
				]
			}
		}
		mock_get.return_value = response

		tracks = fetch_ids_from_rss('https://example.org/rss')

		self.assertEqual(len(tracks), 1)
		self.assertEqual(tracks[0]['track_id'], 111)
		self.assertEqual(tracks[0]['title'], 'Song 1')
		self.assertEqual(tracks[0]['artist'], 'Artist 1')
		self.assertEqual(tracks[0]['kind'], 'song')
		self.assertEqual(tracks[0]['artwork_url'], 'https://img.example/500x500bb.jpg')

	@patch('music.itunes_client.requests.get')
	def test_fetch_ids_from_rss_returns_empty_on_http_error(self, mock_get):
		"""RSS fetch errors should return an empty list."""
		mock_get.side_effect = requests.RequestException('boom')

		tracks = fetch_ids_from_rss('https://example.org/rss')

		self.assertEqual(tracks, [])

	@patch('music.itunes_client.requests.get')
	def test_batch_lookup_maps_preview_urls(self, mock_get):
		"""Batch lookup should map each trackId to previewUrl."""
		response = Mock()
		response.raise_for_status.return_value = None
		response.json.return_value = {
			'results': [
				{'trackId': 101, 'previewUrl': 'https://example.org/101.m4a'},
				{'trackId': 202, 'previewUrl': 'https://example.org/202.m4a'},
				{'previewUrl': 'https://example.org/missing-id.m4a'},
			]
		}
		mock_get.return_value = response

		previews = batch_lookup([101, 202])

		self.assertEqual(previews[101], 'https://example.org/101.m4a')
		self.assertEqual(previews[202], 'https://example.org/202.m4a')
		self.assertEqual(len(previews), 2)

	def test_batch_lookup_returns_empty_for_empty_input(self):
		"""No track ids should skip the HTTP call and return empty mapping."""
		self.assertEqual(batch_lookup([]), {})

	@patch('music.itunes_client.requests.get')
	def test_full_lookup_returns_metadata_and_resized_artwork(self, mock_get):
		"""Full lookup should normalize the payload shape expected by sync."""
		response = Mock()
		response.raise_for_status.return_value = None
		response.json.return_value = {
			'results': [
				{
					'trackId': 333,
					'trackName': 'Track 333',
					'artistName': 'Artist 333',
					'kind': 'song',
					'artworkUrl100': 'https://img.example/100x100bb.jpg',
					'previewUrl': 'https://example.org/333.m4a',
				}
			]
		}
		mock_get.return_value = response

		metadata = full_lookup([333])

		self.assertIn(333, metadata)
		self.assertEqual(metadata[333]['title'], 'Track 333')
		self.assertEqual(metadata[333]['artist'], 'Artist 333')
		self.assertEqual(metadata[333]['kind'], 'song')
		self.assertEqual(metadata[333]['artwork_url'], 'https://img.example/500x500bb.jpg')
		self.assertEqual(metadata[333]['preview_url'], 'https://example.org/333.m4a')


class MusicManagementCommandsTests(TestCase):
	"""Validate playlist seed and sync commands behavior."""

	def test_seed_playlists_is_idempotent(self):
		"""Running seed twice should not duplicate playlist rows."""
		call_command('seed_playlists')
		self.assertEqual(Playlist.objects.count(), len(PLAYLISTS))

		call_command('seed_playlists')
		self.assertEqual(Playlist.objects.count(), len(PLAYLISTS))

	def test_sync_playlists_warns_when_no_playlist_exists(self):
		"""Sync command should stop early when no playlist exists."""
		out = StringIO()

		call_command('sync_playlists', stdout=out)

		self.assertIn('No playlists found', out.getvalue())
		self.assertEqual(Track.objects.count(), 0)

	@patch('music.management.commands.sync_playlists.fetch_ids_from_rss')
	def test_sync_playlists_handles_api_timeout_without_crashing(self, mock_fetch_ids):
		"""A provider timeout should be logged and the command should continue cleanly."""
		Playlist.objects.create(
			name='Timeout RSS',
			slug='timeout-rss',
			rss_url='https://example.org/rss',
		)
		mock_fetch_ids.side_effect = requests.exceptions.Timeout('provider timeout')
		out = StringIO()

		call_command('sync_playlists', stdout=out)

		self.assertIn('API error while syncing Timeout RSS', out.getvalue())
		self.assertEqual(Track.objects.count(), 0)

	@patch('music.management.commands.sync_playlists.batch_lookup')
	@patch('music.management.commands.sync_playlists.fetch_ids_from_rss')
	def test_sync_playlists_updates_existing_track_instead_of_duplication(
		self,
		mock_fetch_ids,
		mock_batch_lookup,
	):
		"""Existing tracks should be updated in place by update_or_create."""
		playlist = Playlist.objects.create(
			name='Update RSS',
			slug='update-rss',
			rss_url='https://example.org/rss',
		)
		Track.objects.create(
			itunes_id=1001,
			title='Old Title',
			artist='Old Artist',
			kind='song',
			preview_url='https://example.org/old.m4a',
			artwork_url='old_image.jpg',
		)
		mock_fetch_ids.return_value = [
			{
				'track_id': 1001,
				'title': 'New Title',
				'artist': 'New Artist',
				'kind': 'song',
				'artwork_url': 'new_image.jpg',
			},
		]
		mock_batch_lookup.return_value = {
			1001: 'https://example.org/new.m4a',
		}

		call_command('sync_playlists')

		self.assertEqual(Track.objects.count(), 1)
		track = Track.objects.get(itunes_id=1001)
		self.assertEqual(track.artwork_url, 'new_image.jpg')
		self.assertEqual(track.title, 'New Title')
		self.assertEqual(track.artist, 'New Artist')
		self.assertTrue(playlist.tracks.filter(itunes_id=1001).exists())

	@patch('music.management.commands.sync_playlists.batch_lookup')
	@patch('music.management.commands.sync_playlists.fetch_ids_from_rss')
	def test_sync_playlists_shared_track_is_linked_to_two_playlists(
		self,
		mock_fetch_ids,
		mock_batch_lookup,
	):
		"""The same iTunes ID should create one Track linked to multiple playlists."""
		playlist_a = Playlist.objects.create(
			name='Global',
			slug='global-rss',
			rss_url='https://example.org/global',
		)
		playlist_b = Playlist.objects.create(
			name='Best Of 90s',
			slug='bestof-90s',
			rss_url='https://example.org/bestof',
		)
		mock_fetch_ids.return_value = [
			{
				'track_id': 4242,
				'title': 'Shared Hit',
				'artist': 'Shared Artist',
				'kind': 'song',
				'artwork_url': 'https://img.example/shared.jpg',
			},
		]
		mock_batch_lookup.return_value = {
			4242: 'https://example.org/shared.m4a',
		}

		call_command('sync_playlists')

		self.assertEqual(Track.objects.filter(itunes_id=4242).count(), 1)
		self.assertTrue(playlist_a.tracks.filter(itunes_id=4242).exists())
		self.assertTrue(playlist_b.tracks.filter(itunes_id=4242).exists())

	@patch('music.management.commands.sync_playlists.batch_lookup')
	@patch('music.management.commands.sync_playlists.fetch_ids_from_rss')
	def test_sync_playlists_dynamic_rss_creates_tracks_with_preview_only(
		self,
		mock_fetch_ids,
		mock_batch_lookup,
	):
		"""Dynamic playlists should persist only tracks with a preview URL."""
		playlist = Playlist.objects.create(
			name='Live RSS',
			slug='live-rss',
			rss_url='https://example.org/rss',
		)
		mock_fetch_ids.return_value = [
			{
				'track_id': 1001,
				'title': 'Track A',
				'artist': 'Artist A',
				'kind': 'song',
				'artwork_url': 'https://img.example/a.jpg',
			},
			{
				'track_id': 1002,
				'title': 'Track B',
				'artist': 'Artist B',
				'kind': 'song',
				'artwork_url': 'https://img.example/b.jpg',
			},
		]
		mock_batch_lookup.return_value = {
			1001: 'https://example.org/a.m4a',
			# 1002 intentionally missing => should be skipped
		}

		call_command('sync_playlists')

		self.assertEqual(Track.objects.count(), 1)
		self.assertTrue(Track.objects.filter(itunes_id=1001, title='Track A').exists())
		self.assertTrue(playlist.tracks.filter(itunes_id=1001).exists())
		self.assertFalse(Track.objects.filter(itunes_id=1002).exists())
		mock_fetch_ids.assert_called_once_with('https://example.org/rss')

	@patch('music.management.commands.sync_playlists.full_lookup')
	def test_sync_playlists_static_playlist_uses_full_lookup(self, mock_full_lookup):
		"""Static playlists should resolve metadata through the full lookup API."""
		slug = 'bestof-usa-80s'
		playlist = Playlist.objects.create(name='Best Of', slug=slug, rss_url='')
		static_ids = STATIC_TRACK_IDS[slug]
		first_track_id = static_ids[0]

		mock_full_lookup.return_value = {
			first_track_id: {
				'title': 'Static Song',
				'artist': 'Static Artist',
				'kind': 'song',
				'artwork_url': 'https://img.example/static.jpg',
				'preview_url': 'https://example.org/static.m4a',
			}
		}

		call_command('sync_playlists')

		self.assertTrue(Track.objects.filter(itunes_id=first_track_id, title='Static Song').exists())
		self.assertTrue(playlist.tracks.filter(itunes_id=first_track_id).exists())
		mock_full_lookup.assert_any_call(static_ids, country='US')


class MusicSerializersTests(TestCase):
	"""Validate serialization for tracks and playlists."""

	def test_track_serializer_fields(self):
		"""Track serializer should expose expected public fields."""
		track = Track.objects.create(
			itunes_id=9001,
			title='Serializer Song',
			artist='Serializer Artist',
			kind='song',
			preview_url='https://example.org/preview.m4a',
			artwork_url='https://example.org/artwork.jpg',
		)

		data = TrackSerializer(track).data

		self.assertEqual(data['itunes_id'], 9001)
		self.assertEqual(data['title'], 'Serializer Song')
		self.assertEqual(data['artist'], 'Serializer Artist')
		self.assertEqual(data['kind'], 'song')
		self.assertEqual(data['preview_url'], 'https://example.org/preview.m4a')
		self.assertEqual(data['artwork_url'], 'https://example.org/artwork.jpg')

	def test_playlist_serializer_includes_nested_tracks(self):
		"""Playlist serializer should include all attached tracks."""
		playlist = Playlist.objects.create(
			name='Serialize Playlist',
			slug='serialize-playlist',
			rss_url='https://example.org/rss',
		)
		track_1 = Track.objects.create(
			itunes_id=111,
			title='Track One',
			artist='Artist One',
			kind='song',
			preview_url='https://example.org/1.m4a',
			artwork_url='https://example.org/1.jpg',
		)
		track_2 = Track.objects.create(
			itunes_id=222,
			title='Track Two',
			artist='Artist Two',
			kind='song',
			preview_url='https://example.org/2.m4a',
			artwork_url='https://example.org/2.jpg',
		)

		playlist.tracks.add(track_1, track_2)

		data = PlaylistTracksSerializer(playlist).data

		self.assertEqual(data['name'], 'Serialize Playlist')
		self.assertEqual(data['slug'], 'serialize-playlist')
		self.assertEqual(len(data['tracks']), 2)
		returned_ids = {track['itunes_id'] for track in data['tracks']}
		self.assertEqual(returned_ids, {111, 222})
