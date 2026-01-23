# AUTO ROUTER ARCHITECTURE --- NOIR AI

## Overview

Noir AI Auto Router bertugas memilih model AI terbaik secara otomatis
berdasarkan:

-   User plan
-   Mode penggunaan
-   Context size
-   Feature permission

Tujuan:

-   Cost optimization
-   Output quality stability
-   Automatic scaling

------------------------------------------------------------------------

## Routing Inputs

Request body:

{ mode: chat \| code \| ui \| rag, plan: free \| pro \| creator, tokens:
estimated, message: string }

------------------------------------------------------------------------

## Routing Decision Tree

1.  Check subscription plan
2.  Check requested mode
3.  Check token size
4.  Select model
5.  Apply fallback

------------------------------------------------------------------------

## Default Rules

FREE PLAN: - chat → gpt-5-nano - rag → gemini-2.0-flash

PRO PLAN: - chat → gpt-5-mini - code → gpt-5.1-codex-mini - ui →
gemini-3-pro-preview

CREATOR PLAN: - heavy reasoning → claude-3-7-sonnet

------------------------------------------------------------------------

## Fallback Logic

If provider fails: 1. Retry same model 2. Switch to secondary provider
3. Return graceful error

------------------------------------------------------------------------

Status: Production Ready Architecture
