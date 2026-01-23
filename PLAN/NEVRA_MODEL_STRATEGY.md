# NEVRA AI MODEL STACK & AUTO ROUTER STRATEGY

## Overview

Dokumen ini menjelaskan strategi pemilihan model AI, sistem auto-router,
struktur pricing, dan cost optimization Nevra menggunakan SumoPod
multi-provider gateway.

Tujuan utama:

-   Hemat cost operasional
-   Output AI tetap berkualitas tinggi
-   Mendukung auto routing berbasis use-case
-   Siap scaling sebagai SaaS

------------------------------------------------------------------------

## MVP Model Priority (Phase 1--3)

  Use Case                Model
  ----------------------- ------------------------
  Chat default            gpt-5-mini
  Fast cheap chat         gpt-5-nano
  Long context docs       gemini-2.0-flash
  Code generation         gpt-5.1-codex-mini
  UI Screenshot analyze   gemini-3-pro-preview
  Premium reasoning       claude-3-7-sonnet
  RAG Embedding           text-embedding-3-small

------------------------------------------------------------------------

## Pricing Strategy

### FREE --- Rp 0

-   Basic chat only
-   Daily limit
-   No UI generator
-   No RAG

### PRO --- Rp 59.000

-   Multi-model
-   Screenshot UI
-   RAG
-   150k tokens

### CREATOR --- Rp 129.000

-   Claude + Gemini Pro
-   Image generation
-   Team share
-   Unlimited workspace

------------------------------------------------------------------------

Nevra AI Infrastructure Ready For Production Scaling.
