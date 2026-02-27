## Goal

Build a **very small Django REST API endpoint** that returns a playlist of "Top Hits 90s" using the iTunes Search API.

- The backend is just a **proxy**: it calls iTunes, cleans the data, and sends it to the frontend.
- **No database**, no game logic, no scoring, no rooms.
- Optionally, we will add **Django cache** to avoid calling iTunes too often.

This file is written like a **baby-step tutorial** in English. For each step:
- First: explanation (what/why), in simple terms (with Laravel comparisons when useful).
- Then: exact actions to do (files to open, code to add, commands to run).

You can follow it one step at a time.

---

## Step 0 – Understand the existing backend (high level)

### 0.1 Explanation

Your backend is a **Django** project with **Django REST Framework (DRF)**:

- In Laravel you have a `routes/web.php` / `routes/api.php` and controllers.
- In Django you have:
  - `project/settings.py` → like `config/app.php` + `.env` usage.
  - `project/urls.py` → like `routes/api.php` (root routing).
  - Apps (e.g. `users`) → like Laravel modules / features with their own models, views, urls.

Currently:

- `INSTALLED_APPS` in `project/settings.py` contains `users`, which handles authentication.
- `project/urls.py` routes:
  - `/api/auth/...` → to the `users` app (login, register, profile, etc.).
  - `/api/docs/swagger/` → auto-generated docs (OpenAPI).

We will add **one more app** (or module) called `music` with its own urls and views, exactly like `users`.

### 0.2 What you do now

Just read this; no code change yet.

---

## Step 1 – Understand the iTunes Search API (very basic)

### 1.1 Explanation

The iTunes Search API is a simple public HTTP API:

- Base URL: `https://itunes.apple.com/search`
- Important query parameters:
  - `term` → search text, for example `90s hits`, `90s pop`.
  - `media=music` → we only want music.
  - `entity=song` → we only want songs.
  - `limit` → how many results, e.g. `20`.
  - `country` → e.g. `FR` or `US`.

Example URL you can test in your browser:

- `https://itunes.apple.com/search?term=90s%20hits&media=music&entity=song&limit=5&country=FR`

In the JSON response, useful fields for you:

- `trackId` → unique track ID.
- `trackName` → song title.
- `artistName` → artist name.
- `previewUrl` → small audio preview (~30s).
- `artworkUrl100` → album cover (optional for the front).

We will **not** store these in a database. We will just:

1. Call iTunes from the backend.
2. Select the fields we care about.
3. Send them to the frontend.

### 1.2 What you do now

Open this URL in your browser to see real data (so you trust it works):

- `https://itunes.apple.com/search?term=90s%20hits&media=music&entity=song&limit=5&country=FR`

No code change yet.

---

## Step 2 – Add simple environment variables (optional but clean)

### 2.1 Explanation

Like in Laravel `.env`, Django can read environment variables using `python-dotenv` (`load_dotenv()` is already called in `project/settings.py`).

We will add a few variables to configure the iTunes search:

- `MUSIC_PROVIDER` → just a label (`itunes`), not strictly needed but clean.
- `ITUNES_COUNTRY` → default country (e.g. `FR`).
- `ITUNES_90S_TERM` → default search term for the 90s playlist.

If these are missing, we will still have default values in `settings.py`.

### 2.2 What you do now

1. Open (or create if missing) the file:
   - `services/backend/.env`

2. Add these lines (or adjust if they already exist):

   ```env
   MUSIC_PROVIDER=itunes
   ITUNES_COUNTRY=FR
   ITUNES_90S_TERM=90s%20hits
   ```

3. Open `services/backend/project/settings.py`.

4. Somewhere after `load_dotenv()` (near the top) or near other settings, add:

   ```python
   MUSIC_PROVIDER = os.getenv("MUSIC_PROVIDER", "itunes")
   ITUNES_COUNTRY = os.getenv("ITUNES_COUNTRY", "FR")
   ITUNES_90S_TERM = os.getenv("ITUNES_90S_TERM", "90s hits")
   ```

5. Save the file.

If the backend is running, you may need to restart it so it picks up the new env vars.

---

## Step 3 – Create the `music` app (like a Laravel module)

### 3.1 Explanation

In Django:

- An "app" is like a small module/feature (similar idea to a Laravel module or a group of controllers).
- The `users` app already exists and handles auth.
- We will create a `music` app to keep the music code isolated.

The `music` app will contain:

- `views.py` → our API endpoint logic (`Playlist90sView`).
- `urls.py` → routes for the music endpoints.
- `itunes_client.py` → helper to talk to iTunes.

### 3.2 What you do now

1. Open a terminal at the backend root:

   ```bash
   cd services/backend
   ```

