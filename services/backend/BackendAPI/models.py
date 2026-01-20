from __future__ import annotations

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class SiteUserManager(BaseUserManager):
    """Define a model manager for User model.
     
    User is identified with a unique email and password.
    
    """

    def gmail_specific_normalize(self, email: str) -> str:
        """Normalizes a Gmail address.
        
        It removed dots (which are ingored by Gmail) and
        plus-suffixes (which are used to create dummy aliases on gmail).

        Args:
            email: the Django-Normalized Gmail address
        Returns:
            The normalized Gmail address ensuring uniqueness from Gmail viewpoint
        Raises:
            ValueError: If the email does not contain exactly one '@' symbol
            ValueError: If the email startswith '+' (forbidden by Gmail)
        """
        if email.count("@") != 1:
            raise ValueError("Invalid Email Address")
        if (email.startswith("+")):
            raise ValueError("Invalid Gmail Address")
        name, domain = email.split("@")
        name = name.replace(".", "")
        name = name.split("+")[0]
        return ("@").join([name, domain])

    def _create_user(self, email: str,
                     password: str,
                     **extra_fields: dict) -> SiteUser:
        """Create a user from the passed arguments.

        Args:
            email: unique email-adress defining a user
            password: the password to be associated with this user
            extra_fields: dictionary of additional flags
        Returns:
            a wsUser class instance
        Raises:
            ValueError: If the email passed does not contains '@'
            ValueError: If no password is passed
            ValueError: If gmail address canonization failed
        """
        if not email:
            raise ValueError('Invaid Email Address')
        if not password:
            raise ValueError('No password was provided')
        email = self.normalize_email(email)
        if (email.endswith("@gmail.com")):
            try:
                email = self.gmail_specific_normalize(email)
            except ValueError as e:
                raise ValueError(f"Gmail normalization failed: {e}") from e
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str,
                    password: str,
                    **extra_fields: dict) -> SiteUser:
        """Create a regular user from the passed arguments.

        Args:
            email: unique email-adress defining a user
            password: the password to be associated with this user
            username: the username displayed to other users
            extra_fields: dictionary of additional flags
        Returns:
            a wsUser regular user class instance
        Raises:
            ValueError: If email or password are invalids
        """
        extra_fields.setdefault('username', "Anonymous")
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        try:
            newuser = self._create_user(email, password, **extra_fields)
            return newuser
        except ValueError as e:
            raise ValueError(f"Could not create regular user: {e}") from e

    def create_superuser(self, email: str,
                         password: str | None,
                         **extra_fields: dict) -> SiteUser:
        """Create a super user from the passed arguments.

        Args:
            email: unique email-adress defining a user
            password: the password to be associated with this user
            username: the username displayed to other users
            extra_fields: dictionary of additional flags
        Returns:
            a wsUser super user class instance
        Raises:
            ValueError: If email or password are invalids
        """
        extra_fields.setdefault('username', "Anonymous")
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        try:
            newuser = self._create_user(email, password, **extra_fields)
            return newuser
        except ValueError as e:
            raise ValueError(f"Could not create super user: {e}") from e

class SiteUser(AbstractUser):
    """Define the structure of wsUser, derived from AbstractUser."""

    email = models.EmailField('email', unique=True, null=False, blank=False)
    username = models.CharField(max_length=150, unique=False, default="Anonymous")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    manager = SiteUserManager() 

    def __str__(self) -> str:
        """Return the user as it's email address string."""
        return self.email