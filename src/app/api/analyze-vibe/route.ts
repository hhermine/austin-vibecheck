// src/app/api/analyze-vibe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";
import { adminDb } from "@/lib/firebase-admin"; // Use Admin SDK
import { logEvent, logError } from "@/lib/server-logger";

// Initialize Vertex AI
// We use us-central1 as a safe default for Vertex AI model availability
const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "workshop-starter-480301";
const location = "us-central1"; 
const vertex_ai = new VertexAI({ project: project, location: location });

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let locationId = "unknown";

  try {
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
    // Using Vertex AI instantiation
    const model = vertex_ai.getGenerativeModel({ model: "gemini-2.5-pro" });

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
        const parts: any[] = [{ text: prompt }];

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

        result = await model.generateContent({
            contents: [{ role: 'user', parts }]
        });
        
    } catch (e: any) {
        logError("Vertex AI Generation Failed", e, { locationId, model: "gemini-2.5-pro" });
        return NextResponse.json({ error: `Vertex AI Error: ${e.message}` }, { status: 500 });
    }

    // Vertex AI response structure is slightly different but usually has candidates
    const responseText = result.response.candidates?.[0].content.parts[0].text;
    
    if (!responseText) {
        throw new Error("Empty response from Vertex AI");
    }

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

    // Use Admin SDK to update (Bypasses security rules)
    await adminDb.collection("locations").doc(id).update({
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
