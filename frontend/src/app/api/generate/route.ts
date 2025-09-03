import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { image, prompt, mimeType, region } = await request.json();

    if (!image || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured." },
        { status: 500 }
      );
    }

    // Compose a prompt that includes region context if provided
    const regionInstruction = region
      ? `Apply the requested edits ONLY inside the highlighted region defined by normalized coordinates (x=${region.x.toFixed(
          3
        )}, y=${region.y.toFixed(3)}, w=${region.w.toFixed(
          3
        )}, h=${region.h.toFixed(3)}). Keep everything outside unchanged.`
      : "";

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inline_data: {
                data: image,
                mime_type: mimeType || "image/jpeg",
              },
            },
            { text: `${prompt}\n\n${regionInstruction}`.trim() },
          ],
        },
      ],
    };

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent";

    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Upstream API error", details: text },
        { status: 502 }
      );
    }

    const data = await response.json();

    const imagePart = data?.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inline_data && p.inline_data.data
    );

    if (imagePart?.inline_data?.data) {
      return NextResponse.json({ image: imagePart.inline_data.data });
    }

    const textPart = data?.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.text
    );
    return NextResponse.json(
      {
        error:
          "The API did not return an image. It might be due to a safety policy.",
        details: textPart?.text ?? "No details",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
