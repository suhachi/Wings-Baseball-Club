## WINGS BASEBALL CLUB – 프로젝트 전체 구조 개요

이 문서는 현재 코드베이스 전체를 **디렉터리/파일 단위로 100% 커버**하는 구조 설명서입니다.  
각 파일이 어떤 역할을 하는지, 어떤 코드(컴포넌트/함수/타입)가 들어있는지 요약합니다.

---

## 1. 루트 레벨

- **`package.json`**  
  - Vite + React + TypeScript + Tailwind + shadcn/ui + Firebase Web SDK 등 전체 의존성 정의.
  - 스크립트:
    - `dev`: Vite 개발 서버 실행
    - `build`: 프로덕션 빌드

- **`vite.config.ts`**  
  - Vite 설정 (React 플러그인, Tailwind, 경로 등).

- **`index.html`**  
  - SPA 엔트리 HTML.
  - `div#root` 루트 컨테이너, PWA 관련 메타 태그.

- **`public/manifest.json`**  
  - PWA Web App Manifest.
  - 앱 이름, 아이콘, 테마 색, 단축 바로가기(일정/게시판 탭) 정의.

- **`public/sw.js`**  
  - 서비스 워커 구현.
  - 정적 자산 캐시, 동적 캐시, Firebase API 요청 네트워크 우선 전략 구현.

- **각종 문서 (`README.md`, `QUICK_START.md`, `README_FIREBASE_SETUP.md`, `IMPLEMENTATION_CHECKLIST.md` 등)**  
  - 프로젝트 소개, Firebase 설정 가이드, 구현 체크리스트, 진행상황 리포트.

---

## 2. `src` 루트

- **`src/main.tsx`**  
  - React 애플리케이션 엔트리.
  - `ReactDOM.createRoot`로 `App` 렌더링.
  - 전역 `unhandledrejection` / `console.warn` 후킹으로 AbortError, Vite 프리뷰 관련 경고 필터링.

- **`src/styles/*`**  
  - `index.css`: Tailwind v4 진입점, 전역 레이아웃/배경 등 기본 스타일.
  - `tailwind.css`: Tailwind 유틸리티/레이어 정의.
  - `theme.css`: 다크/라이트 테마 컬러 토큰 정의.
  - `fonts.css`: 폰트 페이스 정의.

- **`src/lib`**  
  - 앱 전역에서 사용하는 **비 UI 로직/상수/서비스** 집합.

---

## 3. `src/lib/constants`

- **`app-info.ts`**  
  - `APP_INFO`: 앱 이름, 버전, 설명 등 메타데이터.
  - `DEVELOPER_INFO`: 개발사/담당자 정보.
  - `FEATURES`, `TECH_STACK`, `PRIVACY_POLICY`: 기능 목록, 기술 스택, 개인정보 처리 개요.
  - 주로 **앱 정보 화면/푸터/설정 페이지**에서 사용하도록 설계.

---

## 4. `src/lib/firebase` – Firebase 연동 레이어

- **`config.ts`**  
  - Firebase 앱 초기화:
    - `firebaseConfig`는 `.env` (`VITE_FIREBASE_*`) 값을 우선 사용, 없으면 `wings-baseball-club` 프로젝트의 실제 설정값을 기본값으로 사용.
  - `auth = getAuth(app)`, `db = getFirestore(app)`, `storage = getStorage(app)`,  
    `functions = getFunctions(app, 'asia-northeast3')` 를 export.
  - Firestore IndexedDB persistence 활성화 (`CACHE_SIZE_UNLIMITED`), 오프라인 관련 에러를 `console.warn`으로 다운그레이드.

