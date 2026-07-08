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
        print(f"Authenticating request: {request}\n")
        header = self.get_header(request)
        if header is None:
            return None
        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None
        try:
            print(f"Raw token: {raw_token}\n")
            validated_token = self.get_validated_token(raw_token)
            if not validated_token:
                raise AuthenticationFailed(detail="Token is invalid or corrupted.", code="TOKEN_INVALID")
            user = self.get_user(validated_token)
            if user:
                request.profile = user.profile
                return user, validated_token
            raise AuthenticationFailed(detail="User not found.", code="USER_NOT_FOUND")
        except InvalidToken as e:
            print("Invalid token error:", e.detail)
            raise AuthenticationFailed(detail=e.detail) from e
        except TokenError as e:
            print("Token error:", e.detail)
            raise AuthenticationFailed(detail="Token is invalid or corrupted.") from e
        except Exception as e:
            print("Unexpected error:", e)
            raise AuthenticationFailed(detail="Authentication failed due to an unexpected error.", code="AUTHENTICATION_OUTDATED")
