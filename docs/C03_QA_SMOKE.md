
# C03: Comment Moderation & Count QA Runbook

## 1. Comment Count (Automated)
Run `node scripts/emulator-smoke-c03_comment_count.mjs`
- [ ] **Create Comment**: Post `commentCount` increases by 1.
- [ ] **Delete Comment**: Post `commentCount` decreases by 1 (min 0).
- [ ] **Idempotency**:
  - Call `moderateComment` twice with same `requestId`.
  - Result: Second call returns success immediately, Audit log count stays 1.

## 2. Manual Verification (If Emulator Flaky)
1. **Create Comment**:
   - Go to Board -> Click Post.
   - Write Comment -> UI updates list.
   - Go Back to List -> Check Comment Count Badge.
2. **Delete Comment (Author)**:
   - Profile setting: Make profile incomplete (remove phone).
   - Go to your comment -> Delete.
   - Expected: Success (Soft Gate Exception).
3. **Admin Moderation**:
   - Log in as Treasurer/Director.
   - Long press functionality (if implemented) or use API tester.
   - Verify Audit Log in Firestore `clubs/{id}/audit`.

## 3. Reference
- **Key Format**: `moderateComment:${uid}:${requestId}`
- **Audit Path**: `clubs/{clubId}/audit/{autoId}`
