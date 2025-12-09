# Blueprint: VibeCheck Austin

## Overview
A modern, polished Next.js web application for discovering and sharing "vibes" of locations in Austin, Texas. The app features a map-based interface, a sidebar of curated locations, and a user-friendly way to add new spots. It utilizes Firebase for the backend and Google Maps for visualization, wrapped in a sleek, dark-themed UI.

## Architecture & Tech Stack
- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS with a custom Austin-inspired dark theme.
- **UI Library:** shadcn/ui (Cards, Dialogs, Inputs, etc.) + Lucide React icons.
- **Backend:** Firebase (Firestore) for data persistence.
- **AI:** Google Gemini (via Genkit flow) for automated vibe analysis.
- **Maps:** Google Maps JavaScript API (Loader v1/v2).
- **State Management:** React Hooks (useState, useEffect) for local state and data binding.

## Design System
- **Theme:** Dark Purple (`#0f0a1a`) background, Orange (`#f97316`) accent, Blue (`#3b82f6`) secondary.
- **Typography:** Sans-serif, expressive headings, readable body text.
- **Components:** Glassmorphism effects, rounded corners, "lifted" cards with deep shadows.

## Features
- **Interactive Map:** Custom dark-themed Google Map with markers.
- **Real-time Locations:** Live updates from Firestore.
- **AI Vibe Check:** Generates witty summaries, scores, and hashtags using Gemini.
- **Surprise Me:** Random location fly-to with confetti effect.
- **Top Vibes Leaderboard:** Animated ranking of top 5 locations.

## Plan
1.  **Leaderboard Component:**
    - Create a collapsible UI section at the top of the sidebar.
    - Filter locations to find the top 5 by `vibe_score`.
    - Style with rank badges (Gold/Silver/Bronze) and animations.
    - Implement click-to-fly functionality.
2.  **Integration:**
    - Add to `src/app/page.tsx` sidebar.
    - Ensure it updates in real-time as scores change.
