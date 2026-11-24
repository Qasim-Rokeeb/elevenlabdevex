import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId || apiKey.includes("your_") || voiceId.includes("your_")) {
      return NextResponse.json(
        { error: "ElevenLabs credentials are missing. Add your API key and voice ID to .env." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const speed = typeof body?.speed === "number" ? body.speed : 1;

    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
            speed,
          },
        }),
      }
    );

    if (!response.ok) {
      let message = "Unable to generate speech.";
      try {
        const data = await response.json();
        message =
          data?.detail?.message ||
          data?.detail?.status ||
          data?.message ||
          message;
      } catch {
        // ignore JSON parse errors
      }
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const audio = await response.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while generating speech." },
      { status: 500 }
    );
  }
}