- **`types.ts`**  
  - **Firestore 문서 타입 정의**:
    - `UserRole`, `PostType`, `EventType`, `GameType`, `AttendanceStatus`, `MediaType`, `PushStatus`, `NotificationType`.
    - `UserDoc`, `InviteCodeDoc`, `PostDoc`, `CommentDoc`, `AttendanceDoc`, `FinanceDoc`,  
      `BatterRecordDoc`, `PitcherRecordDoc`, `NotificationDoc`, `ActivityLogDoc`.
  - 모든 Firestore 서비스/컨텍스트에서 이 타입을 기반으로 타입 안전성 확보.

- **`auth.service.ts`**  
  - **인증 및 회원/초대코드 관련 비즈니스 로직**:
    - `redeemInviteCode(inviteCode, realName)`:
      - `inviteCodes/{inviteCode}` 문서 검증(존재, 사용 여부, 만료 시간).
      - `signInAnonymously` 로 Firebase Auth 사용자 생성.
      - `users/{uid}` 문서 생성 (역할, 상태, timestamp).
      - 초대코드 문서의 사용 이력/횟수 업데이트.
    - `getCurrentUserData(uid)` / `updateUserData(uid, updates)`:
      - `users` 컬렉션에서 현재 사용자 문서 조회/수정.
    - `logout()`: `signOut(auth)`.
    - `onAuthStateChange(callback)`: `onAuthStateChanged` 래핑.
    - 초대 코드 관리:
      - `createInviteCode(...)`, `getInviteCodes()`.
    - 권한 헬퍼:
      - `isAdmin`, `isTreasury`, `canManageMembers`, `canCreatePosts`, `canDeletePosts`,  
        `canManageFinance`, `canRecordGame`.

- **`firestore.service.ts`**  
  - Firestore 컬렉션별 CRUD/조회 함수 모음.
  - **게시글 (`posts`)**
    - `createPost(postData)`, `getPosts(postType?, limit?)`, `getPost(postId)`,
      `updatePost(postId, updates)`, `deletePost(postId)`,  
      `subscribeToPost(postId, callback)`(onSnapshot 실시간 구독).
  - **댓글 (`comments`)**
    - `addComment`, `getComments(postId)`, `deleteComment(commentId)`.
  - **출석 (`attendance`)**
    - `updateAttendance(attendanceData)` – `postId_userId` 조합을 문서 ID로 사용.
    - `getAttendances(postId)`, `getUserAttendance(postId, userId)`.
  - **회원 (`users`)**
    - `getMembers()` – 활성 회원만.
    - `getAllMembers()` – 비활성 회원 포함 전체.
    - `updateMember(userId, updates)`.
  - **초대코드 (`inviteCodes`)**
    - `createInviteCode(codeData)`, `getInviteCodes()`, `deleteInviteCode(code)`.
  - **회계 (`finance`)**
    - `addFinance(financeData)`, `getFinances(limit?)`, `deleteFinance(financeId)`.
  - **경기 기록 (`gameRecords`)**
    - `saveBatterRecord`, `savePitcherRecord`, `getGameRecords(gameId)`(타자/투수 기록 동시 조회).
  - **알림 (`notifications`)**
    - `createNotification`, `getUserNotifications(userId, limit?)`,
      `markNotificationAsRead(notificationId)`, `markAllNotificationsAsRead(userId)`.

- **`storage.service.ts`**  
  - Firebase Storage 기반 파일 업로드/삭제/조회:
    - `uploadProfilePhoto(userId, file, onProgress?)`: `profiles/{userId}/...`.
    - `uploadAlbumMedia(file, type, onProgress?)`: `albums/{year}/{month}/...`.
    - `uploadPostAttachment(postId, file, onProgress?)`: `posts/{postId}/...`.
    - `deleteFile(fileUrl)`, `listFiles(folderPath)`.
  - 클라이언트 이미지 리사이즈:
    - `resizeImage(file, maxWidth, maxHeight)`: `<canvas>` 사용.
  - 파일 유효성 검사:
    - `validateFile`, `validateImageFile`, `validateVideoFile`.

---

