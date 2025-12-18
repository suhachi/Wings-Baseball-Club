# 01. REPO SNAPSHOT
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA  
**목적**: 현재 레포 상태를 재현 가능하게 고정

---

## 📍 Git 상태

### 현재 Branch & Commit
```
Branch: main
Latest Commit: 40d929c0acd84142eec03b78b66f8d1d8fa315a5
Commit Message: "WIP: fix TS issues and refine pages"
Repository Status: Up to date with origin/main
```

### Git Status 결과
**Modified files (16개)**:
- `.firebase/hosting.ZGlzdA.cache`
- `firestore.rules`
- `src/app/components/CommentList.tsx`
- `src/app/components/FileUploadModal.tsx`
- `src/app/components/MemberPicker.tsx`
- `src/app/components/PollVoteModal.tsx`
- `src/app/components/PostDetailModal.tsx`
- `src/app/contexts/DataContext.tsx`
- `src/app/pages/AdminPage.tsx`
- `src/app/pages/AlbumPage.tsx`
- `src/app/pages/GameRecordPage.tsx`
- `src/app/pages/MyActivityPage.tsx`
- `src/app/pages/MyPage.tsx`
- `src/app/pages/SchedulePage.tsx`
- `src/lib/firebase/firestore.service.ts`
- `src/lib/firebase/types.ts`

**Untracked files (주요)**:
- `.github/copilot-instructions.md`
- `src/app/components/game-record/` (new directory)
- `handoff_pack/` (문서)

**결론**: Working directory에 다수의 변경 사항이 있으나, git status상 "Changes not staged"이므로 스냅샷 작성 시점 기준 커밋되지 않음.

---

## 🌳 디렉토리 트리 (깊이 2~3)

```
wings-baseball-club/
├── src/
│   ├── app/
│   │   ├── App.tsx                    ← 메인 라우팅 엔트리 (상태 기반)
│   │   ├── components/
│   │   │   ├── ui/                   ← shadcn/ui 컴포넌트 모음
│   │   │   ├── game-record/          ← 경기 기록 컴포넌트 (NEW)
│   │   │   │   ├── LineupEditor.tsx
│   │   │   │   ├── BatterTable.tsx
│   │   │   │   ├── PitcherTable.tsx
│   │   │   ├── CommentList.tsx        ← 댓글 목록 (이슈 A 관련)
│   │   │   ├── CommentForm.tsx
│   │   │   ├── MemberPicker.tsx       ← 멤버 선택 (이슈 B 관련)
│   │   │   ├── BottomNav.tsx
│   │   │   ├── TopBar.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx        ← 인증 상태 관리
│   │   │   ├── DataContext.tsx        ← 게시글/댓글/멤버 데이터
│   │   │   ├── ClubContext.tsx        ← 클럽 상태 관리
│   │   │   ├── ThemeContext.tsx
│   │   ├── pages/
│   │   │   ├── GameRecordPage.tsx     ← 경기 기록 페이지 (이슈 A, B, C 관련)
│   │   │   ├── LoginPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── SchedulePage.tsx
│   │   │   ├── BoardsPage.tsx
│   │   │   ├── AlbumPage.tsx
│   │   │   ├── AdminPage.tsx
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts              ← Firebase 초기화 (keys 마스킹됨)
│   │   │   ├── auth.service.ts        ← 인증 서비스 (가입 정책 구현)
│   │   │   ├── firestore.service.ts   ← Firestore 읽기/쓰기
│   │   │   ├── storage.service.ts
│   │   │   ├── types.ts               ← Firestore 문서 타입
│   │   ├── constants/
│   │   ├── utils/
│   ├── styles/
│   │   ├── tailwind.css
│   │   ├── index.css
│   │   ├── theme.css
│   │   ├── fonts.css
│   ├── main.tsx                       ← React 엔트리
│   ├── vite-env.d.ts
├── public/
│   ├── manifest.json                 ← PWA 설정
│   ├── sw.js                         ← Service Worker
├── firestore.rules                   ← Firestore 보안 규칙
├── firebase.json                     ← Firebase 배포 설정
├── .firebaserc                       ← Firebase 프로젝트 ID
├── vite.config.ts                    ← Vite 빌드 설정
├── tsconfig.json                     ← TypeScript 설정
├── package.json                      ← 의존성
├── index.html                        ← HTML 엔트리
```

