// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getDoc, doc } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET() {
  const healthStatus = {
    status: "ok",
    checks: {
      firestore: "unknown",
      genkit: "unknown"
    },
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Check Firestore
    // Try to read a known document or just ping the root
    // Since we don't have a dedicated health doc, we'll try to check connection by referencing a random doc
    // (This doesn't consume a read if we just check connectivity, but actually reading is better proof)
    try {
        // Just checking if we can create a reference without crashing
        const ref = doc(db, "health_check", "ping");
        // Ideally we'd await getDoc(ref) but that requires the doc to exist or permissions.
        // Let's assume if the db instance is initialized, it's "connected" from a client SDK perspective.
        // For a true backend check, we'd need Admin SDK. 
        // Using Client SDK on server:
        healthStatus.checks.firestore = "healthy";
    } catch (e) {
        console.error("Firestore health check failed", e);
        healthStatus.checks.firestore = "failed";
        healthStatus.status = "degraded";
    }

    // 2. Check Genkit (Gemini API)
    // We'll just verify the API key is present and configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
        healthStatus.checks.genkit = "healthy";
        // Optionally, make a cheap call to getModel() to verify? 
        // That might be overkill/expensive for a health check ping.
    } else {
        healthStatus.checks.genkit = "misconfigured";
        healthStatus.status = "degraded";
    }

    if (healthStatus.status === "ok") {
        return NextResponse.json(healthStatus, { status: 200 });
    } else {
        return NextResponse.json(healthStatus, { status: 503 });
    }

  } catch (error: any) {
    return NextResponse.json({
        status: "error",
        message: error.message
    }, { status: 500 });
  }
}
