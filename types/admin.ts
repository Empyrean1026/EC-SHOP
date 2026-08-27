import type { UserRole } from "@/models";
import type { OrderDetail, OrderHistoryItem } from "@/types/order";
import type { CatalogProduct, PaginationMeta } from "@/types/product";

export type AdminDashboardSummary = {
  products: number;
  activeProducts: number;
  lowStockProducts: number;
  orders: number;
  openOrders: number;
  users: number;
};

export type AdminCustomerSummary = {
  id: string;
  name: string;
  email: string;
};

export type AdminOrderItem = OrderHistoryItem & { customer: AdminCustomerSummary | null };
export type AdminOrderDetail = OrderDetail & { customer: AdminCustomerSummary | null };

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  hasAddress: boolean;
  orderCount: number;
  createdAt: string;
};

export type AdminProductListResult = { items: CatalogProduct[]; pagination: PaginationMeta };
export type AdminOrderListResult = { items: AdminOrderItem[]; pagination: PaginationMeta };
export type AdminUserListResult = { items: AdminUserItem[]; pagination: PaginationMeta };
