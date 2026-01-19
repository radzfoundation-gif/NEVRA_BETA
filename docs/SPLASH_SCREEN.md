# Documentation: One-Time Retro Splash Screen

## Overview
Nevra features a "Soft Aesthetic Retro" splash screen that appears once per user. 
Theme: Vaporwave / Dreamy / Soft Glassmorphism.

## Persistence Logic
- **Mechanism**: `localStorage` key `hasSeenSplash`.
- **Behavior**:
  - `App.tsx` initializes state by checking `!localStorage.getItem('hasSeenSplash')`.
  - If `true` (not seen yet), the `SplashScreen` component renders.
  - Upon completion `onComplete`, `localStorage.setItem('hasSeenSplash', 'true')` is called.
- **Testing**: To view the splash screen again, execute `localStorage.removeItem('hasSeenSplash')` in the developer console and refresh.

## Visual Design ("Soft Retro")
- **Background**: Deep gradients (Indigo to Purple) with a dedicated SVG Noise Texture overlay for a "film grain" look.
- **Typography**: Sans-serif, elegant, light weights. 
- **Colors**: Pastel Pink, Lavender, Soft Cyan.
- **UI Elements**: Glassmorphism (blur effects), rounded corners, soft glowing shadows.
- **Animations**: Slow, floating entry animations.

## Interactive Elements
- **Enter Experience**: Primary call-to-action to auto-complete the flow.
- **Read Documentation**: Opens an overlays showing key project details within the splash screen itself.
