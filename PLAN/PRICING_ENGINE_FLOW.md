# PRICING ENGINE FLOW --- NEVRA

## Overview

Pricing engine mengontrol:

-   Token limit
-   Feature unlock
-   Billing lifecycle
-   Monthly reset

------------------------------------------------------------------------

## Token Allocation

FREE: - Daily quota: 20 messages - Model limit: cheap tier

PRO: - Monthly: 150k tokens

CREATOR: - Monthly: 500k tokens

------------------------------------------------------------------------

## Billing Flow

1.  User click Upgrade
2.  Create payment transaction
3.  Redirect to payment gateway
4.  Receive webhook success
5.  Update subscription status
6.  Unlock features

------------------------------------------------------------------------

## Monthly Reset Flow

Cron Job:

-   Reset token usage
-   Refresh quota
-   Keep subscription active

------------------------------------------------------------------------

## Protection Layer

-   Prevent over usage
-   Auto throttle
-   Lock premium model access

------------------------------------------------------------------------

Status: Revenue Ready System