---

## 🔧 환경 정보

### Node.js & npm 버전
```
Node.js: v22.19.0
npm: 10.x.x (정확한 마이너 버전은 미확인, package-lock.json 참조)
```

### 주요 스크립트 (package.json)
```json
{
  "scripts": {
    "build": "vite build",              ← 프로덕션 빌드
    "dev": "vite",                       ← 개발 서버 (기본 포트: 5173)
    "export:code": "node scripts/export-code-to-md.mjs",
    "type-check": "tsc --noEmit"         ← TypeScript 타입 검사
  }
}
```

### 프레임워크 버전 (주요)
| 패키지 | 버전 | 역할 |
|--------|------|------|
| React | 18.3.1 | UI 라이브러리 |
| TypeScript | 5.2.2+ | 타입 시스템 |
| Vite | 6.3.5 | 빌드 도구 |
| Tailwind CSS | 4.1.12 | 스타일링 |
| Firebase | 12.7.0 | 백엔드 |
| Motion (Framer) | 12.23.24 | 애니메이션 |

---

## 🎯 핵심 엔트리 포인트

### 1. **라우팅 시스템 (App.tsx)**
**위치**: `src/app/App.tsx` (라인 1~216)

**특징**: **Custom State-Based Routing** (react-router-dom 미사용)
```typescript
// 라우팅 상태
const [currentPage, setCurrentPage] = useState<PageType>('home');
// PageType = 'home' | 'schedule' | 'boards' | 'album' | 'my' | 'settings' 
//          | 'notifications' | 'admin' | 'finance' | 'game-record' | 'my-activity' | 'install'

// 네비게이션
const handlePageChange = (page: PageType) => setCurrentPage(page);
```

**예외**: `/install` 경로는 `window.location.pathname`으로 처리
```typescript
React.useEffect(() => {
  if (window.location.pathname === '/install') {
    setCurrentPage('install');
  }
}, []);
```

**결론**: 네비게이션 시 `setCurrentPage` 또는 `handlePageChange` 콜백 사용 필수.

### 2. **인증 컨텍스트 (AuthContext.tsx)**
**위치**: `src/app/contexts/AuthContext.tsx` (라인 1~236)

**제공 훅**:
```typescript
export const useAuth = () => {
  return {
    user: User | null,
    loading: boolean,
    signInWithGoogle: () => Promise<void>,
    signInWithEmail: (email, pass) => Promise<void>,
    registerWithEmail: (email, pass, name) => Promise<FirebaseUser>,
    createMsgAccount: (firebaseUser, inviteCode, realName, ...) => Promise<void>,
    logout: () => void,
    updateUser: (updates) => void,
    isAdmin: () => boolean,
    isTreasury: () => boolean,
    isRecorder: (postId) => boolean
  }
}
```

**사용자 역할**:
```typescript
export type UserRole = 'PRESIDENT' | 'DIRECTOR' | 'TREASURER' | 'ADMIN' | 'MEMBER';
export type UserStatus = 'pending' | 'active' | 'rejected' | 'withdrawn';
```

### 3. **데이터 컨텍스트 (DataContext.tsx)**
**위치**: `src/app/contexts/DataContext.tsx` (라인 1~653)

**제공 훅**:
```typescript
export const useData = () => {
  return {
    posts: Post[],
    comments: Record<postId, Comment[]>,
    members: Member[],
    notifications: Notification[],
    addComment: (postId, content) => Promise<void>,
    updatePost: (postId, updates) => Promise<void>,
    deleteComment: (postId, commentId) => Promise<void>,
    ...
  }
}
```

### 4. **Firebase 초기화 (config.ts)**
**위치**: `src/lib/firebase/config.ts`