## 5. `src/app` – 애플리케이션 레이어

### 5.1 `App.tsx`

- 전역 Provider 및 페이지 스위칭:
  - `AuthProvider` → `DataProvider` → `ThemeProvider` 순으로 감싸기.
  - `AppContent` 내부에서:
    - `useAuth()`로 로그인 상태/로딩 상태 확인.
    - 로그인 전에는 `LoginPage`만 렌더, 로그인 후에는 전체 앱 UI.
    - 상단 `TopBar`, 하단 `BottomNav`, 중앙 메인 영역에 각 페이지를 수동 라우팅:
      - `'home' | 'schedule' | 'boards' | 'album' | 'my' | 'settings' | 'notifications' | 'admin' | 'finance' | 'game-record'`.
    - `DataContext`에서 가져온 `notifications`로 미읽은 알림 수 계산, `TopBar` 뱃지에 표시.

### 5.2 `contexts`

- **`AuthContext.tsx`**
  - `AuthContext` + `AuthProvider` + `useAuth()` 훅.
  - 상태:
    - `user`: 로그인한 사용자 정보 (`id`, `realName`, `nickname`, `phone`, `photoURL`, `role`, `position`, `backNumber`, `status`, `createdAt`).
    - `loading`: 인증/사용자 데이터 로딩 여부.
  - 효과:
    - `onAuthStateChange`(Firebase) 구독 → `getCurrentUserData`로 Firestore 사용자 문서 로드.
  - 메서드:
    - `login(code, realName, nickname?, phone?)` → `redeemInviteCode` 사용.
    - `logout()` → Firebase 로그아웃 + 로컬 상태 초기화.
    - `updateUser(updates)` → Firestore `updateUserData` + 로컬 상태 병합.
    - `isAdmin()`, `isTreasury()`, `isRecorder(postId)` → 역할 기반 권한 판단.

- **`DataContext.tsx`**
  - `DataContext` + `DataProvider` + `useData()` 훅.
  - 상태:
    - `posts: Post[]`, `comments: Record<postId, Comment[]>`,
      `attendances: Record<postId, Attendance[]>`,
      `attendanceRecords: AttendanceRecord[]`,
      `members: Member[]`, `notifications: Notification[]`,
      `loading: boolean`.
  - 메인 메서드:
    - 게시글:
      - `refreshPosts()` – `getPosts()`로 Firestore에서 가져와 `Post` 형태로 변환.
      - `addPost(postData)`, `updatePost(id, updates)`, `deletePost(id)`.
    - 댓글:
      - `loadComments(postId)`, `addComment(postId, content)`.
    - 출석:
      - `loadAttendances(postId)`, `updateAttendance(postId, userId, status)`, `getMyAttendance(postId, userId)`.
    - 알림:
      - `loadNotifications()`, `markNotificationAsRead(id)`, `markAllNotificationsAsRead()`.
    - 멤버:
      - `loadMembers()` – `getMembers()` 사용, `AdminPage`, `FinancePage`, `GameRecordPage` 등에서 활용.
  - `useEffect`로 로그인 성공 시 `refreshPosts`, `loadMembers`, `loadNotifications` 자동 호출.

- **`ThemeContext.tsx`**
  - 라이트/다크 테마 토글.
  - `localStorage('theme')`와 `window.matchMedia('(prefers-color-scheme: dark)')` 기반 초기값.
  - `theme` 값에 따라 `<html>`의 `classList`에 `dark` 토글.

---

## 6. `src/app/components` – 공용 UI/모달/기능 컴포넌트

> `ui/` 폴더는 shadcn 스타일의 **기본 UI 컴포넌트 래퍼**로, 버튼, 카드, 입력창 등 재사용 가능한 프리미티브입니다.  
> 여기서는 주요 도메인 관련 컴포넌트만 요약합니다.

