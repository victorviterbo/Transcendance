"""This module implements the user datas to be stored in the database.

The following models are defines:
    - SiteUser (and it's manager)
    - Profile
"""
from __future__ import annotations

from typing import Any

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class SiteUserManager(BaseUserManager):
    """Define a model manager for User model.
     
    User is identified with a unique email and password.
    
    """

    def _create_user(self, email: str,
                     password: str,
                     **extra_fields: dict) -> SiteUser:
        """Create a user from the passed arguments.

        Args:
            email: unique email-adress defining a user
            password: the password to be associated with this user
            extra_fields: dictionary of additional flags
        Returns:
            a SiteUser class instance
        Raises:
            ValueError: If the email passed does not contains '@'
            ValueError: If no password is passed
            ValueError: If gmail address canonization failed
        """
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
            a SiteUser regular user class instance
        Raises:
            ValueError: If email or password are invalids
        """
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        newuser = self._create_user(email, password, **extra_fields)
        return newuser

    def create_superuser(self, email: str,
                         password: str,
                         **extra_fields: dict) -> SiteUser:
        """Create a super user from the passed arguments.

        Args:
            email: unique email-adress defining a user
            password: the password to be associated with this user
            username: the username displayed to other users
            extra_fields: dictionary of additional flags
        Returns:
            a SiteUser super user class instance
        Raises:
            ValueError: If email or password are invalids
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        try:
            newuser = self._create_user(email, password, **extra_fields)
            return newuser
        except ValueError as e:
            raise ValueError(f"Could not create super user: {e}") from e

class SiteUser(AbstractUser):
    """Define the structure of SiteUser, derived from AbstractUser."""

    email = models.EmailField('email', unique=True, null=False, blank=False)
    username = models.CharField(max_length=20, unique=True, default="Anonymous")
    friends = models.ManyToManyField("self",
                                     through='Friendship',
                                     blank=True,
                                     symmetrical=False #symmetrical=True : if you are friend with someone, they are friend with you
                                    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    manager = SiteUserManager() 

    def __str__(self) -> str:
        """Return the user as it's email address string."""
        return self.email


class Friendship(models.Model):
    """Define a Friend request status and infos."""
    from_user = models.ForeignKey(SiteUser,
                                  related_name='sent_requests',
                                  on_delete=models.CASCADE)
    to_user = models.ForeignKey(SiteUser,
                                related_name='received_requests',
                                on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'),
                                                      ('accepted', 'Accepted')])
    created_at = models.DateTimeField(auto_now_add=True)
