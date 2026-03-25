"""Override of the simple JWT authentication protocol for users."""

from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication, Token
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import SiteUser


class CookieJWTAuthentication(JWTAuthentication):
    """Custom authenticator class based on header for access token."""
    
    def authenticate(self, request: Request) -> tuple[SiteUser, Token] | None:
        """Define the authentication protocol, using JWT tokens.

        Args:
            request: 
        Returns:
            Success: a tuple of SiteUser and the validated token
                     request.user is set to the SiteUser
                     request.auth is set to validated_token
                     permissions are set (IsAuthenticated, IsAdminUser)
            Failure: 
                     InvalidToken: Token expired or blacklisted.
                     TokenError: Malformed token
                     None : other error
                        The authentication process default to
                            the next authentication protocol
                            (see DEFAULT_AUTHENTICATION_CLASSES)
                        if this is the last or only one:
                        request.user is set to AnonymousUser
                        request.auth is set to None
                        permissions are set (IsAuthenticated, IsAdminUser)
        """
        header = self.get_header(request)
        if header is None:
            return None
        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            if user:
                request.profile = user.profile
                return user, validated_token
            return None
        except InvalidToken as e:
            raise AuthenticationFailed(detail=e.detail) from e
        except TokenError as e:
            raise AuthenticationFailed(detail="Token is invalid or corrupted.") from e
        except Exception:
            return None
