import { resetE2eDatabase } from "@/e2e/database";

export default async function globalSetup() {
  await resetE2eDatabase(true);
}
