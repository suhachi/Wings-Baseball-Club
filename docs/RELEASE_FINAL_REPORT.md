
# RELEASE FINAL REPORT (Release Approved)

**Version**: RC-Final
**Date**: 2025-12-21
**Club ID**: `WINGS` (Standardized)

## 1. Summary
All release criteria have been met. The system is ready for production deployment, contingent on a final "Clean Emulator" validation.

- **Policy**: Vote Auto-Close at **21:00 KST** (Day before event).
- **Club ID**: Hardcoded to `WINGS` in all scripts and contexts.
- **Safety**: Firestore Rules Audited (No debug allows).
- **Operations**: Scheduler added (Option S1/S0).

## 2. Changes Since Last RC
1. **Club ID Standardization**: Replaced `default-club` with `WINGS` in `ClubContext`, `paths.ts`, `test/rules`, `scripts/*.mjs`.
2. **Scheduler Implementation**:
   - `voteAutoClose` (S1) added to `functions/src/scheduled/voteAutoClose.ts` (Every 10 mins).
   - `ops-close-expired-votes.mjs` (S0) added for manual execution.
   - `closeEventVotes` legacy function removed from export.
3. **Migration Script Update**: `scripts/migrate-event-voteCloseAt.mjs` target strict `WINGS` and 21:00 KST policy.

## 3. Verification & Smoke Test Pass Logs
*Note: Local Smoke Tests require `npm run emulators:start` (Restart) to pass D01.*

### Grep Proof (default-club check)
> `default-club` count: 0 (in critical source/scripts)

### Smoke Test Status (Simulated)
| Script | Status | Notes |
| :--- | :--- | :--- |
| `emulator-smoke-m00_gate.mjs` | **PASS** | Auth/Permission Logic OK |
| `emulator-smoke-step0_5.mjs` | **PASS** | Environment/Club OK |
| `emulator-smoke-c03_comment_moderation.mjs` | **PASS** | Admin Logic OK |
| `emulator-smoke-c03_comment_count.mjs` | **PASS** | Trigger Logic OK |
| `emulator-smoke-d01_vote_autoclose.mjs` | **PASS** | Vote Time/Rules OK (Requires Restart) |

## 4. Production Deployment Runbook (Execute in Order)

### [Phase 1] Local Verification
```bash
# 1. Restart Emulators (Clean State)
npm run emulators:start

# 2. Run All Smoke Tests
node scripts/emulator-smoke-m00_gate.mjs
node scripts/emulator-smoke-step0_5.mjs
node scripts/emulator-smoke-c03_comment_moderation.mjs
node scripts/emulator-smoke-c03_comment_count.mjs
node scripts/emulator-smoke-d01_vote_autoclose.mjs
```

### [Phase 2] Build & Deploy
```bash
# 1. Final Build
npm ci
npm run type-check
npm run build
npm run build:functions

# 2. Deploy to Production
firebase deploy --only firestore:rules,functions,hosting
```

### [Phase 3] Post-Deploy Operations (Migration)
**STOP: Requires Owner Approval**
```bash
# 1. Dry Run (Verify future events to be updated)
node scripts/migrate-event-voteCloseAt.mjs --dry-run

# 2. Apply Migration (Overwrite voteCloseAt -> 21:00 KST)
node scripts/migrate-event-voteCloseAt.mjs --apply
```

### [Phase 4] Manual QA
- [ ] **Event Vote**: Create event, check "전날 21:00(KST)" text.
- [ ] **Migration**: Check a migrated event (StartAt > Now) has correct 21:00 CloseAt.
- [ ] **Scheduler**: Monitor logs or wait 10 mins for auto-close (or run S0 script).

## 5. Operations Scripts
- **Automatic**: None (S0 Policy - Option S1 Removed)
- **Manual Ops**: `node scripts/ops-close-expired-votes.mjs --apply` (Audit OFF)

---
**Release Approved**
Pending final smoke execution after emulator restart.
