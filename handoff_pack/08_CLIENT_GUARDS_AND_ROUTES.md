# handoff_pack/08_CLIENT_GUARDS_AND_ROUTES.md

## 목적/범위
클라이언트 라우팅 구조, 인증 가드, 승인 가드, 역할 가드 적용 위치 및 방법을 정리합니다.

---

## 라우팅 구조

### 페이지 타입
위치: `src/app/App.tsx` Line 25

```typescript
type PageType = 'home' | 'schedule' | 'boards' | 'album' | 'my' | 'settings' | 'notifications' | 'admin' | 'finance' | 'game-record' | 'my-activity' | 'install';
```

### 라우팅 방식
- **방식**: React State 기반 (URL 라우팅 없음)
- **상태**: `AppContent` 컴포넌트의 `currentPage` state

---

## 주요 Route 표

| Route (PageType) | 파일 | 인증 가드 | 승인 가드 | 역할 가드 |
|------------------|------|----------|----------|----------|
| `home` | `HomePage.tsx` | ✅ | ❌ | ❌ |
| `schedule` | `SchedulePage.tsx` | ✅ | ❌ | ❌ |
| `boards` | `BoardsPage.tsx` | ✅ | ⚠️ (pending 제한) | ❌ |
| `album` | `AlbumPage.tsx` | ✅ | ❌ | ❌ |
| `my` | `MyPage.tsx` | ✅ | ❌ | ❌ |
| `settings` | `SettingsPage.tsx` | ✅ | ❌ | ❌ |
| `notifications` | `NotificationPage.tsx` | ✅ | ❌ | ❌ |
| `admin` | `AdminPage.tsx` | ✅ | ❌ | ✅ (isAdmin) |
| `finance` | `FinancePage.tsx` | ✅ | ❌ | ✅ (isTreasury) |
| `game-record` | `GameRecordPage.tsx` | ✅ | ❌ | ⚠️ (기록원/관리자) |
| `my-activity` | `MyActivityPage.tsx` | ✅ | ❌ | ❌ |
| `install` | `InstallPage.tsx` | ❌ | ❌ | ❌ |

---

## 인증 가드 (Authentication Guard)

### 위치: `src/app/App.tsx` Line 59-62

```typescript
// If not logged in, show login page
if (!user && currentPage !== 'install') {
  return <LoginPage />;
}
```

**적용 범위**: 모든 페이지 (`install` 제외)

**조건**: `user === null` → `LoginPage` 렌더

---

## 승인 가드 (Access Gate)

### ✅ 활성화됨 (보안 강화)

**위치**: `src/app/App.tsx` Line 68-72 (ATOM-08)

```typescript
// ATOM-08: Access Gate - Check for Active Status
// 활성(active) 상태가 아닌 모든 사용자는 접근이 전면 차단됩니다.
if (user && user.status !== 'active' && currentPage !== 'install') {
  return <AccessDeniedPage status={user.status} />;
}
```

**현재 정책**: `pending`, `rejected`, `withdrawn` 상태의 모든 사용자는 앱 내부 진입이 불가능하며, `AccessDeniedPage`로 리다이렉트됩니다.

---

## 역할 가드 (Role Guard)

### 1. 관리자 페이지

**위치**: `src/app/pages/AdminPage.tsx` Line 72-77

```typescript
useEffect(() => {
  if (!isAdmin()) {
    toast.error('관리자 권한이 필요합니다');
    return;
  }
}, []);
```

**조건**: `isAdmin()` === true

**권한 함수**: `AuthContext.isAdmin()` → `['PRESIDENT', 'DIRECTOR', 'ADMIN', 'TREASURER'].includes(role)`

---

### 2. 회계 페이지

**위치**: `src/app/pages/FinancePage.tsx` Line 165-175

```typescript
if (!isTreasury()) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-16 pb-20">
      <div className="text-center">
        <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-bold mb-2">접근 권한 없음</h2>
        <p className="text-gray-600">총무만 접근할 수 있습니다.</p>
      </div>
    </div>
  );
}
```

**조건**: `isTreasury()` === true

**권한 함수**: `AuthContext.isTreasury()` → `['PRESIDENT', 'TREASURER'].includes(role)`

---

### 3. 경기 기록 페이지 (WF-07)

**위치**: `src/app/pages/GameRecordPage.tsx` Line 155-160

```typescript
const canViewRecordTab = React.useMemo(() => {
  if (!user) return false;
  return isAdmin() || (game.recorders && game.recorders.includes(user.id));
}, [user, game, isAdmin]);
```

**조건**: 
- `isAdmin()` === true OR
- `user.id in post.recorders`

**상세**: `handoff_pack/09_WF07_GAME_RECORDING_IMPLEMENTATION.md` 참조

---

### 4. 공지사항 작성

**위치**: `src/app/components/CreatePostModal.tsx` Line 41-51

```typescript
const postTypes: { id: PostType; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: 'notice', label: '공지사항', icon: FileText, adminOnly: true },
  // ...
];

const availableTypes = isAdmin()
  ? postTypes
  : postTypes.filter(t => !t.adminOnly);
```

**조건**: `isAdmin()` === true (공지사항 타입 표시)

---

## 승인 대기 (PENDING) 사용자가 보게 되는 화면

### 현재 동작

1. **로그인 성공**: 앱 메인 화면 진입 (모든 탭 접근 가능)
2. **게시글 작성 버튼**: 숨김 (`BoardsPage.tsx` Line 120)
3. **일부 기능 제한**: 실제 권한 체크는 각 기능에서 수행

### 제한되는 기능

- 게시글 작성 (FAB 버튼 숨김)
- 관리자 페이지 접근 불가 (`isAdmin()` === false)
- 회계 페이지 접근 불가 (`isTreasury()` === false)

---

## 관리자 화면 진입 조건

### AdminPage

**진입 경로**: 
1. `MyPage` → "관리자 페이지" 버튼 클릭
2. `App.tsx` Line 182: `handleNavigateToAdmin()` 호출

**가드**: `AdminPage.tsx` Line 72-77 (useEffect에서 권한 체크)

**조건**: `isAdmin()` === true

**권한 함수**: `AuthContext.isAdmin()` → `['PRESIDENT', 'DIRECTOR', 'ADMIN', 'TREASURER'].includes(role)`

---

## TODO/누락

1. **승인 가드 활성화 결정**: `ApprovalPendingPage` 사용 여부 결정 필요
2. **URL 라우팅**: 현재 State 기반 라우팅, 향후 React Router 도입 고려
3. **권한 일관성**: 클라이언트 가드와 Firestore Rules 일치 여부 검증

