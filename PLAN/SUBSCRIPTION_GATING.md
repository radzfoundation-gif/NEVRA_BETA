# SUBSCRIPTION GATING SYSTEM --- NOIR AI

## Overview

Feature gating menentukan akses user berdasarkan plan.

------------------------------------------------------------------------

## Feature Mapping

FREE: - Basic chat - No RAG - No UI generator

PRO: - RAG access - Screenshot UI - Multi model

CREATOR: - Claude models - Team workspace - Priority queue

------------------------------------------------------------------------

## Middleware Logic

1.  Read user plan
2.  Compare requested feature
3.  Allow or block
4.  Return error if locked

------------------------------------------------------------------------

## UI Layer

Locked feature UI:

-   Disabled button
-   Upgrade CTA
-   Tooltip explanation

------------------------------------------------------------------------

Status: SaaS Access Control Ready
