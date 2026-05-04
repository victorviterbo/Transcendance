"""Utilities for normalizing music genres."""

GENRE_MAPPING = {
	# Hip Hop variants
	"Hip-Hop/Rap": "Hip Hop/Rap",
	"Rap": "Hip Hop/Rap",

	# Pop variants
	"K-Pop": "Pop",
	"French Pop": "Variété française",
	"Indie Pop": "Pop",
	"Pop in Spanish": "Pop",
	"Pop Latino": "Pop",
	"Afro-Pop": "Pop",

	# Rock variants
	"Hard Rock": "Rock",
	"Indie Rock": "Rock",
	"Heavy Metal": "Rock",
	"Punk": "Rock",
	"Alternative": "Rock",
	"New Wave": "Rock",
	"British Invasion": "Rock",

	# R&B/Soul variants
	"Soul": "R&B/Soul",
	"Neo-Soul": "R&B/Soul",

	# Electro variants
	"House": "Electro",
	"Disco": "Electro",
	"Electronic": "Electro",
	"Afro House": "Electro",
	"Dance": "Electro",

	# Latin variants
	"Latin": "Latin",
	"Latin Urban": "Latin",
	"Latin Rap": "Latin",
}


def normalize_genre(genre: str | None) -> str:
	"""Map raw iTunes genre names to the canonical genre used by the app."""
	if not genre:
		return ''
	return GENRE_MAPPING.get(genre, genre)