import type { Schema } from "mongoose";

export function configureJsonSerialization(schema: Schema, hiddenFields: string[] = []): void {
  schema.set("toJSON", {
    virtuals: true,
    transform: (_document, returnedObject) => {
      const serialized = returnedObject as Record<string, unknown>;

      if (serialized._id) {
        serialized.id = String(serialized._id);
      }

      delete serialized._id;
      delete serialized.__v;

      for (const field of hiddenFields) {
        delete serialized[field];
      }

      return serialized;
    },
  });
}
