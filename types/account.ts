import type { UserRole } from "@/models";
import type { CatalogProduct } from "@/types/product";

export type AccountAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type AccountProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  address: AccountAddress | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountDashboard = {
  orderCount: number;
  wishlistCount: number;
  hasAddress: boolean;
};

export type AccountWishlist = {
  items: CatalogProduct[];
  productIds: string[];
  count: number;
};
