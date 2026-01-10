import { NextResponse } from "next/server";
import { mqttStore } from "@/lib/mqttStore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ speakerId: string }> }
) {
  try {
    const { speakerId } = await params;
    const speaker = mqttStore.getSpeaker(speakerId);

    if (!speaker) {
      return NextResponse.json(
        { error: "Speaker not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      speaker,
      connected: mqttStore.isConnected(),
    });
  } catch (error) {
    console.error("[API] Error fetching speaker:", error);
    return NextResponse.json(
      { error: "Failed to fetch speaker" },
      { status: 500 }
    );
  }
}

