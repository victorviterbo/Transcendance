"""Define the views for the social/friends API."""

from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from userauth.models import SiteUser
from userprofile.models import Profile

from .models import Friendship
from .serializers import FriendInfoSerializer, FriendUserSerializer
from .signals import notif_payload


def get_request_value(request: Request, *keys: str) -> str | None:
    """Return the first non-empty request value found for the provided keys."""
    for key in keys:
        value = request.data.get(key)
        if value is not None:
            return value
    return None

def friendship_relation(user: SiteUser, profile: Profile) -> str:
    """Return the frontend relation label for a profile."""
    outgoing = Friendship.objects.filter(from_user=user, to_user=profile.user).first()
    if outgoing:
        return 'friends' if outgoing.status == 'accepted' else 'outgoing'
    incoming = Friendship.objects.filter(from_user=profile.user, to_user=user).first()
    if incoming:
        return 'friends' if incoming.status == 'accepted' else 'incoming'
    return 'not-friends'

def error_response(payload: dict[str, str], legacy_payload: dict[str, str] | None = None) -> Response:
    """Build a standardized 400 response with optional legacy aliases."""
    error_payload = payload.copy()
    if legacy_payload:
        error_payload.update(legacy_payload)
    return Response({'error': error_payload}, status=status.HTTP_400_BAD_REQUEST)

def resolve_target_user(target_uid: str | None) -> SiteUser | None:
    """Resolve a target user from either SiteUser.uid or Profile.uid."""
    if target_uid is None:
        return None
    user = SiteUser.objects.filter(uid=target_uid).select_related('profile').first()
    if user:
        return user
    profile = Profile.objects.filter(uid=target_uid).select_related('user').first()
    if not profile:
        return None
    return profile.user

def friend_response(description: str, target_user: SiteUser, target_username: str | None = None) -> dict:
    """response for friend actions."""
    return {
        'description': description,
        'target-uid': str(target_user.profile.uid),
        'target-username': target_username or target_user.profile.username,
    }

def serialize_profiles_list(profiles, request: Request, relation) -> list:
    """Serialize an iterable of Profile objects to FriendUserSerializer data."""
    result = []
    for profile in profiles:
        rel = relation(profile) if callable(relation) else relation
        result.append(
            FriendUserSerializer(profile, context={'request': request, 'relation': rel}).data
        )
    return result

class FriendRequestsSeePend(APIView):
    """Define the function to display friends and friend requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """List all pending friend requests for the authenticated user."""
        incoming_requests = (
            Friendship.objects.filter(to_user=request.user, status='pending')
            .select_related('from_user__profile', 'to_user__profile')
            .order_by('-created_at')
        )
        outgoing_requests = (
            Friendship.objects.filter(from_user=request.user, status='pending')
            .select_related('from_user__profile', 'to_user__profile')
            .order_by('-created_at')
        )

        incoming_profiles = (friendship.from_user.profile for friendship in incoming_requests)
        outgoing_profiles = (friendship.to_user.profile for friendship in outgoing_requests)

        return Response(
            {
                'incoming': serialize_profiles_list(incoming_profiles, request, 'incoming'),
                'outgoing': serialize_profiles_list(outgoing_profiles, request, 'outgoing'),
            },
            status=status.HTTP_200_OK,
        )

class FriendSee(APIView):
    """Define the function to display friends and friend requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """List all accepted friends for the authenticated user."""
        friendships = Friendship.objects.filter(
            Q(to_user=request.user) | Q(from_user=request.user),
            status='accepted',
        ).select_related('from_user__profile', 'to_user__profile')

        friends = []
        for friendship in friendships:
            if friendship.from_user == request.user:
                friends.append(friendship.to_user.profile)
            else:
                friends.append(friendship.from_user.profile)

        serializer = FriendInfoSerializer(friends, many=True, context={'request': request})
        return Response({'friends': serializer.data}, status=status.HTTP_200_OK)


class FriendSearch(APIView):
    """Search profiles and return their relation to the authenticated user."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Search profiles by username substring."""
        query = get_request_value(request, 'search', 'q')
        if query is None:
            return error_response({'search': 'MISSING_FIELD'}, {'q': 'MISSING_FIELD'})

        profiles = (
            Profile.objects.filter(username__icontains=query)
            .exclude(user=request.user)
            .filter(user__isnull=False)
            .select_related('user')     
        )
        users = []
        for profile in profiles:
            rel = friendship_relation(request.user, profile)
            if rel != 'not-friends':
                continue
            users.append(
                FriendUserSerializer(
                    profile,
                    context={
                        'request': request,
                        'relation': rel,
                    },
                ).data,
            )
        return Response({'users': users}, status=status.HTTP_200_OK)

