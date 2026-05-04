---
title: Telegram Notifications
---

# Telegram Notifications

Telegram is currently implemented through Supabase Edge Functions and database webhooks.

## Environment Variables

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_BOT_TOKEN_USER`
- `TELEGRAM_CHAT_ID_USER`
- `APP_URL`

Set these as Supabase function secrets, not in public config.

Database trigger functions also read deployment-specific webhook URLs from database settings:

- `app.settings.telegram_item_webhook_url`
- `app.settings.telegram_user_webhook_url`

If a setting is missing, the trigger returns without calling an Edge Function. This keeps the upstream schema forkable and avoids shipping project-specific URLs.

## Current Function Names

The current functions are named:

- `notifiy-telegram`
- `notifiy-telegram-user`

The typo is part of the current deployed surface and should only be renamed with a migration plan for triggers/webhooks.

## Setup

1. Create a bot with BotFather.
2. Add the bot to the target admin group.
3. Send a test message in the group.
4. Read updates from `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates` and copy the chat id.
5. Store secrets with the Supabase CLI or dashboard.
6. Deploy the Edge Function.
7. Configure the database setting for the matching webhook URL.
8. Enable the database trigger.

## Planned Improvements

- Send only the first notification for a user's pending queue until an admin views the latest request.
- Allow admins to mute a user permanently, for one day, or for one week.
- Define the final database-setting workflow for webhook URLs and bearer tokens.
- Rename functions only when triggers and docs can be migrated safely.
