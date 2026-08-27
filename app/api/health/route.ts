import { connectToDatabase } from "@/lib/mongodb";
import { apiInternalError, apiSuccess } from "@/lib/api/response";

type HealthData = {
  service: "ec-site";
  database: "connected";
  timestamp: string;
};

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();
    const data: HealthData = {
      service: "ec-site",
      database: "connected",
      timestamp: new Date().toISOString(),
    };
    return apiSuccess(data);
  } catch (error) {
    return apiInternalError(
      error,
      "api.health.database",
      "The database is currently unavailable.",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }
}
