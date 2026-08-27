import assert from "node:assert/strict";
import test from "node:test";
import { toAccountAddress, toAccountProfile } from "@/lib/account/dto";
import {
  updateAddressSchema,
  updateProfileSchema,
  wishlistProductSchema,
} from "@/lib/validations/account";

test("profile validation trims fields and only accepts HTTP avatar URLs", () => {
  const valid = updateProfileSchema.safeParse({
    name: "  Test Customer  ",
    avatar: "https://example.com/avatar.jpg",
  });
  const cleared = updateProfileSchema.safeParse({ name: "Test Customer", avatar: "" });
  const invalid = updateProfileSchema.safeParse({
    name: "T",
    avatar: "javascript:alert(1)",
    role: "admin",
  });

  assert.equal(valid.success, true);
  assert.equal(valid.success ? valid.data.name : null, "Test Customer");
  assert.equal(cleared.success ? cleared.data.avatar : "invalid", null);
  assert.equal(invalid.success, false);
});

test("address validation normalizes country and rejects unsafe contact fields", () => {
  const valid = updateAddressSchema.safeParse({
    fullName: "Test Customer",
    phone: "+81 90 1234 5678",
    line1: "1-2-3 Ginza",
    line2: "",
    city: "Chuo-ku",
    state: "Tokyo",
    postalCode: "104-0061",
    country: "jp",
  });
  const invalid = updateAddressSchema.safeParse({
    fullName: "Test Customer",
    phone: "<script>",
    line1: "1-2-3 Ginza",
    line2: "",
    city: "Chuo-ku",
    state: "Tokyo",
    postalCode: "104-0061",
    country: "Japan",
  });

  assert.equal(valid.success, true);
  assert.equal(valid.success ? valid.data.country : null, "JP");
  assert.equal(invalid.success, false);
});

test("wishlist inputs require a strict MongoDB product identifier", () => {
  assert.equal(
    wishlistProductSchema.safeParse({ productId: "507f1f77bcf86cd799439011" }).success,
    true,
  );
  assert.equal(wishlistProductSchema.safeParse({ productId: "invalid" }).success, false);
  assert.equal(
    wishlistProductSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      userId: "507f1f77bcf86cd799439012",
    }).success,
    false,
  );
});

test("account DTOs expose only editable profile and normalized address fields", () => {
  const profile = toAccountProfile({
    _id: "507f1f77bcf86cd799439011",
    name: "Test Customer",
    email: "customer@example.com",
    role: "customer",
    avatar: null,
    address: {
      fullName: "Test Customer",
      phone: "+81 90 1234 5678",
      line1: "1-2-3 Ginza",
      city: "Chuo-ku",
      postalCode: "104-0061",
      country: "JP",
    },
    passwordHash: "must-not-leak",
    createdAt: new Date("2026-08-27T00:00:00.000Z"),
    updatedAt: new Date("2026-08-27T01:00:00.000Z"),
  });

  assert.equal(profile.id, "507f1f77bcf86cd799439011");
  assert.equal(profile.address?.line2, "");
  assert.equal("passwordHash" in profile, false);
  assert.deepEqual(toAccountAddress(null), null);
});
