// src/lib/seed-data.ts
import { collection, getDocs, addDoc, query, limit } from "firebase/firestore";
import { db } from "./firebase";

export interface Location {
  id?: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  vibe_score: number;
  description: string;
  photo?: string;
  // New AI fields
  ai_vibe_summary?: string;
  hashtags?: string[];
  ai_processed?: boolean;
}

const initialLocations: Omit<Location, "id">[] = [
  {
    name: "Jo's Coffee",
    category: "Food",
    lat: 30.2505,
    lng: -97.7502,
    vibe_score: 9,
    description: "Iconic coffee shop with the 'I love you so much' mural",
    ai_vibe_summary: "The quintessential Austin photo op with a side of caffeine. Grab an Iced Turbo and strike a pose, y'all.",
    hashtags: ["#iloveyousomuch", "#atxcoffee", "#soaustin"]
  },
  {
    name: "Zilker Park",
    category: "Park",
    lat: 30.2669,
    lng: -97.7729,
    vibe_score: 10,
    description: "Austin's most loved park, home to ACL",
    ai_vibe_summary: "The front lawn of Austin where dogs run free and frisbees fly high. Whether it's ACL or just a Tuesday, the vibes are immaculate.",
    hashtags: ["#zilkerpark", "#aclfest", "#atxparks"]
  },
  {
    name: "The Domain",
    category: "Shopping",
    lat: 30.4021,
    lng: -97.7253,
    vibe_score: 7,
    description: "Upscale outdoor shopping",
    ai_vibe_summary: "It's like downtown, but cleaner and with more parking. Perfect for when you want to feel fancy north of 183.",
    hashtags: ["#thedomain", "#atxshopping", "#northaustin"]
  },
  {
    name: "Rainey Street",
    category: "Nightlife",
    lat: 30.2574,
    lng: -97.7394,
    vibe_score: 8,
    description: "Historic bungalows turned bars",
    ai_vibe_summary: "Where historic bungalows meet craft cocktails and food trucks. It's a block party every night, just watch out for the scooters!",
    hashtags: ["#raineystreet", "#atxnightlife", "#sundayfunday"]
  },
  {
    name: "South Congress Ave",
    category: "Shopping",
    lat: 30.2490,
    lng: -97.7498,
    vibe_score: 9,
    description: "Eclectic shops and food",
    ai_vibe_summary: "The heartbeat of old-school Austin cool. Boots, bats, and boutiques line the street—Keep Austin Weird, indeed.",
    hashtags: ["#soco", "#keepaustinweird", "#atxstyle"]
  },
  {
    name: "The Elephant Room",
    category: "Music",
    lat: 30.2642,
    lng: -97.7444,
    vibe_score: 9,
    description: "Underground jazz bar with a classic vibe",
    ai_vibe_summary: "Step underground into a speakeasy vibe where the jazz is smooth and the lights are low. A true hidden gem in the Live Music Capital.",
    hashtags: ["#jazz", "#livemusic", "#undergroundatx"]
  },
  {
    name: "Hope Outdoor Gallery",
    category: "Art",
    lat: 30.2760,
    lng: -97.7533,
    vibe_score: 8,
    description: "Community paint park (Historic location)",
    ai_vibe_summary: "A colorful chaos of spray paint and creativity. It's messy, it's loud, and it's 100% Austin art culture.",
    hashtags: ["#graffitipark", "#streetart", "#hopeoutdoorgallery"]
  }
];

export const seedLocations = async () => {
  try {
    const collectionRef = collection(db, "locations");
    
    // Check if collection has ANY documents (limit 1 is enough to know)
    const q = query(collectionRef, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("Database is empty. Seeding initial locations...");
      
      const promises = initialLocations.map(loc => {
        // Add timestamp for ordering if needed later
        return addDoc(collectionRef, {
            ...loc,
            createdAt: new Date()
        });
      });
      
      await Promise.all(promises);
      console.log(`Successfully seeded ${initialLocations.length} locations!`);
    } else {
      console.log("Database already has data. Skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};
