import { NextResponse } from "next/server";
import { mqttStore } from "@/lib/mqttStore";

export async function GET() {
  try {
    const speakers = mqttStore.getAllSpeakers();
    return NextResponse.json({
      speakers,
      connected: mqttStore.isConnected(),
    });
  } catch (error) {
    console.error("[API] Error fetching speakers:", error);
    return NextResponse.json(
      { error: "Failed to fetch speakers" },
      { status: 500 }
    );
  }
}

