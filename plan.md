# NEVRA AI MODEL STACK & AUTO ROUTER STRATEGY

## Overview

Dokumen ini menjelaskan strategi pemilihan model AI, sistem auto-router, struktur pricing, dan cost optimization Nevra menggunakan SumoPod multi-provider gateway.

Tujuan utama:

- Hemat cost operasional
- Output AI tetap berkualitas tinggi
- Mendukung auto routing berbasis use-case
- Siap scaling sebagai SaaS

---

## MVP Model Priority (Phase 1–3)

Stack minimal yang kuat dan cost-efficient:

| Use Case              | Model                      |
| --------------------- | -------------------------- |
| Chat default          | gpt-5-mini                 |
| Fast cheap chat       | gpt-5-nano                 |
| Long context docs     | gemini-2.0-flash           |
| Code generation       | gpt-5.1-codex-mini         |
| UI Screenshot analyze | gemini-3-pro-preview       |
| Premium reasoning     | claude-3-7-sonnet          |
| RAG Embedding         | text-embedding-3-small     |

---

## Auto Router Rules

Nevra menggunakan routing otomatis berbasis plan dan mode penggunaan.

---

### Chat Normal Mode

Default routing:

