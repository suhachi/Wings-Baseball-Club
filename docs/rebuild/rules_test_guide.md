# Firestore Rules Test Guide

## Overview
This document describes how to verify the Firestore Security Rules for the Wings Baseball Club PWA, including the new tests for Authentication Rebuild (A05).

## Prerequisites
- Node.js (v18+)
- Java (for Firebase Emulators)
- Firebase CLI (`npm install -g firebase-tools`)

## Test Cases (Added in A05)
- **μATOM-0610**: Non-member read rejection (Authenticated but no member doc).
- **μATOM-0611**: Active member read success.
- **μATOM-0612**: Member creating `notice`/`event` -> Fail (Functions-only).
- **μATOM-0613**: Attendance modification by others -> Fail.
- **μATOM-0615**: Member creation role validation (Must be 'MEMBER', Status 'active').

## How to Run Tests

1. **Install Dependencies** (if not done):
   ```bash
   npm install
   ```

2. **Start Emulators (Terminal 1)**:
   ```bash
   npm run emulators:start
   ```
   *Wait until you see "All emulators ready".*

3. **Run Tests (Terminal 2)**:
   ```bash
   npm run test:rules
   ```

## PASS Criteria
- All tests should pass (green checkmarks).
- Specifically check `Firestore Rules Tests` suite.

## RBAC / Functions Verification (Step 0.1 / P0-01)
### B01: TREASURER Push Notification Target
- **Purpose**: Verify that `TREASURER` is included in `getAdminUids` for push notifications.
- **Verification Command**:
  ```bash
  grep -r "['PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN']" functions/src/shared/fcm.ts
  ```
- **Expectation**: Command should find the line defining the role array including `TREASURER`.
- **Functions Build**: `cd functions && npm run build` must pass without errors.

### B02-02: UI Permission Guard Unification
- **Purpose**: Verify that UI uses `permissions.ts` instead of scattered `isAdmin()/isTreasury()`.
- **Scan Command**:
  ```bash
  rg "canManageNotices" src/app
  rg "canManageMembers" src/app
  ```
- **Expectation**:
  - `MyPage.tsx` should use `canManageNotices` and `canManageMembers`.
  - `CreatePostModal.tsx` should use `canManageNotices` to show 'Notice' type.
