# KIU Whole University System Architecture

This document turns the portal from a feature list into a university-wide system map. It defines what the portal owns, what external systems own, and how those domains connect.

## 1. Source Of Truth By Domain

| Domain | System of record | Portal role |
| --- | --- | --- |
| Identity and authentication | Microsoft Entra ID | Sign-in, local role/session bootstrap |
| Student official record | SIS / registrar ERP | Read, display, workflow, notifications |
| Staff official record | HR system | Read, permission mapping, directory |
| Curriculum catalog | Curriculum / registrar system | Read, registration UI, schedule use |
| Section scheduling | Scheduling / registrar system | Operational planning, display, notifications |
| Finance ledger | Finance ERP | Student balance view, support, holds display |
| Student Service / collaboration | Portal database | System of record |
| Messaging / calls | Portal database | System of record |
| Social | Portal database | System of record |
| Files and media | Object storage | Portal and external domains consume stored files |
| Audit and reconciliation | Portal audit store + external logs | Central traceability layer |

Default rule:
- If a domain affects legal/official academic or financial truth, the portal should not silently override the external record.
- If a domain is collaboration, workflow, support, notifications, or social, the portal owns it.

## 2. Identity And Linking Model

Identity chain:

1. Microsoft account signs in with `@kiu.edu.ge`
2. Portal resolves Microsoft identity to local portal user
3. Local portal user links to external person/student/staff records
4. The portal loads role, permissions, faculty, and linked records

Required stable identifiers:
- `portal_user_id`
- `microsoft_oid`
- `external_person_key`
- `student_number`
- `staff_number`
- `faculty_code`
- `program_code`
- `subject_code`
- `section_code`

Portal never infers official person identity from display name alone.

## 3. Integration Boundaries

### SIS / Registrar
- Owns:
  - official student status
  - program assignment
  - official enrollment truth
  - transcript-grade authority
- Portal receives:
  - student lifecycle changes
  - section and catalog updates
  - academic holds / rule flags

### Finance ERP
- Owns:
  - charges
  - payments
  - refunds
  - scholarships
  - holds
- Portal displays:
  - student-visible balance
  - payment status
  - related Student Service support context

### HR
- Owns:
  - staff employment status
  - department assignment
  - contract status
  - leave/substitution truth
- Portal consumes:
  - active/inactive staff state
  - teaching availability constraints

### Portal-owned domains
- Student Service
- notifications
- messenger
- calls
- social
- moderation
- support referrals

## 4. Sync And Reconciliation Rules

Preferred strategy:
- event-driven ingestion for real-time changes
- scheduled reconciliation for critical nightly validation

Required sync behavior:
- every inbound sync run is logged
- every conflict is stored for review
- no destructive overwrite without audit trail
- external authoritative changes win for official records unless an approved override policy exists

Conflict classes:
- identity mismatch
- status mismatch
- finance mismatch
- enrollment mismatch
- schedule mismatch
- permission mismatch

## 5. Messaging / Calls / Social Policy Defaults

Default collaboration rules:
- student-to-student messaging allowed only if university policy permits campus social messaging
- student-to-staff direct contact allowed only by explicit role rules or shared academic/support context
- blocked users cannot message or call each other
- presence must support `online`, `offline`, `busy`, `in_call`, `do_not_disturb`
- every call must create a call log
- social requires moderation, reports, and action audit

Default social privacy:
- campus-only by default
- class/group-specific visibility supported
- private content stays private

## 6. Compliance And Security Requirements

Must-have institutional controls:
- row-level or service-level permission enforcement
- immutable audit log for sensitive domains
- retention rules by domain
- data export and deletion policies where law permits
- secure backups and tested restore
- monitoring and incident response
- separation of dev / staging / production

Sensitive-domain visibility boundaries:
- finance
- grades
- health/wellbeing referrals
- disciplinary cases
- personal documents

## 7. Production Topology

Recommended hosted topology:
- `portal-web` for static frontend
- `portal-api` / backend service
- PostgreSQL
- Redis for queues / presence / retries
- object storage (MinIO/S3)
- TURN service for calls
- monitoring/logging stack

Environments:
- development
- staging
- production

Non-negotiable production services:
- TLS certificates
- secret management
- database migration workflow
- background job runner
- retry queue
- backup/restore procedure

## 8. Implementation Order

1. Identity linking and external person mapping
2. External system registry and sync/reconciliation
3. Finance and student lifecycle data model
4. HR and teaching-load data model
5. Support referral and moderation domains
6. Presence/contact permissions/call history
7. Object-storage migration
8. Replace remaining static page data with API-driven records