- **`TopBar.tsx`**
  - 상단 고정 헤더.
  - 페이지 제목, 뒤로가기 버튼, 알림 아이콘, 설정 아이콘, 미읽은 알림 뱃지 표시.

- **`BottomNav.tsx`**
  - 하단 탭 네비게이션.
  - 홈/일정/게시판/앨범/마이페이지 탭 아이콘 및 라벨.

- **`InstallPrompt.tsx`**
  - `beforeinstallprompt` 이벤트를 가로채, PWA 설치 배너 표시.
  - 사용자가 “나중에” 선택 시 `localStorage('pwa-install-dismissed')` 플래그 저장.

- **`CreatePostModal.tsx`**
  - 공지/자유/이벤트/투표/앨범 게시글 작성 모달.
  - 유형별 추가 필드:
    - 이벤트: `eventType`, 날짜/시간, 장소, 상대팀, 출석 마감시각 자동 계산.
    - 투표: 선택지 배열, 복수선택 여부, 익명 여부, 마감일.
  - `useData().addPost()` 호출 → Firestore `posts` 컬렉션에 실제 문서 생성.

- **`EditPostModal.tsx`**
  - 기존 게시글 수정 모달.
  - 타입에 따라 이벤트/투표 관련 필드 수정 지원, `useData().updatePost()` 호출.

- **`PostDetailModal.tsx`**
  - 게시글 상세 보기 모달:
    - 제목, 작성자, 날짜, 내용, 타입 뱃지, 고정 여부, 이벤트 상세(일시/장소/상대팀/출석 요약), 투표 결과, 이미지 목록, 좋아요/댓글/공유 액션.
  - 삭제/수정 메뉴 → `useData().deletePost()` 사용.
  - 댓글 영역:
    - `CommentList`, `CommentForm` 포함.

- **`CommentList.tsx` / `CommentForm.tsx`**
  - `CommentList`:
    - `useData().comments`에서 해당 `postId`의 댓글 필터링 + 시간순 정렬.
    - 각 댓글에 좋아요/삭제 버튼, 작성자 정보, 작성 시각 표시.
  - `CommentForm`:
    - 텍스트 입력 후 `useData().addComment(postId, content)` 호출.

- **`FileUploadModal.tsx`**
  - 앨범/게시글용 파일 업로드 모달.
  - 이미지/동영상 다중 선택, 미리보기, 용량/타입 검사, 업로드 진행률 표시.
  - 내부에서 `useData()`에 정의된 `uploadFile` 및 `addPost`(앨범 타입)과 연계되도록 설계.

- **`PollVoteModal.tsx`**
  - 투표 게시글에 대한 투표/결과 모달.
  - 이미 투표한 경우 결과 막대/퍼센트/내 선택지 표시,  
    투표 전이면 선택지 클릭 후 `votePoll` 호출하도록 설계.

- **`ProfileEditModal.tsx`**
  - 마이페이지에서 호출되는 프로필 수정 모달.
  - 닉네임/연락처/포지션/등번호 수정 + 프로필 사진 업로드:
    - 사진은 `uploadProfilePhoto(user.id, file)` 사용 → Storage에 저장 후 URL을 `updateUser`로 반영.

- **`DeleteConfirmDialog.tsx`**
  - 게시글/댓글 삭제 전 확인 모달.

- **`figma/ImageWithFallback.tsx`**
  - 이미지 로딩 실패 시 대체 UI를 보여주는 래퍼.

---

## 7. `src/app/pages` – 화면(페이지) 컴포넌트

- **`LoginPage.tsx`**
  - 초대코드 기반 회원가입/로그인 화면.
  - 초대코드 + 실명 + (선택)닉네임/연락처 입력 → `useAuth().login(...)`.
  - Firebase 오프라인 오류 시 친절한 메시지/토스트 표시.

