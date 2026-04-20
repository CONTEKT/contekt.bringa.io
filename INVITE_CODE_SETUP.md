# Invite Code System Setup

## Übersicht
Das Invite Code System ermöglicht es Admins, den Zugang zur App über individuelle Einladungscodes zu kontrollieren.

## Datenbank-Migration

### Schritt 1: SQL-Migration ausführen
Führe die folgende SQL-Migration in deiner Supabase-Datenbank aus:

```sql
-- Migration: Add invite code system
-- This migration adds the invite code functionality to the database

-- 1. Add invite_code column to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS invite_code TEXT NOT NULL DEFAULT 'BRINGA2024';

-- 2. Add profile_valid and invited_by_code columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_valid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS invited_by_code TEXT;

-- 3. Set all admins to profile_valid = true
UPDATE profiles
SET profile_valid = true
WHERE id IN (
    SELECT profile_id FROM admins
);

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_valid ON profiles(profile_valid);
CREATE INDEX IF NOT EXISTS idx_admins_invite_code ON admins(invite_code);

-- 5. Add comment for documentation
COMMENT ON COLUMN profiles.profile_valid IS 'Indicates if user has entered a valid invite code';
COMMENT ON COLUMN profiles.invited_by_code IS 'The invite code used by this user to gain access';
COMMENT ON COLUMN admins.invite_code IS 'Unique invite code for this admin to share with users';
```

### Schritt 2: Migration in Supabase ausführen

1. Gehe zu deinem Supabase Dashboard
2. Navigiere zu **SQL Editor**
3. Erstelle eine neue Query
4. Kopiere die SQL-Migration oben
5. Führe die Query aus

## Wie es funktioniert

### Für neue Benutzer:
1. Benutzer meldet sich mit GitHub an
2. Nach erfolgreichem Login wird geprüft, ob `profile_valid = true`
3. Wenn `false`, wird der Benutzer zur `/invite` Seite weitergeleitet
4. Benutzer gibt den Invite Code ein
5. System prüft, ob der Code in der `admins` Tabelle existiert
6. Bei Erfolg: `profile_valid = true` und `invited_by_code` wird gespeichert
7. Benutzer wird zum Dashboard weitergeleitet

### Für Admins:
1. Admins haben automatisch `profile_valid = true`
2. Jeder Admin hat einen eigenen `invite_code` in der `admins` Tabelle
3. Admins können ihren Code unter `/admin/invite-code` verwalten:
   - Aktuellen Code anzeigen
   - Code kopieren
   - Neuen Code generieren
   - Code manuell ändern

### Wichtige Punkte:
- Jeder Admin hat seinen eigenen Invite Code
- Der verwendete Code wird beim User gespeichert (`invited_by_code`)
- Nachvollziehbarkeit: Man kann sehen, welcher Admin welchen User eingeladen hat
- Einmal validierte User bleiben validiert, auch wenn der Code sich ändert
- Der Code muss in der `admins` Tabelle existieren, um gültig zu sein

## Standard-Code
Der Standard-Code ist: **BRINGA2024**

Admins können diesen Code in der Admin-Oberfläche ändern.

## Neue Routen

- `/invite` - Invite Code Eingabe-Seite (für neue User)
- `/admin/invite-code` - Invite Code Verwaltung (nur für Admins)

## Sicherheit

- Codes werden in Großbuchstaben gespeichert
- Nur Codes, die in der `admins` Tabelle existieren, sind gültig
- User können nur einmal einen Code eingeben
- Admins sind automatisch validiert
