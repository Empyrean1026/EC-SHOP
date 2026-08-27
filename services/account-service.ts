import "server-only";

import { connectToDatabase } from "@/lib/mongodb";
import { toAccountProfile } from "@/lib/account/dto";
import type { UpdateAddressInput, UpdateProfileInput } from "@/lib/validations/account";
import { OrderModel, UserModel, WishlistModel } from "@/models";
import type { AccountDashboard, AccountProfile } from "@/types/account";

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  await connectToDatabase();
  const user = await UserModel.findById(userId)
    .select("_id name email role avatar address createdAt updatedAt")
    .lean();

  return user ? toAccountProfile(user) : null;
}

export async function updateAccountProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<AccountProfile | null> {
  await connectToDatabase();
  const update = input.avatar
    ? { $set: { name: input.name, avatar: input.avatar } }
    : { $set: { name: input.name }, $unset: { avatar: 1 } };
  const user = await UserModel.findByIdAndUpdate(userId, update, {
    returnDocument: "after",
    runValidators: true,
  })
    .select("_id name email role avatar address createdAt updatedAt")
    .lean();

  return user ? toAccountProfile(user) : null;
}

export async function updateAccountAddress(
  userId: string,
  input: UpdateAddressInput,
): Promise<AccountProfile | null> {
  await connectToDatabase();
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { address: input } },
    { returnDocument: "after", runValidators: true },
  )
    .select("_id name email role avatar address createdAt updatedAt")
    .lean();

  return user ? toAccountProfile(user) : null;
}

export async function removeAccountAddress(userId: string): Promise<AccountProfile | null> {
  await connectToDatabase();
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $unset: { address: 1 } },
    { returnDocument: "after", runValidators: true },
  )
    .select("_id name email role avatar address createdAt updatedAt")
    .lean();

  return user ? toAccountProfile(user) : null;
}

export async function getAccountDashboard(userId: string): Promise<AccountDashboard> {
  await connectToDatabase();
  const [orderCount, wishlist, user] = await Promise.all([
    OrderModel.countDocuments({ userId }),
    WishlistModel.findOne({ userId }).select("productIds").lean(),
    UserModel.findById(userId).select("address").lean(),
  ]);

  return {
    orderCount,
    wishlistCount: wishlist?.productIds.length ?? 0,
    hasAddress: Boolean(user?.address),
  };
}
