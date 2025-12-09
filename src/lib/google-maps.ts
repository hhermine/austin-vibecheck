// src/lib/google-maps.ts
import { Loader } from "@googlemaps/js-api-loader";

// Singleton loader instance to prevent "Loader must not be called again with different options" error.
// We configure it with all potential libraries we might need app-wide.
export const mapLoader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  version: "weekly",
  libraries: ["places", "marker", "geocoding", "maps"], 
});
