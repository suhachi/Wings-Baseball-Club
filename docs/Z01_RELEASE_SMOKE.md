
# Z01: Final Release QA Checklist

## 1. Automated Verification
**CRITICAL: Emulator Restart Required**
Functions changes (triggers/callables) are often not hot-reloaded reliably.
Before running smoke tests, **STOP** any running emulators and restart them:
```bash
npm run emulators:start
```
*(Ensure it lists Functions, Firestore, and Auth as started)*

Run the following commands in order. Ensure Emulators are freshly started.
```bash
npm run type-check
npm run build
npm --prefix functions run build
firebase emulators:start --only auth,firestore,functions
```

### Smoke Tests
- `node scripts/emulator-smoke-d01_vote_autoclose.mjs` (Vote Auto-Close)
- `node scripts/emulator-smoke-c03_comment_count.mjs` (Comment Count)
- `node scripts/emulator-smoke-c03_comment_moderation.mjs` (Moderation Audit)

## 2. Policy Checks
- [ ] **Event Vote**: Closes at 21:00 KST (Day Before).
- [ ] **Comment**: Count Syncs, Admin Edit Idempotent.
- [ ] **Security**: No `allow true` or `debug` rules.

## 3. Migration (Post-Deploy)
run `node scripts/migrate-event-voteCloseAt.mjs --dry-run` then `--apply`.
Target: Overwrites future events to 21:00 KST. Skips past.

## 4. Manual QA
- [ ] Login as Member -> Board -> Event.
- [ ] Verify "투표 마감: 연습/경기 전날 21:00(KST)에 자동 마감됩니다." text.
- [ ] Check actual close time if present.
- [ ] Verify buttons disabled if closed.
