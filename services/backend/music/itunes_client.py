from typing import List, Dict
from django.conf import settings
import requests


def fetch_90s_tracks(limit: int = 20) -> List[Dict]:
	"""Temporary stub: will call iTunes later."""

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