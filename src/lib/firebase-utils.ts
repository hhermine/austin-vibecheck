// src/lib/firebase-utils.ts
import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";
import { logEvent, logError } from "./client-logger"; // Use CLIENT logger

// Wrapper to safely add document and return the reference
export const safeAddLocation = async (data: any): Promise<string> => {
  const startTime = Date.now();
  try {
     logEvent("Firestore Write Started: addLocation", { name: data.name });
     
     const docRef = await addDoc(collection(db, 'locations'), data);
     
     logEvent("Firestore Write Completed", { 
         docId: docRef.id, 
         durationMs: Date.now() - startTime 
     });
     
     return docRef.id;
  } catch (error: any) {
    logError("Firestore Write Failed", error, { name: data.name });
    throw error;
  }
};
