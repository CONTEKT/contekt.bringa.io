# Create Telegram Bot to notify about database changes

## Create Bot

1. Open BotFather chat
2. Start a chat with the BotFather
3. Type /newbot
4. Follow the instructions to create a new bot
5. Save the Token.


## Add Bot to Group

1. Crate a new Group
2. Add the Bot to the Group
3. Give the bot admin permissions to receive and send messages
4. Write 'test' into the chat.
5. visit: https://api.telegram.org/bot<BotToken>/getUpdates
6. Copy the chatId from the response

## Configure Supabase

1. Download Supabase cli
2. Login to Supabase
3. Create a new function: `npx supabase functions create notify-telegram`
4. Add credentials to the function: `npx supabase functions secrets set notify-telegram BOT_TOKEN=<BotToken> CHAT_ID=<ChatId>`

## Deploy Function

1. Deploy the function: `npx supabase functions deploy notify-telegram`
2. Save the url you get from deploying

## Enable function via WebHook

1. In Supbase -> Database > WebHooks -> create new webhook
2. Enter webhhook name
3. Select trigger type
4. Webhook Configuration: supabase Edge Function
5. Edge Function type: POST
6. Webhook URL: <url you saved from deploying>
7. Create Webhook
