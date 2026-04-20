# Admin Feature Documentation

## Overview
The admin feature allows designated users to have elevated privileges to view all items in the system and track borrowing history.

## Database Schema

### `admins` Table
```sql
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);
```

**RLS Policies:**
- Only admins can read the admins table (self-referential check)

### `borrow_history` Table (Enhanced)
The existing `borrow_history` table now has RLS policies:
- Only admins can read all borrow history records
- All authenticated users can insert records (for logging borrows)

## Features

### 1. Admin Detection
- **Hook**: `useIsAdmin()` located in `src/hooks/useIsAdmin.ts`
- Checks if the current user's `profile_id` exists in the `admins` table
- Returns `{ isAdmin: boolean, loading: boolean }`

### 2. Admin View Button
- Located in the TopBar component
- Only visible to admin users
- Links to `/admin/dashboard`
- Uses ShieldCheck icon from lucide-react

### 3. Admin Dashboard (`/admin/dashboard`)
- Displays all items in the system (not filtered by user)
- Shows item status (In Stock / Borrowed)
- Clicking an item navigates to the item details page
- Protected route - non-admins are redirected to `/dashboard`

### 4. Enhanced Item Details for Admins
When an admin views an item detail page, they see:
- All standard item information
- **Last 3 Borrowers section** showing:
  - Borrower display name
  - Borrower email
  - Borrowed timestamp
  - Returned timestamp (or "Currently borrowed" if not returned)

### 5. Borrow History Tracking
All borrow and return actions are now logged:

**When borrowing:**
- Updates `items` table: `status = 'borrowed'`, `borrowed_by = user_id`
- Inserts into `borrow_history`: `item_id`, `borrower_id`, `borrowed_at`

**When returning:**
- Updates `items` table: `status = 'inStock'`, `borrowed_by = null`
- Updates `borrow_history`: Sets `returned_at` timestamp for the matching record

## Current Admins
- **totoius.bringa@gmail.com** (initial admin)

## Adding New Admins

### Via SQL:
```sql
INSERT INTO public.admins (profile_id)
SELECT id FROM public.profiles WHERE email = 'new.admin@example.com'
ON CONFLICT (profile_id) DO NOTHING;
```

### Via Supabase Dashboard:
1. Go to Table Editor → `admins`
2. Click "Insert row"
3. Select the `profile_id` from the profiles table
4. Save

## Security

### RLS Policies
1. **admins table**: Only users in the admins table can read it
2. **borrow_history table**: Only admins can read all records
3. **items table**: No RLS (all authenticated users can read/write)

### Access Control
- Admin dashboard redirects non-admins to regular dashboard
- Admin-specific UI elements only render for admin users
- Borrow history queries only execute for admin users

## File Structure
```
src/
├── app/
│   ├── admin/
│   │   └── dashboard/
│   │       └── page.tsx          # Admin dashboard
│   ├── items/
│   │   └── details/
│   │       └── page.tsx          # Enhanced with admin features
│   └── model/
│       └── model.ts              # Added Admin, BorrowHistory types
├── components/
│   └── ui/
│       └── topbar.tsx            # Added Admin View button
└── hooks/
    └── useIsAdmin.ts             # Admin detection hook
```

## TypeScript Interfaces

```typescript
export interface Admin {
  id: string;
  profile_id: string;
  created_at: string;
}

export interface BorrowHistory {
  id: string;
  item_id: string;
  borrower_id: string;
  borrowed_at: string;
  returned_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface BorrowHistoryWithProfile extends BorrowHistory {
  borrower: Profile;
}
```

## Testing Checklist

- [ ] Admin can see "Admin View" button in TopBar
- [ ] Non-admin cannot see "Admin View" button
- [ ] Admin can access `/admin/dashboard`
- [ ] Non-admin is redirected from `/admin/dashboard` to `/dashboard`
- [ ] Admin dashboard shows all items
- [ ] Clicking item from admin dashboard goes to item details
- [ ] Admin sees "Last 3 Borrowers" section on item details
- [ ] Non-admin does not see "Last 3 Borrowers" section
- [ ] Borrowing an item creates a record in `borrow_history`
- [ ] Returning an item updates `returned_at` in `borrow_history`
- [ ] Last 3 borrowers are displayed correctly with timestamps

## Future Enhancements
- Admin user management UI
- Bulk operations (mark multiple items as returned)
- Export borrow history to CSV
- Analytics dashboard (most borrowed items, etc.)
- Email notifications for admins when items are borrowed
