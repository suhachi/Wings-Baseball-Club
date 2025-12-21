# Step 0.5: Emulator E2E Verification Guide

This guide details how to verify the RBAC and Functions-only Write Path enforcement using local Firebase Emulators.

## 1. Environment Setup

Ensure you have the following installed:
- Node.js > 18
- Java (for Firebase Emulators)
- Firebase CLI (`npm install -g firebase-tools`)

### Install Dependencies
```bash
npm install
cd functions && npm install && npm run build
```

### Start Emulators
Open a separate terminal and run:
```bash
npm run emulators:start
# or if you need Functions logs streaming:
firebase emulators:start --only auth,firestore,functions
```
Wait until you see "All emulators ready".
- Auth: http://127.0.0.1:9099
- Firestore: http://127.0.0.1:8080
- Functions: http://127.0.0.1:5001
- Emulator UI: http://127.0.0.1:4000

## 2. Automated Smoke Test

We have provided a script `scripts/emulator-smoke-step0_5.mjs` that automatically:
1.  Connects to the local emulator.
2.  Creates two test users (`test-member` and `test-treasurer`).
3.  Seeds Firestore role data (bypassing rules via Admin SDK).
4.  Attempts Restricted Actions as MEMBER (Expect Failure).
5.  Attempts Restricted Actions as TREASURER (Expect Success).

### Run the script
In a new terminal (while emulators are running):
```bash
node scripts/emulator-smoke-step0_5.mjs
```

### Expected Output
```text
[SETUP] Connected to Emulators
[SETUP] Created/Found users and seeded roles...
[TEST] MEMBER attempting client-side createPost(notice)...
[PASS] Runtime guard blocked client createPost.
[TEST] MEMBER attempting callable createNotice...
[PASS] Callable rejected MEMBER as expected.
[TEST] TREASURER attempting callable createNotice...
[PASS] TREASURER created notice successfully.
[TEST] TREASURER attempting callable createEvent...
[PASS] TREASURER created event successfully.
✅ ALL SMOKE TESTS PASSED
```

## 3. Manual Verification (UI)

If you wish to verify via the UI:

1.  **Build Client**: `npm run build` (optional for dev, use `npm run dev`)
2.  **Access App**: `http://localhost:5173`
3.  **Login**: Use the `test-treasurer@test.com` created by the script (Password: `password123`) or create a new user.
    *   *Note*: To manually set role, use Emulator Firestore UI (http://127.0.0.1:4000/firestore), find `clubs/default-club/members/{uid}` and set `role: 'TREASURER'`.
4.  **Check Access**:
    *   **TREASURER**: Should see "Notice" in CreatePostModal. Should be able to create Notice.
    *   **MEMBER**: Should NOT see "Notice" in CreatePostModal.

## 4. Verification Checklist

| Scenario | Expected Result | Pass/Fail |
| :--- | :--- | :--- |
| **Emulator Start** | All emulators (Auth, Firestore, Functions) start without error | [ ] |
| **Smoke Test Script** | `node scripts/emulator-smoke-step0_5.mjs` exits with code 0 | [ ] |
| **MEMBER Client Write** | Client `createPost` throws 'only free allowed' error | [ ] |
| **MEMBER Callable** | `createNotice` / `createEvent` calls fail (Permission Denied) | [ ] |
| **TREASURER Callable** | `createNotice` / `createEvent` calls succeed | [ ] |
| **Data Integrity** | Created Notice/Event appears in Firestore with correct fields | [ ] |
