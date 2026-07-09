"""Limit game names to the public creation limit."""

from django.db import migrations, models


class Migration(migrations.Migration):
    """Apply the game name length constraint."""

    dependencies = [
        ('game', '0004_alter_game_room_playlist_on_delete'),
    ]

    operations = [
        migrations.AlterField(
            model_name='game',
            name='name',
            field=models.CharField(max_length=40),
        ),
    ]
