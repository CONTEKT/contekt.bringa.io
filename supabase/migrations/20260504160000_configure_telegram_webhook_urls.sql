CREATE OR REPLACE FUNCTION public.send_item_webhook()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  endpoint_url text;
BEGIN
  endpoint_url := NULLIF(current_setting('app.settings.telegram_item_webhook_url', true), '');
  IF endpoint_url IS NULL THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );

  PERFORM net.http_post(
    url := endpoint_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.telegram_bot_token', true), '')),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.send_user_webhook()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  endpoint_url text;
BEGIN
  endpoint_url := NULLIF(current_setting('app.settings.telegram_user_webhook_url', true), '');
  IF endpoint_url IS NULL THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );

  PERFORM net.http_post(
    url := endpoint_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.telegram_bot_token', true), '')),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
