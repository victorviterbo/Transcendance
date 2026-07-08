# Generated manually to fix on_delete behavior for room and playlist

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0003_alter_game_mode_alter_game_playlist'),
    ]

    operations = [
        migrations.AlterField(
            model_name='game',
            name='room',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.SET_NULL, to='chat.room'),
        ),
        migrations.AlterField(
            model_name='game',
            name='playlist',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='game', to='music.playlist'),
        ),
    ]