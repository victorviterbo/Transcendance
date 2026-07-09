from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='active_ws_connections',
            field=models.PositiveIntegerField(default=0),
        ),
    ]