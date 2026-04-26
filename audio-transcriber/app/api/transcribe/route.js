import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { transcribeAudio } from "@/lib/gemini";
import prisma from "@/lib/db";

export async function POST(request) {
  try {
    // 1. Verify the user is logged in
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the uploaded form data
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // 3. Validate file type
    const allowedTypes = [
      "audio/mpeg", "audio/mp3", "audio/wav", "audio/webm",
      "audio/ogg", "audio/m4a", "audio/mp4", "audio/aac",
    ];
    
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${audioFile.type}. Use mp3, wav, webm, or m4a.` },
        { status: 400 }
      );
    }

    // 4. Convert audio file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    console.log(`Processing audio: ${audioFile.name} (${audioFile.type})`);

    // 5. Send to Gemini for transcription
    const transcript = await transcribeAudio(base64Audio, audioFile.type);

    if (!transcript) {
      return NextResponse.json(
        { error: "Could not transcribe audio. Try a clearer recording." },
        { status: 422 }
      );
    }

    // 6. Save transcript to database (NOT the audio file)
    const saved = await prisma.transcript.create({
      data: {
        filename: audioFile.name,
        transcript: transcript,
      },
    });

    return NextResponse.json({
      success: true,
      id: saved.id,
      transcript: saved.transcript,
      filename: saved.filename,
    });

  } catch (error) {
    console.error("Transcription error:", error);
    
    // Gemini-specific error handling
    if (error.message?.includes("API_KEY")) {
      return NextResponse.json(
        { error: "Gemini API key is invalid or missing" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 500 }
    );
  }
}

// Get all transcripts
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transcripts = await prisma.transcript.findMany({
      orderBy: { createdAt: "desc" }, // Newest first
    });

    return NextResponse.json({ transcripts });
  } catch (error) {
    console.error("Fetch transcripts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcripts" },
      { status: 500 }
    );
  }
}