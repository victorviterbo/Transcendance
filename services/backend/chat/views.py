from django.http import JsonResponse
from django.shortcuts import redirect 

from .models import Room, Message


def room(request, pk):
	try:
		room = Room.objects.get(id=pk)
	except Room.DoesNotExist:
		return JsonResponse({'detail': f'Room {pk} not found'}, status=404)
	# Show messages oldest first so newest messages appear at the bottom (Messenger-like)
	room_messages = room.message_set.order_by('created')
	participants = room.participants.all()

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
	
	context = {'room': room, 'room_messages' : room_messages, 'participants':participants }
	return JsonResponse({'message': 'chat service ready'})



