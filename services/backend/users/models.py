"""This module implements the user datas to be stored in the database.

The following models are defines:
    - SiteUser (and it's manager)
    - Profile
"""
from __future__ import annotations

from typing import Any

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from PIL import Image


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

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    manager = SiteUserManager() 

    def __str__(self) -> str:
        """Return the user as it's email address string."""
        return self.email
    

class Profile(models.Model):
    """Define the structure of SiteUser, derived from AbstractUser."""
    user = models.OneToOneField(SiteUser, on_delete=models.CASCADE)
    image = models.ImageField(default='default.jpg', upload_to='profile_pics')
    def __str__(self) -> str:
        """Define how to output the object as string.

        Args:
            self: the Profile to be returned

        Returns:
            a string describing the profile
        """
        return f'{self.user.username} Profile'
    
    def save(self, *args: Any, **kwargs: Any) -> None:
        """Define how to save the object.

        Args:
            self: the Profile to be returned
            args: additional arguments that might be needed by the parent class
            kwargs: additional arguments that might be needed by the parent class
        """
        super().save(*args, **kwargs)
        img = Image.open(self.image.path)
        if img.height > 300 or img.width > 300:
            output_size = (300, 300)
            img.thumbnail(output_size)
            img.save(self.image.path)