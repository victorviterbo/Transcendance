from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import SiteUser, Profile

@receiver(post_save, sender=SiteUser)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    
@receiver(post_save, sender=SiteUser)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()

@receiver(pre_delete, sender=SiteUser)
def delete_profile(sender, instance, **kwargs):
    instance.profile.delete()
