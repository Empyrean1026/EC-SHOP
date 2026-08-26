import { connectToDatabase } from "@/lib/mongodb";
import type { ApiResponse } from "@/types/api";

type HealthData = {
  service: "ec-site";
  database: "connected";
  timestamp: string;
};

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();

    const body: ApiResponse<HealthData> = {
      success: true,
      data: {
        service: "ec-site",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    };

    return Response.json(body);
  } catch (error) {
    console.error("[api/health] MongoDB connection failed", error);

    const body: ApiResponse<never> = {
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "The database is currently unavailable.",
      },
    };

    return Response.json(body, { status: 503 });
  }
}
