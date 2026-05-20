# KIU Integration Operations API

This backend layer now exposes a basic operations surface for whole-university integration management.

## Platform

- `GET /health`
- `GET /api/platform/config`
- `GET /api/platform/status`

Purpose:
- runtime environment summary
- Microsoft readiness
- file storage readiness
- TURN readiness
- configured external systems

## External Systems Registry

- `GET /api/integrations/systems`
- `POST /api/integrations/systems`

Use this to store portal knowledge about systems such as:
- Microsoft Entra
- SIS
- finance ERP
- HR
- curriculum service

## Sync Runs

- `GET /api/integrations/sync-runs`
- `POST /api/integrations/sync-runs`

Use this to record:
- sync scope
- start/finish state
- changed record counts
- operator
- failure summary

## Sync Conflicts

- `GET /api/integrations/conflicts`
- `POST /api/integrations/conflicts`

Use this when:
- portal and SIS disagree
- finance hold state mismatches
- staff role/employment status is inconsistent
- schedule or enrollment data conflicts

## Audit

- `GET /api/audit/events`
- `POST /api/audit/events`

Current usage:
- auth login/logout events

Target usage:
- registration actions
- grade changes
- Student Service status changes
- moderation actions
- finance hold changes
- sync conflict resolutions

## Current Limits

This is a bridge-backed operations layer, not the final PostgreSQL-backed implementation yet.

It is suitable for:
- integration design
- operational visibility
- early staging environments

It is not yet the final production authority for:
- official student records
- finance ledger
- HR records
- registrar truth
