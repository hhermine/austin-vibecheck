// src/app/api/analyze-vibe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { logEvent, logError } from "@/lib/server-logger";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let locationId = "unknown";

  try {
    if (!apiKey) {
        logError("Genkit Flow Failed: Missing API Key", { flow: "analyzeVibe" });
        return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
    }

    const { id, name, description, photoUrl } = await req.json();
    locationId = id;

    logEvent("Genkit Flow Started: analyzeVibe", { 
        locationId, 
        locationName: name,
        hasPhoto: !!photoUrl 
    });

    if (!id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // STRICTLY using gemini-2.5-pro as mandated by user
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    let prompt = `Analyze this place in Austin, Texas called "${name}".
    Description provided: "${description}".
    
    Task:
    1. Generate a witty, Austin-style "vibe summary" (2-3 sentences). Use local slang if appropriate (e.g., "y'all", "Keep Austin Weird", "tacos").
    2. Rate the "Vibe Score" from 1-10 based on how cool/unique it seems. Be generous but realistic.
    3. Suggest 3 hashtags relevant to this spot.
    
    Output ONLY valid JSON format like this:
    {
      "vibeSummary": "...",
      "aiScore": 8,
      "hashtags": ["#...", "#...", "#..."]
    }`;

    let result;
    
    try {
        const parts: any[] = [prompt];

        if (photoUrl && photoUrl.startsWith("data:image")) {
            const base64Data = photoUrl.split(",")[1];
            const mimeType = photoUrl.split(";")[0].split(":")[1];

            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: mimeType || "image/jpeg",
              },
            });
        }

        result = await model.generateContent(parts);
        
    } catch (e: any) {
        logError("Gemini Generation Failed", e, { locationId, model: "gemini-2.5-pro" });
        // Returning specific error message to client for visibility
        return NextResponse.json({ error: `Gemini Error: ${e.message}` }, { status: 500 });
    }

    const responseText = result.response.text();
    
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let aiData;
    try {
        aiData = JSON.parse(cleanJson);
    } catch (e) {
        logError("Failed to parse AI JSON", e, { responseText });
        aiData = {
            vibeSummary: "The AI is feeling a bit weird today (Keep Austin Weird?), but this spot definitely has character!",
            aiScore: 8,
            hashtags: ["#austin", "#mystery", "#vibes"]
        };
    }

    const locRef = doc(db, "locations", id);
    await updateDoc(locRef, {
      ai_vibe_summary: aiData.vibeSummary,
      vibe_score: aiData.aiScore, 
      hashtags: aiData.hashtags,
      ai_processed: true
    });

    logEvent("Genkit Flow Completed: analyzeVibe", {
        locationId,
        durationMs: Date.now() - startTime,
        aiScore: aiData.aiScore
    });

    return NextResponse.json({ success: true, data: aiData });

  } catch (error: any) {
    logError("Genkit Flow Critical Error", error, { locationId });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