2. Create the `music` app:

   ```bash
   python manage.py startapp music
   ```

   This will create a new folder `services/backend/music` with some default files.

3. Open `services/backend/project/settings.py`.

4. In the `INSTALLED_APPS` list, add `music.apps.MusicConfig` at the end, for example:

   ```python
   INSTALLED_APPS = [
       # ... existing apps ...
       'users.apps.UsersConfig',
       'music.apps.MusicConfig',
   ]
   ```

5. Save the file.

No migrations are needed for this feature because we are not creating models.

---

## Step 4 – Create a small iTunes client (`itunes_client.py`)

### 4.1 Explanation

We want to **isolate** the code that calls iTunes in one place, so that:

- Our view (controller) stays clean.
- If we change provider later (Spotify, etc.), we only touch this file.

We will create a function:

- `fetch_90s_tracks(limit: int = 20) -> list[dict]`

This function will:

1. Build the correct URL with `term`, `media`, `entity`, `limit`, `country`.
2. Use the `requests` library to make the HTTP GET call.
3. Parse the JSON.
4. Filter out tracks without `previewUrl`.
5. Return a **simplified** list of track dicts with just the fields we want for the frontend.

### 4.2 What you do now

1. Make sure the `requests` package is available. It is usually already there, but if you manage dependencies yourself, you would install it with:

   ```bash
   pip install requests
   ```

   (If your project uses a different dependency manager, follow the existing pattern; if you’re in Docker, this may already be handled.)

2. In the `music` app folder, create a new file:

   - `services/backend/music/itunes_client.py`

3. In `itunes_client.py`, you will later add the real code. For now, just put a very small placeholder so the import works:

   ```python
   from typing import List, Dict


   def fetch_90s_tracks(limit: int = 20) -> List[Dict]:
       """Temporary stub: will call iTunes later.

       For now, it just returns an empty list so you can
       wire the endpoint and test the plumbing.
       """
       return []
   ```

We will come back later to replace this stub with the real iTunes call.

---

## Step 5 – Create the playlist view (like a Laravel controller method)

### 5.1 Explanation

In DRF (Django REST Framework):

- A view class (subclass of `APIView`) is similar to a Laravel controller.
- HTTP methods (`GET`, `POST`, etc.) are implemented as methods (`get`, `post`, ...).

We will create a `Playlist90sView` that:

- On `GET`:
  - Calls `fetch_90s_tracks(limit=20)` (for the moment, this returns an empty list stub).
  - Formats a JSON response like:
    - `{ "tracks": [ ... ] }`
  - Returns `Response(data, status=200)`.

Later, when we implement the real client, the same view will just start returning real data.

### 5.2 What you do now

1. Open `services/backend/music/views.py`.

2. Replace its content (if any) with a simple DRF view skeleton:

   ```python
   from rest_framework.views import APIView
   from rest_framework.response import Response
   from rest_framework import status

   from .itunes_client import fetch_90s_tracks


   class Playlist90sView(APIView):
       """Return a simple 90s playlist for the frontend."""

       # If you want only authenticated users, change to IsAuthenticated
       permission_classes = []  # AllowAny by default in global settings

       def get(self, request):
           tracks = fetch_90s_tracks(limit=20)
           data = {"tracks": tracks}
           return Response(data, status=status.HTTP_200_OK)
   ```

3. Save the file.

At this point, the view is wired to the stub client; it will just return `{"tracks": []}`.

---

## Step 6 – Add URLs for the `music` app

### 6.1 Explanation

Like `users/urls.py`, the `music` app needs its own `urls.py` to map paths to views.

- We will define a local route `playlist/90s/`.
- Then, in the **project** urls, we will mount it under `/api/music/`.

Result for the frontend:

- Full URL: `/api/music/playlist/90s/`

### 6.2 What you do now

1. Create a new file:
   - `services/backend/music/urls.py`

2. Put this content inside:

   ```python
   from django.urls import path

   from .views import Playlist90sView


   urlpatterns = [
       path('playlist/90s/', Playlist90sView.as_view(), name='playlist-90s'),
   ]
   ```

3. Open `services/backend/project/urls.py`.

4. Add the import and route for the `music` app:

   - At the top, `include` is already imported, so you only need to add a new path inside `urlpatterns`:

   ```python
   urlpatterns = [
       path('api/admin/', admin.site.urls),
       path('api/auth/', include('users.urls')),
       path('api/music/', include('music.urls')),  # <-- add this line
       path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
       path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'),
            name='swagger-ui')
   ]
   ```

5. Save the file.

Now, your API endpoint `/api/music/playlist/90s/` exists, but it returns an empty list for now.

---

## Step 7 – Test the stub endpoint

