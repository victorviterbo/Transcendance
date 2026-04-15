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


def _get_request_data_value(request: Request, *keys: str) -> str | None:
    """Return the first non-empty request value found for the provided keys."""

    for key in keys:
        value = request.data.get(key)
        if value is not None:
            return value
    return None


def _friendship_relation(user: SiteUser, profile: Profile) -> str:
    """Return the frontend relation label for a profile."""

    outgoing = Friendship.objects.filter(from_user=user, to_user=profile.user).first()
    if outgoing:
        return 'friends' if outgoing.status == 'accepted' else 'outgoing'

    incoming = Friendship.objects.filter(from_user=profile.user, to_user=user).first()
    if incoming:
        return 'friends' if incoming.status == 'accepted' else 'incoming'

    return 'not-friends'


def _error_response(payload: dict[str, str], legacy_payload: dict[str, str] | None = None) -> Response:
    """Build a standardized 400 response with optional legacy aliases."""

    error_payload = payload.copy()
    if legacy_payload:
        error_payload.update(legacy_payload)
    return Response({'error': error_payload}, status=status.HTTP_400_BAD_REQUEST)


def _resolve_target_user(target_uid: str | None) -> SiteUser | None:
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


class FriendRequestsSeePend(APIView):
    """Define the function to display friends and friend requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """List all pending friend requests for the authenticated user."""

        incoming_requests = Friendship.objects.filter(
            to_user=request.user,
            status='pending',
        ).select_related('from_user__profile', 'to_user__profile')
        outgoing_requests = Friendship.objects.filter(
            from_user=request.user,
            status='pending',
        ).select_related('from_user__profile', 'to_user__profile')

        incoming_profiles = [friendship.from_user.profile for friendship in incoming_requests]
        outgoing_profiles = [friendship.to_user.profile for friendship in outgoing_requests]

        incoming_serializer = FriendUserSerializer(
            incoming_profiles,
            many=True,
            context={'request': request, 'relation': 'incoming'},
        )
        outgoing_serializer = FriendUserSerializer(
            outgoing_profiles,
            many=True,
            context={'request': request, 'relation': 'outgoing'},
        )

        return Response(
            {
                'incoming': incoming_serializer.data,
                'outgoing': outgoing_serializer.data,
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

        query = _get_request_data_value(request, 'search', 'q')
        if query is None:
            return _error_response({'search': 'MISSING_FIELD'}, {'q': 'MISSING_FIELD'})

        profiles = (
            Profile.objects.filter(username__icontains=query)
            .exclude(user=request.user)
            .filter(user__isnull=False)
            .select_related('user')
        )

        users = []
        for profile in profiles:
            users.append(
                FriendUserSerializer(
                    profile,
                    context={
                        'request': request,
                        'relation': _friendship_relation(request.user, profile),
                    },
                ).data,
            )

        return Response({'users': users}, status=status.HTTP_200_OK)

class FriendRequestsRespond(APIView):
    """Define the functions related to accepting friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Accept or refuse a pending friend request."""

        target_uid = _get_request_data_value(request, 'target-uid', 'user_uid', 'user-uid')
        target_username = _get_request_data_value(request, 'target-username', 'user-username')
        new_status = request.data.get('new-status')

        error_payload: dict[str, str] = {}
        legacy_error_payload: dict[str, str] = {}
        if target_uid is None:
            error_payload['target-uid'] = 'MISSING_FIELD'
            legacy_error_payload['user_uid'] = 'MISSING_FIELD'
        if new_status is None:
            error_payload['new-status'] = 'MISSING_FIELD'
        if error_payload:
            return _error_response(error_payload, legacy_error_payload)

        if new_status == 'reject':
            new_status = 'refuse'

        target_user = _resolve_target_user(target_uid)
        if target_user is None:
            return _error_response(
                {'target-uid': 'USER_NOT_FOUND'},
                {'user_uid': 'USER_NOT_FOUND', 'user-uid': 'USER_NOT_FOUND'},
            )

        sender = target_user
        user = request.user
        curr_relationship = Friendship.objects.filter(from_user=sender, to_user=user).first()
        if curr_relationship and curr_relationship.status == 'pending':
            if new_status == 'accept':
                curr_relationship.status = 'accepted'
                curr_relationship.save(update_fields=['status'])
                return Response(
                    {
                        'description': 'FRIENDSHIP_REQUEST_ACCEPTED',
                        'target-uid': str(target_user.profile.uid),
                        'target-username': target_username or target_user.profile.username,
                        'user_uid': str(target_user.uid),
                        'user-uid': str(target_user.uid),
                    },
                    status=status.HTTP_200_OK,
                )
            if new_status == 'refuse':
                curr_relationship.delete()
                return Response(
                    {
                        'description': 'FRIENDSHIP_REQUEST_REJECTED',
                        'target-uid': str(target_user.profile.uid),
                        'target-username': target_username or target_user.profile.username,
                        'user_uid': str(target_user.uid),
                        'user-uid': str(target_user.uid),
                    },
                    status=status.HTTP_200_OK,
                )

        return Response({'error': {'friendship': 'FRIENDSHIP_NOT_FOUND'}}, status=status.HTTP_400_BAD_REQUEST)
            
class FriendRequestsSend(APIView):
    """Define the functions related to sending friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Send a new friend request."""

        target_uid = _get_request_data_value(request, 'target-uid', 'user_uid', 'user-uid')
        target_username = _get_request_data_value(request, 'target-username', 'user-username')

        if target_uid is None:
            return _error_response(
                {'target-uid': 'MISSING_FIELD'},
                {'user_uid': 'MISSING_FIELD', 'user-uid': 'MISSING_FIELD'},
            )

        recipient = _resolve_target_user(target_uid)
        if recipient is None:
            return _error_response(
                {'target-uid': 'USER_NOT_FOUND'},
                {'user_uid': 'USER_NOT_FOUND', 'user-uid': 'USER_NOT_FOUND'},
            )

        user = request.user
        if recipient == user:
            return Response({'error': {'friendship': 'REALLY_SAD'}}, status=status.HTTP_400_BAD_REQUEST)

        curr_relationship = Friendship.objects.filter(
            Q(from_user=user, to_user=recipient) | Q(from_user=recipient, to_user=user)
        ).first()
        if curr_relationship:
            return Response(
                {
                    'error': {'friendship': 'FRIENDSHIP_ALREADY_EXISTS'},
                    'request_status': curr_relationship.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        Friendship.objects.create(from_user=user, to_user=recipient, status='pending')
        return Response(
            {
                'description': 'FRIENDSHIP_REQUEST_SENT',
                'target-uid': str(recipient.profile.uid),
                'target-username': target_username or recipient.profile.username,
                'user_uid': str(recipient.uid),
                'user-uid': str(recipient.uid),
            },
            status=status.HTTP_201_CREATED,
        )
