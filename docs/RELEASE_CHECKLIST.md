# 릴리스 준비 체크리스트

## μATOM-0621~0624: 릴리스 준비

---

## μATOM-0621: 환경 변수 및 설정값 체크

**Role:** Release Engineer  
**Task:** 프로덕션 환경 변수 및 설정값 확인

### 환경 변수 체크

**필수 환경 변수:**
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FCM_VAPID_KEY=...
```

**체크 근거:**
- `src/lib/firebase/config.ts`에서 환경 변수 사용 확인
- Firebase Console에서 실제 프로젝트 설정값과 일치 확인

**확인 절차:**
1. `.env.production` 파일 존재 확인
2. 각 환경 변수가 실제 Firebase 프로젝트 값과 일치하는지 확인
3. `VITE_FCM_VAPID_KEY`가 Firebase Console > 프로젝트 설정 > 클라우드 메시징에서 확인된 값과 일치하는지 확인

**체크리스트:**
- [ ] `.env.production` 파일 존재
- [ ] 모든 필수 환경 변수 설정됨
- [ ] Firebase 프로젝트 ID 일치
- [ ] FCM VAPID 키 설정됨

**결과:** PASS / FAIL

---

## μATOM-0622: 배포 커맨드 및 절차

**Role:** Release Engineer  
**Task:** 배포 커맨드 및 절차 문서화

### 배포 커맨드

**1. Frontend 빌드:**
```bash
npm run build
```

**2. Functions 빌드:**
```bash
npm run build:functions
```

**3. Firestore Rules 배포:**
```bash
firebase deploy --only firestore:rules
```

**4. Functions 배포:**
```bash
firebase deploy --only functions
```

**5. Hosting 배포:**
```bash
firebase deploy --only hosting
```

**6. 전체 배포:**
```bash
firebase deploy
```

### 배포 순서

1. **Firestore Rules 배포** (가장 먼저)
   - 이유: Rules 변경이 다른 배포에 영향을 줄 수 있음
   - 확인: `firebase deploy --only firestore:rules`

2. **Functions 배포**
   - 이유: Functions가 Rules를 사용하므로 Rules 배포 후
   - 확인: `firebase deploy --only functions`

3. **Hosting 배포** (마지막)
   - 이유: Frontend가 Functions를 호출하므로 Functions 배포 후
   - 확인: `firebase deploy --only hosting`

### 배포 확인 절차

**1. Firestore Rules 확인:**
```bash
firebase firestore:rules:get
```

**2. Functions 확인:**
```bash
firebase functions:list
```

**3. Hosting 확인:**
- 배포 URL 접속: `https://wings-baseball-club.web.app`
- 또는: `https://wings-baseball-club.firebaseapp.com`

**체크리스트:**
- [ ] Frontend 빌드 성공
- [ ] Functions 빌드 성공
- [ ] Firestore Rules 배포 성공
- [ ] Functions 배포 성공
- [ ] Hosting 배포 성공
- [ ] 배포 URL 접속 확인

**결과:** PASS / FAIL

---

## μATOM-0623: 캐시 및 Service Worker 정리

**Role:** Release Engineer  
**Task:** 캐시 및 Service Worker 버전 관리

### Service Worker 버전

**현재 버전:**
```javascript
const CACHE_NAME = 'wings-baseball-v1.1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
```

**릴리스 시 버전 업데이트:**
- `public/sw.js`의 `CACHE_NAME` 업데이트
- 예: `wings-baseball-v1.2` (새 릴리스마다 증가)

### 캐시 정리 절차

**1. Service Worker 업데이트:**
- `CACHE_NAME` 변경
- `activate` 이벤트에서 이전 캐시 삭제 확인

**2. 브라우저 캐시 클리어:**
- 사용자에게 "앱 업데이트" 안내
- 또는 Service Worker가 자동으로 이전 캐시 삭제

**확인 절차:**
1. `public/sw.js`에서 `CACHE_NAME` 확인
2. `activate` 이벤트에서 이전 캐시 삭제 로직 확인
3. 배포 후 브라우저에서 Service Worker 업데이트 확인

**체크리스트:**
- [ ] Service Worker 버전 업데이트
- [ ] 이전 캐시 삭제 로직 확인
- [ ] 배포 후 Service Worker 업데이트 확인

**결과:** PASS / FAIL

---

## μATOM-0624: 푸시 수신 확인 (프로덕션)

**Role:** Release Engineer  
**Task:** 프로덕션 환경에서 푸시 수신 확인

### 푸시 수신 확인 절차

**1. FCM 토큰 등록 확인:**
- 내정보 페이지에서 토큰 등록 상태 확인
- Firebase Console > Cloud Messaging > 토큰 목록에서 확인

**2. 공지 작성 후 푸시 발송:**
- 관리자 계정으로 공지 작성
- `createNoticeWithPush` callable 호출
- Functions 로그에서 푸시 발송 결과 확인

**3. 푸시 수신 확인:**
- 다른 사용자 계정으로 로그인
- 공지 작성 시 푸시 수신 확인
- Background 메시지 수신 확인 (앱이 백그라운드일 때)

**확인 절차:**
1. 프로덕션 환경에서 FCM 토큰 등록
2. 공지 작성 후 Functions 로그 확인
3. 푸시 수신 확인 (Foreground + Background)

**체크리스트:**
- [ ] 프로덕션 환경에서 FCM 토큰 등록 성공
- [ ] 공지 작성 후 푸시 발송 성공
- [ ] Foreground 메시지 수신 확인
- [ ] Background 메시지 수신 확인 (Service Worker)
- [ ] 푸시 클릭 시 앱으로 이동 확인

**결과:** PASS / FAIL

---

## 릴리스 준비 결과 요약

| 항목 | 결과 | 비고 |
|-----|------|------|
| μATOM-0621: 환경 변수 체크 | - | - |
| μATOM-0622: 배포 커맨드 | - | - |
| μATOM-0623: 캐시 정리 | - | - |
| μATOM-0624: 푸시 수신 확인 | - | - |

**전체 결과:** PASS / FAIL


