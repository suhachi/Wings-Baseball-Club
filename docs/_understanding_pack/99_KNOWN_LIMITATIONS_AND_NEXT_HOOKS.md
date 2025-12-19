# 99. Known Limitations and v1.2 Hook Points

**Generated**: 2025-12-19T06:46:23.945Z
**Status**: v1.1 MVP Complete (P0-P6)

---

## ⚠️ Known Limitations

### 1. Firestore Rules Test Failure (μATOM-0606)
**Status**: 1 test failed (7/8 passed)
- Free post author cannot update own post
- PERMISSION_DENIED error at L111
- Fix required in firestore.rules

### 2. Large Bundle Size
- JS chunk: ~1.17 MB
- Recommendation: Code splitting, tree shaking

### 3. Hardcoded Club ID
- Only supports single club (clubId = 'WINGS' or 'default-club')
- Multi-club support needed for v1.2

### 4. In-App Browser Login Blocked
- Google OAuth fails in KakaoTalk, Instagram
- Need alternative auth or WebView workaround

### 5. Timezone Hardcoded
- Vote close time: Asia/Seoul only
- Need timezone customization in v1.2

### 6. FCM Token Handling
- Invalid tokens auto-deleted without retry
- Add retry logic and token refresh

### 7. Post Recording Lock Not Implemented
- recordingLocked field defined in PRD but not implemented
- Implement for game recording close feature

---

## 🎯 v1.2 Hook Points

### Phase A: Data Structure
- [ ] Game recording system
- [ ] Fee/treasury management  
- [ ] Album/photo management

### Phase B: Security & Permissions
- [ ] Multi-club architecture
- [ ] Granular role policies
- [ ] Audit log dashboard

### Phase C: Performance
- [ ] Reduce bundle size
- [ ] Optimize Firestore queries
- [ ] Improve caching

### Phase D: Testing
- [ ] Fix Rules test (μATOM-0606)
- [ ] Expand E2E tests
- [ ] Add integration tests

---

## Pre-Deployment Checklist

- [x] Type check passed
- [x] Build succeeded
- [x] Functions build succeeded
- [ ] All Rules tests passed (1 failed)
- [ ] E2E tests passed
- [ ] Security review completed
- [ ] Performance testing completed

**Last Updated**: 2024-12-19
