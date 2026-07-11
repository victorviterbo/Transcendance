from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("game", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="game",
            name="last_activity_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="game",
            name="status",
            field=models.CharField(
                choices=[
                    ("waiting", "Waiting for players"),
                    ("playing_round", "Game Round in progress"),
                    ("playing_break", "Game Break in progress"),
                    ("finished", "Game finished"),
                    ("aborted", "Game aborted"),
                ],
                default="waiting",
                max_length=20,
            ),
        ),
    ]
