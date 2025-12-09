'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  collection, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { seedLocations, Location } from '@/lib/seed-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Flame, Sparkles, Hash, LogOut, User as UserIcon } from 'lucide-react';
import { AddLocationDialog } from '@/components/add-location-dialog';
import { TopVibesLeaderboard } from '@/components/top-vibes-leaderboard';
import { mapLoader } from '@/lib/google-maps'; 
import confetti from 'canvas-confetti';
import { toast } from "sonner";
import { AuthProvider, useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Separate the main content to use auth context
function AppContent() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, signInWithGoogle, signOut } = useAuth();

  // Initialize Data
  useEffect(() => {
    seedLocations();
    
    const unsubscribe = onSnapshot(collection(db, 'locations'), (snapshot) => {
      const locs: Location[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Location));
      setLocations(locs);
    });

    return () => unsubscribe();
  }, []);

  // Initialize Map
  useEffect(() => {
    const initMap = async () => {
      try {
        const { Map } = await mapLoader.importLibrary("maps") as google.maps.MapsLibrary;

        if (mapRef.current) {
          const m = new Map(mapRef.current, {
            center: { lat: 30.2672, lng: -97.7431 },
            zoom: 12,
            mapId: "DEMO_MAP_ID",
            styles: [
               {
                 elementType: "geometry",
                 stylers: [{ color: "#242f3e" }],
               },
               {
                 elementType: "labels.text.stroke",
                 stylers: [{ color: "#242f3e" }],
               },
               {
                 elementType: "labels.text.fill",
                 stylers: [{ color: "#746855" }],
               },
               {
                 featureType: "administrative.locality",
                 elementType: "labels.text.fill",
                 stylers: [{ color: "#d59563" }],
               },
               {
                 featureType: "poi",
                 elementType: "labels.text.fill",
                 stylers: [{ color: "#d59563" }],
               },
               {
                 featureType: "poi.park",
                 elementType: "geometry",
                 stylers: [{ color: "#263c3f" }],
               },
               {
                 featureType: "poi.park",
                 elementType: "labels.text.fill",
                 stylers: [{ color: "#6b9a76" }],
               },
               {
                 featureType: "road",
                 elementType: "geometry",
                 stylers: [{ color: "#38414e" }],
               },
               {
                 featureType: "road",
                 elementType: "geometry.stroke",
                 stylers: [{ color: "#212a37" }],
               },
               {
                 featureType: "road",
                 elementType: "labels.text.fill",
                 stylers: [{ color: "#9ca5b3" }],
               },
               {
                 featureType: "road.highway",
                 elementType: "geometry",
                 stylers: [{ color: "#746855" }],
               },
               {
                 featureType: "road.highway",
                 elementType: "geometry.stroke",
                 stylers: [{ color: "#1f2835" }],
               },
               {
                 featureType: "road.highway",
                 elementType: "labels.text.fill",
                 stylers: [{ color: "#f3d19c" }],
               },
               {
                 featureType: "transit",
                 elementType: "geometry",
                 stylers: [{ color: "#2f3948" }],
               },
               {
                 featureType: "transit.station",
                 elementType: "labels.text.fill",
                 stylers: [{ color: "#d59563" }],
               },
               {
                 featureType: "water",
                 elementType: "geometry",
                 stylers: [{ color: "#17263c" }],
               },
               {
                 featureType: "water",
                 elementType: "labels.text.fill",
                 stylers: [{ color: "#515c6d" }],
               },
               {
                 featureType: "water",
                 elementType: "labels.text.stroke",
                 stylers: [{ color: "#17263c" }],
               },
            ]
          });
          setMap(m);
        }
      } catch (e) {
        console.error("Error loading map:", e);
      }
    };

    initMap();
  }, []);

  // Update Markers
  const updateMarkers = useCallback(async () => {
    if (!map) return;

    markersRef.current.forEach(m => m.setMap(null));

    const { Marker } = await mapLoader.importLibrary("marker") as google.maps.MarkerLibrary;
    
    const newMarkers = locations.map(loc => {
      const isFire = loc.vibe_score >= 8;
      const scoreEmoji = isFire ? '🔥' : '⭐';
      
      const marker = new Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: map,
        title: loc.name,
        animation: google.maps.Animation.DROP,
        // @ts-ignore
        locationData: loc
      });

      const hashtagHtml = loc.hashtags 
        ? `<div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:8px;">${loc.hashtags.map(t => 
             `<span style="background:#1e293b; color:#94a3b8; padding:2px 6px; border-radius:4px; font-size:10px;">${t}</span>`
          ).join('')}</div>`
        : '';

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #333; padding: 10px; min-width: 200px; max-width: 250px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <h3 style="margin: 0; font-weight: 700; font-size: 16px;">${loc.name}</h3>
              <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600;">${loc.category}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 24px; font-weight: bold; margin-right: 4px;">${loc.vibe_score}</span>
              <span style="font-size: 20px;">${scoreEmoji}</span>
            </div>

            ${loc.ai_vibe_summary 
              ? `<div style="background:#fef3c7; color:#92400e; padding:8px; border-radius:6px; font-size:12px; margin-bottom:8px; font-style:italic;">"${loc.ai_vibe_summary}"</div>`
              : `<p style="margin: 0 0 12px 0; font-size: 13px; color: #666; line-height: 1.4;">${loc.description}</p>`
            }
            
            ${hashtagHtml}

            ${loc.photo ? `<img src="${loc.photo}" style="width:100%; height:100px; object-fit:cover; border-radius:4px; margin-bottom:12px;" />` : ''}
            
            <button style="
              width: 100%;
              background: #f97316; 
              color: white; 
              border: none; 
              padding: 8px 12px; 
              border-radius: 6px; 
              font-size: 13px; 
              font-weight: 600; 
              cursor: pointer;
              transition: background 0.2s;
            " onmouseover="this.style.background='#ea580c'" onmouseout="this.style.background='#f97316'">
              View Details
            </button>
          </div>
        `
      });

      // @ts-ignore
      marker.infoWindow = infoWindow;

      marker.addListener("click", () => {
        markersRef.current.forEach(m => {
            // @ts-ignore
            if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open({
          anchor: marker,
          map,
          shouldFocus: false,
        });
      });

      return marker;
    });

    markersRef.current = newMarkers;
  }, [map, locations]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  const handleSurpriseMe = () => {
    if (locations.length > 0 && map && markersRef.current.length > 0) {
      const randomIndex = Math.floor(Math.random() * locations.length);
      const randomLoc = locations[randomIndex];
      const randomMarker = markersRef.current[randomIndex];

      map.panTo({ lat: randomLoc.lat, lng: randomLoc.lng });
      map.setZoom(16);

      markersRef.current.forEach(m => {
        // @ts-ignore
        if (m.infoWindow) m.infoWindow.close();
      });

      // @ts-ignore
      if (randomMarker && randomMarker.infoWindow) {
        // @ts-ignore
        randomMarker.infoWindow.open({
            anchor: randomMarker,
            map,
            shouldFocus: false
        });
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#3b82f6', '#ffffff'] 
      });

      toast.success(`Check out ${randomLoc.name}!`, {
        icon: '🎉',
        description: randomLoc.description
      });
    }
  };

  const handleLocationAdded = (lat: number, lng: number) => {
    if (map) {
      map.panTo({ lat, lng });
      map.setZoom(15);
    }
  };

  const flyToLocation = (loc: Location) => {
    if (map) {
        map.panTo({ lat: loc.lat, lng: loc.lng });
        map.setZoom(16);
        
        const marker = markersRef.current.find(m => {
            // @ts-ignore
            return m.locationData.id === loc.id;
        });

        if (marker) {
             markersRef.current.forEach(m => {
                // @ts-ignore
                if (m.infoWindow) m.infoWindow.close();
            });
            // @ts-ignore
            if (marker.infoWindow) marker.infoWindow.open(map, marker);
        }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0f0a1a] text-white overflow-hidden">
      
      {/* 1. HEADER */}
      <header className="h-16 flex-none sticky top-0 z-10 border-b border-slate-800 bg-[#0f0a1a]/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="text-orange-500 h-6 w-6" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
            VibeCheck Austin
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
            <Button 
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 border-none shadow-md hover:shadow-orange-500/20 transition-all duration-300 transform hover:scale-105"
            onClick={handleSurpriseMe}
            >
            <Sparkles className="mr-2 h-4 w-4" />
            Surprise Me
            </Button>

            {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-slate-700 hover:border-orange-500">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                                <AvatarFallback className="bg-slate-800 text-orange-500">
                                    {user.displayName?.charAt(0) || <UserIcon className="h-4 w-4" />}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-[#1a1428] border-slate-700 text-slate-200" align="end">
                        <DropdownMenuItem className="text-xs font-semibold text-slate-500 cursor-default focus:bg-transparent">
                            {user.email}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={signOut} className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-red-400 hover:text-red-300">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button 
                    variant="outline" 
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                    onClick={signInWithGoogle}
                >
                    Sign In
                </Button>
            )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 2. SIDEBAR */}
        <aside className="w-80 flex-none flex flex-col overflow-hidden border-r border-slate-800 bg-[#0f0a1a]">
          
          <div className="flex-none z-10 shadow-lg">
            <TopVibesLeaderboard 
                locations={locations} 
                onLocationClick={flyToLocation}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Spots</h2>
            {locations.map((loc) => (
                <Card 
                key={loc.id} 
                className="bg-[#1a1428] border-slate-800 hover:border-slate-600 transition-all cursor-pointer hover:shadow-lg hover:shadow-purple-900/20 group relative overflow-hidden"
                onClick={() => flyToLocation(loc)}
                >
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-100 group-hover:text-orange-400 transition-colors">{loc.name}</h3>
                    <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 hover:bg-blue-900">{loc.category}</Badge>
                    </div>
                    
                    {loc.ai_vibe_summary ? (
                        <div className="mb-3">
                            <p className="text-sm text-amber-200/90 italic border-l-2 border-orange-500 pl-2 mb-2">
                                "{loc.ai_vibe_summary}"
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">{loc.description}</p>
                    )}

                    {loc.hashtags && loc.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {loc.hashtags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] text-slate-400 border-slate-700 hover:border-orange-500/50">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center text-xs text-orange-400 font-medium justify-between mt-auto">
                    <div className="flex items-center">
                        <span className="flex gap-1 items-center">
                        <span className="text-lg">{loc.vibe_score >= 8 ? '🔥' : '⭐'}</span>
                        <span className="text-base font-bold ml-1">{loc.vibe_score}</span>
                        <span className="text-slate-500 font-normal ml-1">/ 10</span>
                        </span>
                    </div>
                    {loc.ai_processed && (
                        <span className="text-[10px] text-purple-400 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> AI Analyzed
                        </span>
                    )}
                    </div>
                </CardContent>
                </Card>
            ))}
          </div>
        </aside>

        {/* 3. MAP AREA */}
        <main className="flex-1 relative bg-slate-900">
           <div ref={mapRef} className="w-full h-full" />

           {/* FLOATING ACTION BUTTON - ALWAYS VISIBLE */}
           <div className="absolute bottom-6 right-6 z-50">
             <Button 
               size="icon" 
               className="h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-xl hover:scale-110 transition-transform duration-200"
               onClick={() => setIsDialogOpen(true)}
             >
               <Plus className="h-8 w-8" />
             </Button>

             <AddLocationDialog 
               open={isDialogOpen} 
               onOpenChange={setIsDialogOpen} 
               onLocationAdded={handleLocationAdded}
             />
           </div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
