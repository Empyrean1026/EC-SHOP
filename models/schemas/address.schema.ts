import { type InferSchemaType, Schema } from "mongoose";

export const addressSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Address full name is required"],
      trim: true,
      minlength: [2, "Address full name must contain at least 2 characters"],
      maxlength: [100, "Address full name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      minlength: [7, "Phone number must contain at least 7 characters"],
      maxlength: [30, "Phone number cannot exceed 30 characters"],
    },
    line1: {
      type: String,
      required: [true, "Address line 1 is required"],
      trim: true,
      maxlength: [200, "Address line 1 cannot exceed 200 characters"],
    },
    line2: {
      type: String,
      trim: true,
      maxlength: [200, "Address line 2 cannot exceed 200 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      maxlength: [20, "Postal code cannot exceed 20 characters"],
    },
    country: {
      type: String,
      required: [true, "Country code is required"],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{2}$/, "Country must be a 2-letter ISO code"],
    },
  },
  {
    _id: false,
  },
);

export type Address = InferSchemaType<typeof addressSchema>;
