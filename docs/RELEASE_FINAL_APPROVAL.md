# Release 1.0.0 Final Approval & Ops Runbook [Verified]

## 1. Core Policy: Single Source of Truth (SSoT)
> [!IMPORTANT]
> **Role/Status Authority**: The document at `clubs/WINGS/members/{uid}` is the **FINAL AUTHORITY** for user permissions.
> - `users/{uid}` SSoT Priority: **IGNORED** for Role/Status. Only used for `realName/photoURL` fallback.
> - **Access Gate**: If `members/{uid}` is missing, Role is **FORCED to MEMBER** and Status to **PENDING** (Access Denied).
> - **Google Login**: Auto-provisions `members/{uid}` with `role: MEMBER`, `status: active` (Soft Gate).

## 2. Changes Summary (Atomic Pass)
| Component | Status | Description |
| :--- | :--- | :--- |
| **AuthContext** | ✅ SECURED | Strict SSoT enforced. Global Role ignored. |
| **Admin Route** | ✅ GUARDED | Unified `isAdmin()` check (uses `isAdminRole` from `roles.ts`). |
| **BackNumber** | ✅ TYPED | Migrated to `number | null` (0-99). UI normalizes input. Rules enforce type. |
| **Ops Script** | ✅ DUAL MODE | Auto-fallback to Memory Scan if Index fails. |

## 3. Ops Runbook (Copy-Paste)

### A. BackNumber Migration (One-Time)
Run this to convert all legacy string `backNumber` to numbers.
```bash
# 1. Access Check (Dry Run)
npx ts-node scripts/migrate-backNumber-to-number.ts --dry-run

# 2. Apply Changes
npx ts-node scripts/migrate-backNumber-to-number.ts --apply
```
_Counters: Scanned, Targeted, Updated (Members/Users), Skipped (Already Clean)_

### B. Vote Auto-Close (Daily/Manual)
Run this if the scheduler is disabled or failed.
**Policy**: Dual Mode (Index-First, Memory-Fallback).
- **Plan A**: Uses Composite Index (`type` + `voteClosed` + `voteCloseAt`). Efficient.
- **Plan B**: Fallback if index is building or missing (`FAILED_PRECONDITION`). Scans all events.
```bash
# 1. Dry Run (Safe)
node scripts/ops-close-expired-votes.mjs --dry-run

# 2. Apply Closure
node scripts/ops-close-expired-votes.mjs --apply
```

### C. Indexes & Deployment
**Indexes Policy**: Code-managed via `firestore.indexes.json`.
- Ops scripts are designed to work EVEN IF indexes are invalid (Fallback Plan B).
- Do not manually create indexes in Console unless emergency.
```bash
# Deploy Rules & Indexes
firebase deploy --only firestore
```

## 4. Troubleshooting ("Access Denied" on Login)
If a valid Admin gets "Access Denied":
1. Check Logs: Open Console, filter `[AuthContext] Member Sync Debug`.
2. Verify `memberExists: true` and `memberRole` matches expected Admin Role.
3. If `memberExists: false`:
   - The user is missing from `clubs/WINGS/members`.
   - **Fix**: Manually create the document in Firestore or use the Admin Page "Repair" feature if available.
   - **Note**: New Google Logins auto-create this doc. This issue only affects legacy users with missing docs.

## 5. Signed Off
- **Release Engineer**: Antigravity
- **Date**: 2025-12-21
- **Status**: READY FOR MANUAL OPS
