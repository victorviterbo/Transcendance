from django.core.management.base import BaseCommand
from music.models import Playlist


PLAYLISTS = [
    {"name": "Top 100 Global US",       "slug": "top100-global-us",  "rss_url": "https://itunes.apple.com/us/rss/topsongs/limit=100/json"},
    {"name": "Top 100 Rap US",          "slug": "top100-rap-us",     "rss_url": "https://itunes.apple.com/us/rss/topsongs/limit=100/genre=18/json"},
    {"name": "Top 100 Pop US",          "slug": "top100-pop-us",     "rss_url": "https://itunes.apple.com/us/rss/topsongs/limit=100/genre=14/json"},
    {"name": "Top 100 Rock US",         "slug": "top100-rock-us",    "rss_url": "https://itunes.apple.com/us/rss/topsongs/limit=100/genre=21/json"},
    {"name": "Top 100 Dance/Electro US","slug": "top100-dance-us",   "rss_url": "https://itunes.apple.com/us/rss/topsongs/limit=100/genre=17/json"},
    {"name": "Top 100 R&B/Soul US",     "slug": "top100-rnb-us",     "rss_url": "https://itunes.apple.com/us/rss/topsongs/limit=100/genre=15/json"},
    {"name": "Top 100 Global FR",       "slug": "top100-global-fr",  "rss_url": "https://itunes.apple.com/fr/rss/topsongs/limit=100/json"},
    {"name": "Top 100 Rap FR",          "slug": "top100-rap-fr",     "rss_url": "https://itunes.apple.com/fr/rss/topsongs/limit=100/genre=18/json"},
    {"name": "Top 100 Chanson Française","slug": "top100-chanson-fr","rss_url": "https://itunes.apple.com/fr/rss/topsongs/limit=100/genre=81/json"},
    {"name": "Top 100 Global CH",       "slug": "top100-global-ch",  "rss_url": "https://itunes.apple.com/ch/rss/topsongs/limit=100/json"},
]


class Command(BaseCommand):
    help = "Seed the 10 iTunes playlists into the database (safe to re-run)."

    def handle(self, *args, **options):
        for data in PLAYLISTS:
            _, created = Playlist.objects.get_or_create(
                slug=data["slug"],
                defaults={"name": data["name"], "rss_url": data["rss_url"]},
            )
            status = "created" if created else "already exists"
            self.stdout.write(f"  {data['name']} → {status}")

        self.stdout.write(self.style.SUCCESS("Done seeding playlists."))