**구조**: 
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// config 값은 .env에서 VITE_FIREBASE_* 로드
```

**참고**: 실제 설정값은 `.env` 파일에서 로드 (이 문서에서는 마스킹).

---

## 📋 가입 정책 분석

### 정책 요약
✅ **구글 가입 + 관리자 승인(pending→active) 방식 확인됨**

### 근거

#### (1) 로그인 흐름 (auth.service.ts)
**파일**: `src/lib/firebase/auth.service.ts` (라인 101~130)

```typescript
// 2-A. 구글 로그인
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}
```

#### (2) 계정 생성 (auth.service.ts, 라인 ~180)
```typescript
export async function createAccount(
  firebaseUser: FirebaseUser,
  inviteCode: string | null | undefined,
  realName: string,
  nickname?: string,
  phone?: string
): Promise<UserDoc> {
  // ...
  const userData: UserDoc = {
    uid: firebaseUser.uid,
    realName,
    nickname,
    phone,
    photoURL: firebaseUser.photoURL || undefined,
    role: determineRoleFromInvite(inviteCode) || 'MEMBER', // 초대코드가 없으면 MEMBER
    status: 'pending', // ✅ 기본값: pending (관리자 승인 대기)
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  // ...
  await setDoc(userDoc, userData);
  return userData;
}
```

#### (3) 상태 관리 (AuthContext.tsx, 라인 ~150)
```typescript
const user = {
  status: 'pending' | 'active' | 'rejected' | 'withdrawn';
};
```

#### (4) Firestore Rules (firestore.rules, 라인 24)
```
function isActiveMember(clubId) {
  return isClubMember(clubId) && member(clubId).status == 'active';
}
```

게시글/댓글 작성 권한:
```
allow create: if isActiveMember(clubId);  // ← pending 사용자는 차단됨
```

### 결론
| 항목 | 상태 | 근거 |
|------|------|------|
| 가입 방식 | ✅ 구글만 | `loginWithGoogle()` 구현, 이메일은 선택적 |
| 초기 상태 | ✅ pending | `auth.service.ts:createAccount` 라인 ~185 |
| 승인 메커니즘 | ✅ 관리자 수동 | `firestore.rules` isActiveMember 체크 |
| Write 차단 | ✅ pending 차단 | 규칙: `allow create: if isActiveMember(clubId)` |

---

## 🔍 심화 분석: 초대 코드 vs 자유 가입

### 발견사항: Fallback 정책 존재
**파일**: `src/lib/firebase/auth.service.ts` (라인 40~60)

```typescript
export async function validateInviteCode(inviteCode: string): Promise<InviteCodeData> {
  // ...
  if (querySnapshot.empty) {
    // Emergency Fallback: If 'WINGS2024' is entered but missing, create it.
    if (inviteCode === 'WINGS2024') {
      const fallbackData: InviteCodeData = {
        code: 'WINGS2024',
        role: 'MEMBER',
        isUsed: false,
        maxUses: 9999,
        currentUses: 0,
        clubId: 'default-club',
        expiresAt: null,
      };
      await setDoc(doc(db, 'inviteCodes', 'WINGS2024'), { ... });
      return fallbackData;
    }
    // ...
  }
}
```

**의미**: 초대 코드 'WINGS2024'가 존재하지 않으면 자동 생성 → **사실상 자유 가입 가능**

---

## ✅ 스냅샷 검증 체크리스트

- [x] Git branch & commit hash 확인 (✅ main / 40d929c0...)
- [x] Modified/Untracked 파일 확인 (✅ 16 modified + game-record/ 신규)
- [x] Node.js/npm 버전 확인 (✅ v22.19.0)
- [x] 핵심 엔트리 파일 위치 확인 (✅ App.tsx, AuthContext.tsx, config.ts)
- [x] 라우팅 방식 확인 (✅ State-based, react-router-dom 미사용)
- [x] 가입 정책 검증 (✅ Google + pending→active)
- [x] Firebase 초기화 구조 확인 (✅ .env 기반 로드)
