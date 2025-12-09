// src/components/top-vibes-leaderboard.tsx
import React, { useState } from 'react';
import { Location } from '@/lib/seed-data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopVibesLeaderboardProps {
  locations: Location[];
  onLocationClick: (loc: Location) => void;
}

export function TopVibesLeaderboard({ locations, onLocationClick }: TopVibesLeaderboardProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Sort by vibe_score desc, take top 5
  const topLocations = [...locations]
    .sort((a, b) => b.vibe_score - a.vibe_score)
    .slice(0, 5);

  if (topLocations.length === 0) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-b border-slate-800 bg-[#1a1428]/50"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <CollapsibleTrigger className="flex items-center w-full group cursor-pointer">
            <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wider flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                Austin's Hottest Vibes
            </h2>
            <div className="ml-auto">
                {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </div>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-1 px-2 pb-2 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        {topLocations.map((loc, index) => {
          const rank = index + 1;
          let rankColor = "bg-slate-700 text-slate-300"; // Default
          let glow = "";
          
          if (rank === 1) {
              rankColor = "bg-yellow-500 text-yellow-950 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
              glow = "animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.3)] border-orange-500/30";
          } else if (rank === 2) {
              rankColor = "bg-slate-300 text-slate-800";
          } else if (rank === 3) {
              rankColor = "bg-amber-700 text-amber-100";
          }

          return (
            <div
              key={loc.id}
              onClick={() => onLocationClick(loc)}
              className={cn(
                "flex items-center p-2 rounded-md cursor-pointer transition-all hover:bg-slate-800/80 group border border-transparent",
                rank === 1 ? "bg-gradient-to-r from-orange-900/20 to-transparent border-orange-500/20" : "",
                glow
              )}
            >
              <div className={cn(
                "flex-none flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3",
                rankColor
              )}>
                {rank <= 3 && <Trophy className="h-3 w-3 absolute opacity-20 scale-150" />}
                <span className="relative z-10">{rank}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm font-medium truncate text-slate-200 group-hover:text-orange-400 transition-colors",
                    rank === 1 ? "text-orange-100" : ""
                )}>
                    {loc.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{loc.category}</p>
              </div>

              <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
                <span className="text-xs font-bold text-orange-400">{loc.vibe_score}</span>
                {loc.vibe_score >= 9 && <span className="text-xs animate-bounce">🔥</span>}
              </div>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
