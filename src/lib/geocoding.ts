// src/lib/geocoding.ts
import { mapLoader } from "./google-maps";

let geocoder: google.maps.Geocoder | null = null;
let autocompleteService: google.maps.places.AutocompleteService | null = null;

// Initialize both Geocoder and Autocomplete Service
const initServices = async () => {
  if (geocoder && autocompleteService) return;

  try {
    // Import both libraries
    await mapLoader.importLibrary("geocoding");
    await mapLoader.importLibrary("places");
    
    if (typeof google !== "undefined" && google.maps) {
      if (!geocoder) geocoder = new google.maps.Geocoder();
      if (!autocompleteService) autocompleteService = new google.maps.places.AutocompleteService();
    }
  } catch (e) {
    console.error("Failed to load Google Maps libraries", e);
  }
};

export const getGeocode = async (address: string) => {
  await initServices();
  if (!geocoder) return null;
  
  return new Promise<{ lat: number; lng: number } | null>((resolve) => {
    try {
        geocoder!.geocode({ address }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const { lat, lng } = results[0].geometry.location;
            resolve({ lat: lat(), lng: lng() });
          } else {
            console.warn("Geocode failed:", status);
            resolve(null);
          }
        });
    } catch (err) {
        console.error("Geocoding API error (likely not enabled):", err);
        resolve(null);
    }
  });
};

// New function to get autocomplete suggestions
export const getPlacePredictions = async (input: string) => {
  await initServices();
  if (!autocompleteService) return [];

  return new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
    try {
        autocompleteService!.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'us' },
            locationBias: {
                radius: 50000,
                center: { lat: 30.2672, lng: -97.7431 }
            }
          },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              resolve(predictions);
            } else {
              // Silently fail if API is not enabled or quota exceeded
              if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                 console.warn("Autocomplete failed:", status);
              }
              resolve([]);
            }
          }
        );
    } catch (err) {
        console.error("Autocomplete API error (likely not enabled):", err);
        resolve([]);
    }
  });
};
