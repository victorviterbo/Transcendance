from django.db.models import Count
from rest_framework.response import Response
from rest_framework.views import APIView

from .genre_utils import GENRE_MAPPING
from .models import Track


class GenresView(APIView):
	"""Get top genres with normalized names, ordered by count (top 6)."""
	
	def get(self, request) -> Response:
		"""Return list of genres with their track counts (normalized and grouped)."""
		# Get all genres with their counts
		all_genres = Track.objects.values('genre').annotate(
			count=Count('genre')
		)
		
		# Normalize and group genres
		genre_counts = {}
		for item in all_genres:
			original_genre = item['genre']
			normalized_genre = GENRE_MAPPING.get(original_genre, original_genre)
			
			if normalized_genre not in genre_counts:
				genre_counts[normalized_genre] = 0
			genre_counts[normalized_genre] += item['count']
		
		# Sort by count and get top 6
		sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:6]
		
		# Format response
		result = [{"genre": genre, "count": count} for genre, count in sorted_genres]
		return Response(result)
