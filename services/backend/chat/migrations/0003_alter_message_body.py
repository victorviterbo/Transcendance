"""Add the chat message length validator."""

import chat.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    """Apply chat message validation metadata."""

    dependencies = [
        ('chat', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='body',
            field=models.TextField(validators=chat.validators.chat_message_body_validators),
        ),
    ]