class FriendRequestsRespond(APIView):
    """Define the functions related to accepting friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Accept or refuse a pending friend request."""
        target_uid = get_request_value(request, 'target-uid', 'user_uid', 'user-uid')
        target_username = get_request_value(request, 'target-username', 'user-username')
        new_status = request.data.get('new-status')

        error_payload: dict[str, str] = {}
        legacy_error_payload: dict[str, str] = {}
        if target_uid is None:
            error_payload['target-uid'] = 'MISSING_FIELD'
            legacy_error_payload['user_uid'] = 'MISSING_FIELD'
        if new_status is None:
            error_payload['new-status'] = 'MISSING_FIELD'
        if error_payload:
            return error_response(error_payload, legacy_error_payload)

        if new_status == 'reject':
            new_status = 'refuse'

        target_user = resolve_target_user(target_uid)
        if target_user is None:
            return error_response(
                {'target-uid': 'USER_NOT_FOUND'},
                {'user_uid': 'USER_NOT_FOUND', 'user-uid': 'USER_NOT_FOUND'},
            )

        sender = target_user
        user = request.user
        relationship = Friendship.objects.filter(from_user=sender, to_user=user).first()
        if relationship and relationship.status == 'pending':
            if new_status == 'accept':
                relationship.status = 'accepted'
                relationship.read = False
                relationship.save(update_fields=['status', 'read'])
                return Response(friend_response('FRIENDSHIP_REQUEST_ACCEPTED', target_user, target_username), status=status.HTTP_200_OK)
            if new_status == 'refuse':
                relationship.delete()
                return Response(friend_response('FRIENDSHIP_REQUEST_REJECTED', target_user, target_username), status=status.HTTP_200_OK)

        return Response({'error': {'friendship': 'FRIENDSHIP_NOT_FOUND'}}, status=status.HTTP_400_BAD_REQUEST)
            
class FriendRequestsSend(APIView):
    """Define the functions related to sending friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Send a new friend request."""
        target_uid = get_request_value(request, 'target-uid', 'user_uid', 'user-uid')
        target_username = get_request_value(request, 'target-username', 'user-username')

        if target_uid is None:
            return error_response(
                {'target-uid': 'MISSING_FIELD'},
                {'user_uid': 'MISSING_FIELD', 'user-uid': 'MISSING_FIELD'},
            )

        recipient = resolve_target_user(target_uid)
        if recipient is None:
            return error_response(
                {'target-uid': 'USER_NOT_FOUND'},
                {'user_uid': 'USER_NOT_FOUND', 'user-uid': 'USER_NOT_FOUND'},
            )

        user = request.user
        if recipient == user:
            return Response({'error': {'friendship': 'REALLY_SAD'}}, status=status.HTTP_400_BAD_REQUEST)

        relationship = Friendship.objects.filter(
            Q(from_user=user, to_user=recipient) | Q(from_user=recipient, to_user=user)
        ).first()
        if relationship:
            return Response(
                {
                    'error': {'friendship': 'FRIENDSHIP_ALREADY_EXISTS'},
                    'request_status': relationship.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        Friendship.objects.create(from_user=user, to_user=recipient, status='pending', read=False)
        return Response(friend_response('FRIENDSHIP_REQUEST_SENT', recipient, target_username), status=status.HTTP_201_CREATED)


class FriendRemove(APIView):
    """Define the functions related to removing friends."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Remove an accepted friendship or cancel an outgoing pending request."""
        target_uid = get_request_value(request, 'target-uid', 'user_uid', 'user-uid')
        target_username = get_request_value(request, 'target-username', 'user-username')

        if target_uid is None:
            return error_response(
                {'target-uid': 'MISSING_FIELD'},
                {'user_uid': 'MISSING_FIELD', 'user-uid': 'MISSING_FIELD'},
            )

        target_user = resolve_target_user(target_uid)
        if target_user is None:
            return error_response(
                {'target-uid': 'USER_NOT_FOUND'},
                {'user_uid': 'USER_NOT_FOUND', 'user-uid': 'USER_NOT_FOUND'},
            )

        user = request.user
        friendship = Friendship.objects.filter(
            Q(from_user=user, to_user=target_user, status='accepted')
            | Q(from_user=target_user, to_user=user, status='accepted')
            | Q(from_user=user, to_user=target_user, status='pending')
        ).first()
        if friendship is None:
            return Response(
                {'error': {'friendship': 'FRIENDSHIP_NOT_FOUND'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        description = (
            'FRIENDSHIP_REQUEST_CANCELLED'
            if friendship.status == 'pending'
            else 'FRIENDSHIP_REMOVED'
        )
        friendship.delete()
        return Response(friend_response(description, target_user, target_username), status=status.HTTP_200_OK)


class NotifSee(APIView):
    """List pending friend-request notifications for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Return incoming friend requests as notification entries."""
        incoming_friendships = (
            Friendship.objects.filter(to_user=request.user, status='pending')
            .select_related('from_user__profile')
            .order_by('-created_at')
        )
        accepted_friendships = (
            Friendship.objects.filter(from_user=request.user, status='accepted')
            .select_related('to_user__profile')
            .order_by('-created_at')
        )
        notifs = [
            notif_payload(
                friendship=friendship,
                kind='friend-request',
                profile=friendship.from_user.profile,
                relation='incoming',
                request=request,
            )
            for friendship in incoming_friendships
        ]
        notifs.extend(
            notif_payload(
                friendship=friendship,
                kind='friend-accepted',
                profile=friendship.to_user.profile,
                relation='friends',
                request=request,
            )
            for friendship in accepted_friendships
        )
        notifs.sort(key=lambda notif: notif['date'], reverse=True)
        return Response(
            {'notifs': notifs},
            status=status.HTTP_200_OK,
        )


class NotifRead(APIView):
    """Mark pending friend-request notifications as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Mark all incoming friend-request notifications as read."""
        Friendship.objects.filter(to_user=request.user, status='pending', read=False).update(read=True)
        Friendship.objects.filter(from_user=request.user, status='accepted', read=False).update(read=True)
        return Response({}, status=status.HTTP_200_OK)