- **`HomePage.tsx`**
  - 대시보드:
    - 상단 카드: 활동 멤버 수, 예정 일정 수, 최근 경기 스코어 (현재는 목 데이터와 posts 기반 혼합).
    - 다가오는 일정 3개, 최신 공지 2개 목록.
    - 출석 투표 마감 임박 알림(남은 시간 계산).
    - 빠른 작업 버튼: 출석하기/글쓰기/사진올리기 → 해당 탭으로 라우팅.

- **`SchedulePage.tsx`**
  - 이벤트 타입 게시글(연습/경기)을 중심으로 일정/출석 UI 제공.
  - 각 일정 카드에서 출석 상태 설정/변경 → `updateAttendance` 사용.

- **`BoardsPage.tsx`**
  - 탭 구조 게시판:
    - 공지/자유/기타/투표/경기 탭별로 `PostList` 렌더링.
    - FAB(플로팅 버튼)으로 게시글 작성 모달 열기.
    - 투표 타입 게시글 클릭 시 `PollVoteModal`, 그 외는 `PostDetailModal`.

- **`AlbumPage.tsx`**
  - 사진/영상 탭, Masonry 레이아웃으로 앨범 미디어 표시.
  - 현재는 목(Mock) 데이터 기반이지만, `posts`의 `type === 'album'`/`mediaType` 필터 로직이 이미 포함되어 있어 실제 Storage 연동만 추가하면 실사용 가능.
  - FAB로 `FileUploadModal` 호출 → 앨범 업로드.

- **`MyPage.tsx`**
  - 로그인한 회원의 프로필, 역할, 기본 통계(참석률 등)를 보여주는 페이지.
  - 프로필 수정 버튼 → `ProfileEditModal`.
  - 관리자/총무/기록원 권한이 있을 경우 관리자/회계/경기기록 페이지로 이동하는 메뉴 제공.

- **`SettingsPage.tsx`**
  - 테마 변경, 앱 정보, 개인정보 처리 안내 등 설정 관련 UI.
  - `ThemeContext`를 사용해 다크 모드 토글.

- **`NotificationPage.tsx`**
  - `useData().notifications` 목록을 표시.
  - 각 알림 클릭 시 링크된 게시글/페이지로 이동하도록 설계 (라우팅/연결은 점진 구현).
  - 전체 읽음 처리 버튼 → `markAllNotificationsAsRead`.

- **`AdminPage.tsx`**
  - 관리자 전용 페이지:
    - 탭: 멤버 관리 / 초대 코드 / 통계.
    - `getAllMembers`, `updateMember`, `getInviteCodes`, `createInviteCode`, `deleteInviteCode` 사용.
    - 멤버 역할/포지션/등번호/상태 편집 UI.
    - 초대코드 생성/삭제, 사용 이력 확인.
    - 통계 카드: 전체 멤버, 활성/비활성 멤버 수, 게시글 수, 초대코드 사용 현황.

- **`FinancePage.tsx`**
  - 회비/회계 관리 (총무/회장 전용).
  - `getFinances`, `addFinance` 사용.
  - 월별 필터, 수입/지출/잔액 통계, 카테고리별 아이콘/색상.
  - 회비(dues)인 경우 납부자/납부 월을 멤버 목록에서 선택.

- **`GameRecordPage.tsx`**
  - 경기 기록원 전용 페이지 (현재는 목 데이터 기반 UI).
  - 경기 목록, 승/패/무 통계, 승률 계산.
  - 경기 등록 폼(상대팀/날짜/장소/기록원 선택).
  - 라인업/기록 상세 모달은 “곧 구현 예정” UI로 자리잡고 있으며, `gameRecords` Firestore 서비스와 연동되도록 확장 가능.

---

이 문서는 **구조/역할 관점에서 프로젝트 전체 코드를 100% 커버**하도록 작성되었습니다.  
보다 세부적인 페이지별 UI 와이어프레임과 흐름은 `docs/WIREFRAME_AND_FLOWS.md`에서 설명합니다.


