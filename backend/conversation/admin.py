from django.contrib import admin
from .models import Conversation, ConversationMember

admin.site.register(Conversation)
admin.site.register(ConversationMember)
