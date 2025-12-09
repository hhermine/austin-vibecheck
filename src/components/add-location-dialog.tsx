// src/components/add-location-dialog.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { safeAddLocation } from '@/lib/firebase-utils';
import { getGeocode, getPlacePredictions } from '@/lib/geocoding';
import { uploadImage } from '@/lib/storage';
import { mapLoader } from '@/lib/google-maps';
import { toast } from "sonner";
import { Loader2, Upload, MapPin } from 'lucide-react';
import Image from 'next/image';
import { logError } from '@/lib/client-logger';

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationAdded: (lat: number, lng: number) => void;
}

export function AddLocationDialog({ open, onOpenChange, onLocationAdded }: AddLocationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [previewCoords, setPreviewCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (open && mapRef.current && !mapInstance.current) {
      const initMap = async () => {
        try {
          const { Map } = await mapLoader.importLibrary("maps") as google.maps.MapsLibrary;
          const { Marker } = await mapLoader.importLibrary("marker") as google.maps.MarkerLibrary;

          mapInstance.current = new Map(mapRef.current!, {
            center: { lat: 30.2672, lng: -97.7431 },
            zoom: 11,
            disableDefaultUI: true,
            styles: [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
            ]
          });

          markerInstance.current = new Marker({
              map: mapInstance.current,
              visible: false
          });
        } catch (e) {
          logError("Failed to initialize preview map", e);
        }
      };
      initMap();
    }
  }, [open]);

  useEffect(() => {
    if (mapInstance.current && markerInstance.current && previewCoords) {
      mapInstance.current.setCenter(previewCoords);
      mapInstance.current.setZoom(15);
      markerInstance.current.setPosition(previewCoords);
      markerInstance.current.setVisible(true);
    }
  }, [previewCoords]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (name.length > 2 && !previewCoords) {
        const results = await getPlacePredictions(name);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [name, previewCoords]);

  const handleSelectSuggestion = async (prediction: google.maps.places.AutocompletePrediction) => {
    setName(prediction.description);
    setShowSuggestions(false);
    setIsGeocoding(true);
    
    const coords = await getGeocode(prediction.description);
    if (coords) {
      setPreviewCoords(coords);
    }
    setIsGeocoding(false);
  };

  const handleManualBlur = async () => {
    setTimeout(async () => {
        if (!previewCoords && name.length > 3) {
            setIsGeocoding(true);
            const query = name.toLowerCase().includes('austin') ? name : `${name}, Austin, TX`;
            const coords = await getGeocode(query);
            if (coords) setPreviewCoords(coords);
            setIsGeocoding(false);
        }
        setShowSuggestions(false);
    }, 200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
          toast.error("Image too large. Please select an image under 5MB.");
          return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!name) {
      toast.error("Please enter a location name.");
      return;
    }
    if (!previewCoords) {
      toast.error("Could not locate this place. Please select from suggestions.");
      return;
    }
    if (!description) {
      toast.error("Please enter a description.");
      return;
    }

    setIsSubmitting(true);

    try {
      let photoBase64 = "";
      if (photo) {
        try {
            photoBase64 = await uploadImage(photo);
        } catch (uploadError) {
            logError("Photo processing failed", uploadError);
            toast.error("Failed to process photo, but saving location...");
        }
      }

      const locationData = {
        name,
        description,
        category,
        vibe_score: 8, 
        lat: previewCoords.lat,
        lng: previewCoords.lng,
        photo: photoBase64, 
        createdAt: new Date()
      };

      const newDocId = await safeAddLocation(locationData);

      toast.success("Location saved!");
      
      toast.info("✨ Analyzing vibes with AI...", { duration: 3000 });
      
      fetch('/api/analyze-vibe', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
             id: newDocId, 
             name: name, 
             description: description, 
             photoUrl: photoBase64 
         })
      })
      .then(async (res) => {
          if (res.ok) {
              const data = await res.json();
              toast.success("✨ Vibe check complete!", {
                  description: data.data.vibeSummary
              });
          } else {
              logError("AI Analysis failed response", await res.text());
          }
      })
      .catch(err => logError("AI Network error", err));

      onLocationAdded(previewCoords.lat, previewCoords.lng);
      onOpenChange(false);
      
      setTimeout(() => {
        setName('');
        setDescription('');
        setCategory('Food');
        setPhoto(null);
        setPhotoPreview(null);
        setPreviewCoords(null);
        setIsSubmitting(false);
      }, 300);
      
    } catch (error: any) {
      logError("Error adding location", error);
      toast.error(`Failed to add location: ${error.message || "Unknown error"}`);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#1a1428] border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
          <DialogDescription className="text-slate-400">
            Share a new spot with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          
          <div className="w-full h-40 bg-slate-900 rounded-lg overflow-hidden relative border border-slate-700">
            <div ref={mapRef} className="w-full h-full" />
            {!previewCoords && !isGeocoding && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                    Enter a location name to preview
                </div>
            )}
             {isGeocoding && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" /> Locating...
                </div>
            )}
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="name" className="text-slate-300">Location Name</Label>
              <Input
                id="name"
                placeholder="Start typing to search..."
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    if (previewCoords) setPreviewCoords(null); 
                }}
                onBlur={handleManualBlur}
                autoComplete="off"
                className="bg-[#0f0a1a] border-slate-700 text-white focus:ring-orange-500"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-[#1a1428] border border-slate-700 rounded-md mt-1 max-h-48 overflow-auto shadow-xl top-[70px]">
                    {suggestions.map((prediction) => (
                        <li 
                            key={prediction.place_id}
                            className="px-4 py-2 hover:bg-slate-800 cursor-pointer text-sm text-slate-200 flex items-center"
                            onClick={() => handleSelectSuggestion(prediction)}
                        >
                            <MapPin className="h-4 w-4 mr-2 text-slate-500" />
                            {prediction.description}
                        </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category" className="text-slate-300">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#0f0a1a] border-slate-700 text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1428] border-slate-700 text-white">
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Park">Park</SelectItem>
                  <SelectItem value="Nightlife">Nightlife</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Art">Art</SelectItem>
                  <SelectItem value="Outdoors">Outdoors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-slate-300">Description</Label>
              <Textarea
                id="description"
                placeholder="What's the vibe like? (Max 200 chars)"
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#0f0a1a] border-slate-700 text-white focus:ring-orange-500 min-h-[100px]"
              />
              <div className="text-xs text-right text-slate-500">
                {description.length}/200
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-slate-300">Photo</Label>
              <div className="flex items-center gap-4">
                <div 
                    className="h-20 w-20 border-2 border-dashed border-slate-600 rounded-md flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors relative overflow-hidden"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                >
                    {photoPreview ? (
                        <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                    ) : (
                        <Upload className="h-6 w-6 text-slate-500" />
                    )}
                </div>
                <Input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                />
                <div className="text-sm text-slate-400">
                    {photo ? photo.name : "Upload a photo (optional)"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
