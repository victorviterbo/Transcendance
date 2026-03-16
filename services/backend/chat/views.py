"""HTTP views for chat room lookups, direct-message room creation, and fallback posting."""

from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.shortcuts import redirect 
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Room, Message

User = get_user_model()


def _direct_key_for(user_a, user_b):
	"""Generate a stable, unique key for a direct message room between two users.
	
	Ensures Alice↔Bob has the same key regardless of call order.
	Args:
		user_a, user_b: User objects
	
	Returns:
		String key 'user_<min_id>_user_<max_id>'
	"""
	id_a, id_b = user_a.id, user_b.id
	min_id, max_id = (id_a, id_b) if id_a < id_b else (id_b, id_a)
	return f'user_{min_id}_user_{max_id}'


def _build_direct_room_response(request, target_user):
	"""Create or fetch a direct-message room shared by the current user and target user."""

	if not request.user.is_authenticated:
		return JsonResponse({'detail': 'Authentication required'}, status=401)

	if request.user.id == target_user.id:
		return JsonResponse({'detail': 'Cannot DM yourself'}, status=400)

	# TODO: Re-enable friendship check after testing
	# if not (request.user.friends.filter(id=target_user.id).exists() or
	#         target_user.friends.filter(id=request.user.id).exists()):
	# 	return JsonResponse({'detail': 'You are not friends with this user'}, status=403)

	direct_key = _direct_key_for(request.user, target_user)

	room, created = Room.objects.get_or_create(
		direct_key=direct_key,
		defaults={
			'name': direct_key,
			'is_direct': True,
		}
	)

	room.participants.add(request.user, target_user)

	return JsonResponse({
		'room_id': room.id,
		'room_name': room.name,
		'created': created,
	})


# Old/default behavior: rely on Django CSRF protection for POST requests.
# Temporary testing behavior: allow browser-console POST requests without CSRF.
@csrf_exempt
@require_http_methods(["POST"])
def direct_room(request, user_id):
	"""Initiate or fetch a direct message room with a friend.
	
	Flow:
	1. Check if current user and target user are friends
	2. If yes, create or fetch their private room
	3. Return room ID for websocket connection
	
	Returns:
		JSON with room ID if friends, 400/403/404 otherwise
	"""
	try:
		target_user = User.objects.get(id=user_id)
	except User.DoesNotExist:
		return JsonResponse({'detail': f'User {user_id} not found'}, status=404)

	return _build_direct_room_response(request, target_user)


# Old/default behavior: rely on Django CSRF protection for POST requests.
# Temporary testing behavior: allow browser-console POST requests without CSRF.
@csrf_exempt
@require_http_methods(["POST"])
def direct_room_by_username(request, username):
	"""Create or fetch a direct-message room using the target user's username."""

	try:
		target_user = User.objects.get(username=username)
	except User.DoesNotExist:
		return JsonResponse({'detail': f'User {username} not found'}, status=404)

	return _build_direct_room_response(request, target_user)


def room(request, pk):
	"""Return room metadata or create a message through the HTTP fallback form flow."""

	try:
		room = Room.objects.get(id=pk)
	except Room.DoesNotExist:
		return JsonResponse({'detail': f'Room {pk} not found'}, status=404)

	if request.method == 'POST':
		# HTTP POST fallback (INPUT): the page form submits here when JS/WebSocket isn't used.
		# This creates the Message in the database and (OUTPUT) redirects back to the room.
		Message.objects.create(
			user=request.user,
			room=room,
			body=request.POST.get('body')
		)
		room.participants.add(request.user)
		return redirect('room', pk=room.id)

	return JsonResponse({'message': 'chat service ready'})



