# 99. Known Limitations & v1.2 Roadmap

## ⚠️ Known Limitations
1. **Firestore Rules Test Failure (μATOM-0606)**: Free post author update check fails in emulator.
2. **Large Bundle Size**: JS chunk > 1MB. Needs code splitting.
3. **Single Club ID**: Hardcoded 'default-club'/'WINGS'.
4. **In-App Browser Login**: Google OAuth blocked in Kakao/Insta.
5. **Timezone**: Hardcoded to Asia/Seoul.

## 🚀 v1.2 Hook Points
- **Phase A**: Game Recording System (Lineup/Records)
- **Phase B**: Multi-club Support & Granular Roles
- **Phase C**: Performance Optimization (Bundle size, Query indexing)
- **Phase D**: Test Coverage (Fix rules test, E2E expansion)
