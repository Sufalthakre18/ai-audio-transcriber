import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function transcribeAudio(base64Audio, mimeType) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Audio,
          mimeType: mimeType,
        },
      },
      "Transcribe this audio clearly and accurately. Only output the transcription text, nothing else. Ignore background noise.",
    ]);

    const response = await result.response;

    return response.text().trim() || "No transcription found";
  } catch (error) {
    console.error("Gemini error:", error);
    throw new Error("Transcription failed");
  }
}