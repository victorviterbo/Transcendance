"""This module implements the user datas to be stored in the database.

The following models are defines:
    - Friendship
"""
import uuid

from django.db import models
from userauth.models import SiteUser


class Friendship(models.Model):
    """Define a Friend request status and infos."""
    from_user = models.ForeignKey(SiteUser,
                                  related_name='sent_requests',
                                  on_delete=models.CASCADE)
    
    to_user = models.ForeignKey(SiteUser,
                                related_name='received_requests',
                                on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=[('pending', 'pending'),
                                                      ('accepted', 'accepted')])

    read = models.BooleanField(default=False)

    uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        """Contrains the model to prevent multiple friendrequests."""
        constraints = [
            models.UniqueConstraint(fields=['from_user', 'to_user'],
                                    name='unique_friend_request')
        ]