export interface ItemDb {
  id: string; // UUID
  borrowed_by: string | null; // UUID of the borrower
  name: string;
  description: string | null;
  status: "inStock" | "borrowed";
  image_url: string | null; // Matches DB column name
  created_by: string | null;
}

export interface BorrowedItem extends ItemDb {
  status: "borrowed";
}

export interface Member {
  id: string; // UUID
  name: string;
  surname: string;
  email: string;
  password: string;
  organisation: string;
  borrowedItems: BorrowedItem[];
}

export interface Organization {
  id: number;
  name: string;
  location: string;
  members: Member[];
  items: ItemDb[];
}

export interface Profile {
  id: string; // UUID
  email: string;
  display_name: string | null;
  display_surname: string | null;
  avatar_url: string | null;
  description: string | null;
  profile_valid: boolean; // Whether user has entered valid invite code
  invited_by_code: string | null; // The invite code used by this user
  created_at: string;
  updated_at: string;
}

export interface BorrowHistory {
  id: string; // UUID
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

export interface Admin {
  id: string; // UUID
  profile_id: string;
  invite_code: string; // Unique invite code for this admin
  created_at: string;
}
