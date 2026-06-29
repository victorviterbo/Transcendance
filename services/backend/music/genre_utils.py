"""Utilities for normalizing music genres."""
GENRE_MAPPING = {
	# Rap variants
	"Rap": "TAG_RAP",
	"Hip-Hop/Rap": "TAG_RAP",
	"Hip Hop/Rap": "TAG_RAP",

	# Pop variants
	"Pop": "TAG_POP",
	"K-Pop": "TAG_POP",
	"French Pop": "TAG_FRENCH_VARIETY",
	"Indie Pop": "TAG_POP",
	"Pop in Spanish": "TAG_POP",
	"Pop Latino": "TAG_POP",
	"Afro-Pop": "TAG_POP",
	"Variété française": "TAG_FRENCH_VARIETY",

	# Rock variants
	"Rock": "TAG_ROCK",
	"Hard Rock": "TAG_ROCK",
	"Indie Rock": "TAG_ROCK",
	"Heavy Metal": "TAG_ROCK",
	"Punk": "TAG_ROCK",
	"Alternative": "TAG_ROCK",
	"New Wave": "TAG_ROCK",
	"British Invasion": "TAG_ROCK",

	# R&B/Soul variants
	"R&B/Soul": "TAG_RNB",
	"Soul": "TAG_RNB",
	"Neo-Soul": "TAG_RNB",

	# Electro variants
	"Electro": "TAG_ELECTRO",
	"House": "TAG_ELECTRO",
	"Disco": "TAG_ELECTRO",
	"Electronic": "TAG_ELECTRO",
	"Afro House": "TAG_ELECTRO",
	"Dance": "TAG_ELECTRO",
}


def normalize_genre(genre: str | None) -> str:
	"""Map raw iTunes genre names to the canonical genre used by the app."""
	if not genre:
		return ''
	return GENRE_MAPPING.get(genre, genre)