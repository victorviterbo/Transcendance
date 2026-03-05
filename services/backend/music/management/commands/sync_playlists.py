from django.core.management.base import BaseCommand
from music.models import Playlist, Track
from music.itunes_client import fetch_ids_from_rss, batch_lookup


class Command(BaseCommand):
    help = "Sync all playlists from iTunes RSS feeds into the database."

    def handle(self, *args, **options):
        playlists = Playlist.objects.all()

        if not playlists.exists():
            self.stdout.write(self.style.WARNING(
                "No playlists found. Run 'python manage.py seed_playlists' first."
            ))
            return

        for playlist in playlists:
            self.stdout.write(f"Syncing: {playlist.name} ...")

            # Stage 1 – get track metadata from the RSS feed
            entries = fetch_ids_from_rss(playlist.rss_url)
            if not entries:
                self.stdout.write(self.style.WARNING(f"  No entries returned, skipping."))
                continue

            # Stage 2 – single batch call to get previewUrls for all IDs
            track_ids = [e["track_id"] for e in entries]
            previews = batch_lookup(track_ids)  # {trackId: previewUrl}

            synced = 0
            for entry in entries:
                preview_url = previews.get(entry["track_id"])
                if not preview_url:
                    continue  # skip tracks without a preview

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

            self.stdout.write(self.style.SUCCESS(
                f"  Synced {synced}/{len(entries)} tracks for {playlist.name}"
            ))

        self.stdout.write(self.style.SUCCESS("All playlists synced."))