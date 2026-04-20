# Supabase Storage & Database Setup

## 1. Create Storage Bucket
1.  Go to your Supabase Dashboard -> **Storage**.
2.  Click **"New Bucket"**.
3.  Name the bucket: `items`.
4.  Toggle **"Public bucket"** to `ON`.
5.  Click **"Save"**.

## 2. Storage Policies (RLS)
Run this in the **SQL Editor** to allow image uploads and viewing:

```sql
-- Allow public read access to the 'items' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'items' );

-- Allow authenticated users to upload images
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'items'
  and auth.role() = 'authenticated'
);
```

## 3. Database Schema Updates
**Run this in the SQL Editor to completely replace the table:**

```sql
-- 1. Drop the existing table (CASCADE ensures dependent objects are removed)
DROP TABLE IF EXISTS public.items CASCADE;

-- 2. Create the new table
CREATE TABLE public.items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'inStock' CHECK (status IN ('inStock', 'borrowed')),
  image_url text,
  borrowed_by uuid REFERENCES auth.users(id), -- The user who currently has the item
  created_by uuid REFERENCES auth.users(id)   -- The user who created the item
);

-- 3. Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
CREATE POLICY "Enable read access for all users"
ON public.items FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
ON public.items FOR UPDATE
USING (auth.role() = 'authenticated');
```
