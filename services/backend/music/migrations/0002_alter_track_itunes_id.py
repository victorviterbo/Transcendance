from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("music", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="track",
            name="itunes_id",
            field=models.BigIntegerField(
                primary_key=True,
                serialize=False,
                unique=True,
            ),
        ),
    ]
