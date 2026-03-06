from typing import List, Dict
from django.conf import settings
import requests


def fetch_ids_from_rss(rss_url: str) -> list[dict]:
	"""
	Fetch the top tracks from an iTunes RSS feed.
	Returns a list of dicts: track_id, title, artist,type, artwork_url.
	"""
	try:
		response = requests.get(rss_url, timeout=10)
		response.raise_for_status()
		data = response.json()

		entries = data.get("feed", {}).get("entry", [])
		tracks = []
		for entry in entries:
			try:
				track_id = int(entry["id"]["attributes"]["im:id"])
				title = entry["im:name"]["label"]
				artist = entry["im:artist"]["label"]
				type = entry["category"]["attributes"]["term"]
				# im:image is a list; index 2 is the largest (170x170)
				raw_artwork_url = entry["im:image"][2]["label"]
				artwork_url = raw_artwork_url.replace("170x170bb", "500x500bb")
				tracks.append({
					"track_id": track_id,
					"title": title,
					"artist": artist,
					"kind": type,
					"artwork_url": artwork_url,
				})
			except (KeyError, IndexError, ValueError):
				continue  # skip malformed entries
				
		return tracks

	except (requests.RequestException, ValueError) as e:
		print(f"[itunes_client] RSS fetch error: {e}")
		return []
	
def batch_lookup(track_ids: list[int]) -> dict[int, str]:
	"""
	Perform a batch lookup to get preview URLs for the given track IDs.
	Returns a dict mapping track_id to preview_url.
	"""
	if not track_ids:
		return {}
	
	try:
		ids_str = ",".join(str(tid) for tid in track_ids)
		url = f"https://itunes.apple.com/lookup?id={ids_str}"
		response = requests.get(url, timeout=10)
		response.raise_for_status()
		data = response.json()

		results = data.get("results", [])
		preview_urls = {}
		for item in results:
			try:
				t_id = item["trackId"]
				preview_url = item.get("previewUrl", "")
				preview_urls[t_id] = preview_url
			except KeyError:
				continue  # skip malformed items
				
		return preview_urls

	except (requests.RequestException, ValueError) as e:
		print(f"[itunes_client] Batch lookup error: {e}")
		return {}

def full_lookup(track_ids: list[int]) -> dict[int, dict]:
	"""
	Perform a batch lookup and return full metadata for each track ID.
	Returns a dict mapping track_id to {title, artist, kind, artwork_url, preview_url}.
	"""
	if not track_ids:
		return {}

	try:
		ids_str = ",".join(str(tid) for tid in track_ids)
		url = f"https://itunes.apple.com/lookup?id={ids_str}"
		response = requests.get(url, timeout=10)
		response.raise_for_status()
		data = response.json()

		results = data.get("results", [])
		tracks = {}
		for item in results:
			try:
				t_id = item["trackId"]
				raw_artwork = item.get("artworkUrl100", "")
				artwork_url = raw_artwork.replace("100x100bb", "500x500bb") if raw_artwork else ""
				tracks[t_id] = {
					"title": item.get("trackName", ""),
					"artist": item.get("artistName", ""),
					"kind": item.get("kind", ""),
					"artwork_url": artwork_url,
					"preview_url": item.get("previewUrl", ""),
				}
			except KeyError:
				continue

		return tracks

	except (requests.RequestException, ValueError) as e:
		print(f"[itunes_client] Full lookup error: {e}")
		return {}