### 7.1 Explanation

Before we call iTunes, we want to make sure:

- Routing works.
- The view is called.
- JSON format is correct.

### 7.2 What you do now

1. Start the backend server from `services/backend` (if it’s not already running):

   ```bash
   cd services/backend
   python manage.py runserver 0.0.0.0:8000
   ```

2. In a browser or with `curl`, call:

   ```bash
   curl http://localhost:8000/api/music/playlist/90s/
   ```

3. You should see something like:

   ```json
   { "tracks": [] }
   ```

If this works, the plumbing (urls + view) is correct. Next, we make the client real.

---

## Step 8 – Implement the real iTunes call in `fetch_90s_tracks`

### 8.1 Explanation

Now we replace the stub function with real logic:

- Use `requests.get` to call `https://itunes.apple.com/search`.
- Build query parameters using `ITUNES_COUNTRY` and `ITUNES_90S_TERM` from settings.
- Return a **simplified list** of dicts like:

  ```json
  {
    "id": 12345,
    "title": "Song name",
    "artist": "Artist name",
    "previewUrl": "https://...",
    "artworkUrl": "https://..."
  }
  ```

### 8.2 What you do now

1. Open `services/backend/music/itunes_client.py`.

2. Replace the stub implementation with a real one. You can follow this structure:

   ```python
   from typing import List, Dict

   import requests
   from django.conf import settings


   def fetch_90s_tracks(limit: int = 20) -> List[Dict]:
       """Fetch a list of 90s tracks from the iTunes Search API."""

       params = {
           "term": settings.ITUNES_90S_TERM,
           "media": "music",
           "entity": "song",
           "limit": limit,
           "country": settings.ITUNES_COUNTRY,
       }

       response = requests.get("https://itunes.apple.com/search", params=params, timeout=5)
       response.raise_for_status()  # raise error if status != 200

       data = response.json()
       results = data.get("results", [])

       tracks: List[Dict] = []
       for item in results:
           preview_url = item.get("previewUrl")
           if not preview_url:
               continue  # skip items without audio preview

           track = {
               "id": item.get("trackId"),
               "title": item.get("trackName"),
               "artist": item.get("artistName"),
               "previewUrl": preview_url,
               "artworkUrl": item.get("artworkUrl100"),
           }
           tracks.append(track)

       return tracks
   ```

3. Save the file and restart the backend if needed.

4. Call again:

   ```bash
   curl http://localhost:8000/api/music/playlist/90s/
   ```

5. You should now see a JSON with a non-empty `tracks` array.

---

## Step 9 – (Optional) Add caching with Django

### 9.1 Explanation

If many users call your endpoint, you may not want to call iTunes every time.

We can:

- Use Django’s cache (in-memory is fine for dev) to store the playlist for a short time (e.g. 10 minutes).
- On each request:
  - If cache has `playlist_90s`, return it.
  - Else, call iTunes, store in cache, then return.

This is **simpler** than using the database and still avoids spamming iTunes.

### 9.2 What you do now

1. Open `services/backend/music/views.py`.

2. Update `Playlist90sView` to use the cache. Example structure:

   ```python
   from django.core.cache import cache
   from rest_framework.views import APIView
   from rest_framework.response import Response
   from rest_framework import status

   from .itunes_client import fetch_90s_tracks


   class Playlist90sView(APIView):
       """Return a cached 90s playlist for the frontend."""

       permission_classes = []  # AllowAny by default

       def get(self, request):
           cache_key = "playlist_90s"
           cached = cache.get(cache_key)
           if cached is not None:
               return Response({"tracks": cached}, status=status.HTTP_200_OK)

           tracks = fetch_90s_tracks(limit=20)
           cache.set(cache_key, tracks, timeout=600)  # cache for 600 seconds (10 minutes)
           return Response({"tracks": tracks}, status=status.HTTP_200_OK)
   ```

3. Save, restart backend, and test again with `curl` or browser.

You now have:

- A working proxy endpoint.
- Optional caching.

---

## Step 10 – What the frontend can rely on

### 10.1 Contract for the frontend

- Endpoint (GET):
  - `/api/music/playlist/90s/`

- Response (success 200):

  ```json
  {
    "tracks": [
      {
        "id": 123456789,
        "title": "Song title",
        "artist": "Artist name",
        "previewUrl": "https://...",
        "artworkUrl": "https://..."
      },
      ...
    ]
  }
  ```

- Frontend responsibility:
  - Call this endpoint.
  - Render buttons or cards for each track.
  - Use `<audio src={previewUrl} />` to play the preview when the user clicks.

No score, no game state, just a playlist.

You now have a clear, minimal backend feature that matches your role and is easy to maintain.

