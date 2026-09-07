from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Project, ICPProfile


@receiver(post_save, sender=Project)
def create_icp_profile(sender, instance, created, **kwargs):
    """Create an empty ICPProfile for every new project."""
    if created:
        ICPProfile.objects.create(project=instance)
