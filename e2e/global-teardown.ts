import { resetE2eDatabase } from "@/e2e/database";

export default async function globalTeardown() {
  await resetE2eDatabase(false);
}
