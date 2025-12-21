# Baseline Report (Step 0.1)

**Date:** 2025-12-20
**Branch:** (Current Layout)

## 1. Execution Log

### 1.1 `npm run type-check` (TypeScript)
- **Command**: `npm run type-check`
- **Result**: ❌ FAILED
- **Error Log**:
```
src/lib/firebase/auth.service.ts:54:7 - error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
```
- **Analysis**: `UserDoc` type expects `phone` to be `string`, but `auth.service.ts` provides `string | null`. This needs to be fixed during Phase 1 refactoring.

### 1.2 `npm run build` (Vite Build)
- **Command**: `npm run build`
- **Result**: ✅ SUCCESS
- **Time**: ~21s
- **Warnings**:
  - `VITE_FCM_VAPID_KEY` missing warning (expected in dev/test).
  - Chunk size warnings (standard Vite warning).

### 1.3 `npm run test:rules` (Firestore Rules)
- **Command**: `npm run test:rules`
- **Result**: ❌ FAILED
- **Summary**: 8 failed, 0 passed.
- **Analysis**: Tests failed likely due to missing local Emulator instance or connection issues. Detailed assertions failed. This confirms that we need to ensure local emulators are running or fix the test configuration in Phase 0.2/P7.

### 1.4 `npm run lint`
- **Command**: (Not found in scripts)
- **Result**: N/A

## 2. Summary
- **Build**: Stable.
- **Types**: Minor mismatch in `auth.service.ts` vs `types.ts` (Phone field).
- **Tests**: Rules tests are failing locally.

## 3. Rollback
- No code logic changes were made.
- This report captures the "Before" state.

## 4. Next Steps (Step 0.2 Candidate Files)
The following files are identified as core to the Auth/Authz Rebuild:
1. `src/lib/firebase/auth.service.ts` (Core Auth Logic)
2. `src/app/pages/LoginPage.tsx` (UI Entry)
3. `src/app/contexts/AuthContext.tsx` (State/Gatekeeper)
4. `src/lib/firebase/firestore.service.ts` (Member Data Layer)
5. `src/lib/firebase/types.ts` (Schema)
6. `functions/src/callables/members.ts` (Backend Logic)
7. `functions/src/shared/auth.ts` (Backend Auth Helpers)
8. `src/app/App.tsx` (Routing)
9. `firestore.rules` (Security Rules)
10. `functions/src/index.ts` (Triggers)
