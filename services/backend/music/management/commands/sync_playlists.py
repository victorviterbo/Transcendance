from django.core.management.base import BaseCommand

from music.models import Playlist, Track
from music.itunes_client import fetch_ids_from_rss, batch_lookup, full_lookup
from .seed_playlists import STATIC_TRACK_IDS


class Command(BaseCommand):
    help = "Sync all playlists from iTunes RSS feeds into the database."

    @staticmethod
    def _playlist_country(playlist: Playlist) -> str | None:
        """Best-effort storefront country extraction from playlist data."""
        rss_url = (playlist.rss_url or '').lower()
        slug = (playlist.slug or '').lower()
        if '/fr/' in rss_url or '-fr' in slug or 'france' in slug:
            return 'FR'
        if '/ch/' in rss_url or '-ch' in slug:
            return 'CH'
        if '/us/' in rss_url or '-us' in slug or 'usa' in slug:
            return 'US'
        return None

    def handle(self, *args, **options):
        playlists = Playlist.objects.all()

        if not playlists.exists():
            self.stdout.write(self.style.WARNING(
                "No playlists found. Run 'python manage.py seed_playlists' first."
            ))
            return

        for playlist in playlists:
            self.stdout.write(f"Syncing: {playlist.name} ...")
            country = self._playlist_country(playlist)

            try:
                if playlist.rss_url:
                    entries = fetch_ids_from_rss(playlist.rss_url)
                    if not entries:
                        self.stdout.write(self.style.WARNING(f"  No entries returned, skipping."))
                        continue

                    track_ids = [e["track_id"] for e in entries]
                    previews = batch_lookup(track_ids, country=country)
                    missing_preview_ids = [tid for tid in track_ids if not previews.get(tid)]
                    if missing_preview_ids:
                        fallback_previews = batch_lookup(missing_preview_ids)
                        previews.update(fallback_previews)

                    synced = 0
                    for entry in entries:
                        preview_url = previews.get(entry["track_id"])
                        if not preview_url:
                            continue

                        try:
                            track, _ = Track.objects.update_or_create(
                                itunes_id=entry["track_id"],
                                defaults={
                                    "title": entry["title"],
                                    "artist": entry["artist"],
                                    "kind": entry.get("kind", ""),
                                    "artwork_url": entry["artwork_url"],
                                    "preview_url": preview_url,
                                },
                            )
                            playlist.tracks.add(track)
                            synced += 1
                        except Exception as e:
                            self.stdout.write(self.style.WARNING(
                                f"  Failed to save track {entry['track_id']}: {e}"
                            ))

                    self.stdout.write(self.style.SUCCESS(
                        f"  Synced {synced}/{len(entries)} tracks for {playlist.name}"
                    ))

                else:
                    track_ids = STATIC_TRACK_IDS.get(playlist.slug, [])
                    if not track_ids:
                        self.stdout.write(self.style.WARNING(f"  No static IDs found for {playlist.slug}, skipping."))
                        continue

                    metadata = full_lookup(track_ids, country=country)
                    missing_metadata_ids = [tid for tid in track_ids if tid not in metadata]
                    if missing_metadata_ids:
                        fallback_metadata = full_lookup(missing_metadata_ids)
                        metadata.update(fallback_metadata)

                    synced = 0
                    for t_id in track_ids:
                        info = metadata.get(t_id)
                        if not info:
                            continue
                        if not info.get("preview_url"):
                            continue

                        try:
                            track, _ = Track.objects.update_or_create(
                                itunes_id=t_id,
                                defaults={
                                    "title": info["title"],
                                    "artist": info["artist"],
                                    "kind": info.get("kind", ""),
                                    "artwork_url": info["artwork_url"],
                                    "preview_url": info["preview_url"],
                                },
                            )
                            playlist.tracks.add(track)
                            synced += 1
                        except Exception as e:
                            self.stdout.write(self.style.WARNING(
                                f"  Failed to save track {t_id}: {e}"
                            ))

                    self.stdout.write(self.style.SUCCESS(
                        f"  Synced {synced}/{len(track_ids)} tracks for {playlist.name}"
                    ))
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"  API error while syncing {playlist.name}: {e}. Skipping playlist."
                    )
                )
                continue

        self.stdout.write(self.style.SUCCESS("All playlists synced."))