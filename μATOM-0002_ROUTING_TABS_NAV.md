# μATOM-0002 결과: 라우팅/탭/네비 증거 수집 (READ-ONLY)

**수집 일시**: 2024년 (현재)  
**작업 방식**: READ-ONLY (코드 변경 없음)  
**근거**: 파일 경로, 라인 번호, 코드 내용

---

## (1) 페이지 목록 (실제 파일)

### v1.1 유지 대상 페이지
| 페이지 | 파일 경로 | App.tsx 라인 | 상태 |
|--------|----------|--------------|------|
| LoginPage | `src/app/pages/LoginPage.tsx` | 라인 10, 64 | ✅ 유지 |
| AccessDeniedPage | `src/app/pages/AccessDeniedPage.tsx` | 라인 23, 69-71 | ✅ 유지 |
| HomePage | `src/app/pages/HomePage.tsx` | 라인 11, 181 | ✅ 유지 |
| BoardsPage | `src/app/pages/BoardsPage.tsx` | 라인 13, 183 | ✅ 유지 |
| SchedulePage | `src/app/pages/SchedulePage.tsx` | 라인 12, 182 | ✅ 유지 (연습·시합) |
| MyPage | `src/app/pages/MyPage.tsx` | 라인 15, 185-194 | ✅ 유지 |
| SettingsPage | `src/app/pages/SettingsPage.tsx` | 라인 17, 197 | ✅ 유지 |
| NotificationPage | `src/app/pages/NotificationPage.tsx` | 라인 18, 198 | ✅ 유지 |
| InstallPage | `src/app/pages/InstallPage.tsx` | 라인 22, 161-162 | ✅ 유지 |
| MyActivityPage | `src/app/pages/MyActivityPage.tsx` | 라인 16, 196 | ✅ 유지 |

### v1.1 제외 대상 페이지
| 페이지 | 파일 경로 | App.tsx 라인 | 제외 이유 |
|--------|----------|--------------|----------|
| AlbumPage | `src/app/pages/AlbumPage.tsx` | 라인 14, 184 | 앨범 기능 제외 |
| FinancePage | `src/app/pages/FinancePage.tsx` | 라인 20, 200 | 회계 기능 제외 |
| GameRecordPage | `src/app/pages/GameRecordPage.tsx` | 라인 21, 201 | 경기 기록 제외 |
| AdminPage | `src/app/pages/AdminPage.tsx` | 라인 19, 199 | 일부 기능 제외 (재검토 필요) |
| ApprovalPendingPage | `src/app/pages/ApprovalPendingPage.tsx` | 없음 (직접 라우팅 없음) | 가입승인 제외 |

---

## (2) 탭 목록 (실제 enum/배열)

### BottomNav 탭 (하단 네비게이션)
**파일**: `src/app/components/BottomNav.tsx`  
**라인**: 11-17

```typescript
const tabs = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'schedule', label: '일정', icon: Calendar },
  { id: 'boards', label: '게시판', icon: MessageSquare },
  { id: 'album', label: '앨범', icon: Image },        // ⚠️ v1.1 제외
  { id: 'my', label: '내정보', icon: User },
] as const;
```

**타입 정의**: `src/app/components/BottomNav.tsx` 라인 6-7
```typescript
activeTab: 'home' | 'schedule' | 'boards' | 'album' | 'my';
onTabChange: (tab: 'home' | 'schedule' | 'boards' | 'album' | 'my') => void;
```

### App.tsx PageType
**파일**: `src/app/App.tsx`  
**라인**: 27

```typescript
type PageType = 'home' | 'schedule' | 'boards' | 'album' | 'my' | 'settings' | 'notifications' | 'admin' | 'finance' | 'game-record' | 'my-activity' | 'install';
```

**activeTab 상태**: `src/app/App.tsx` 라인 36
```typescript
const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'boards' | 'album' | 'my'>('home');
```

### BoardsPage 내부 탭
**파일**: `src/app/pages/BoardsPage.tsx`  
**라인**: 50-72

```typescript
<TabsList>
  <TabsTrigger value="notice">공지</TabsTrigger>
  <TabsTrigger value="free">자유</TabsTrigger>
  <TabsTrigger value="meetup">기타</TabsTrigger>
  <TabsTrigger value="poll">투표</TabsTrigger>      // ⚠️ v1.1 제외
  <TabsTrigger value="game">경기</TabsTrigger>     // ⚠️ v1.1 제외
</TabsList>
```

**v1.1 유지**: `notice`, `free`, `meetup` (또는 `event`로 변경 예정)  
**v1.1 제외**: `poll`, `game`

---

## (3) 진입점 (실제 함수/분기)

### 메인 라우팅 로직
**파일**: `src/app/App.tsx`

#### handleNavigate (탭 변경)
**라인**: 140-144
```typescript
const handleNavigate = (tab: 'home' | 'schedule' | 'boards' | 'album' | 'my') => {
  setActiveTab(tab);
  setCurrentPage(tab);
};
```

#### handlePageChange (페이지 변경)
**라인**: 146-152
```typescript
const handlePageChange = (page: PageType) => {
  setCurrentPage(page);
  if (page !== 'settings' && page !== 'notifications' && page !== 'admin' && page !== 'finance' && page !== 'game-record') {
    setActiveTab(page as 'home' | 'schedule' | 'boards' | 'album' | 'my');
  }
};
```

#### 페이지 렌더링 분기
**라인**: 181-201
```typescript
{currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
{currentPage === 'schedule' && <SchedulePage />}
{currentPage === 'boards' && <BoardsPage />}
{currentPage === 'album' && <AlbumPage />}              // ⚠️ v1.1 제외
{currentPage === 'my' && <MyPage ... />}
{currentPage === 'finance' && <FinancePage ... />}      // ⚠️ v1.1 제외
{currentPage === 'game-record' && <GameRecordPage ... />} // ⚠️ v1.1 제외
```

### Access Gate 로직
**파일**: `src/app/App.tsx`  
**라인**: 67-83

```typescript
// ATOM-08: Access Gate - 멤버 상태 체크
if (user && memberStatus === 'denied') {
  return <AccessDeniedPage />;
}
```

**구현 위치**: `src/app/contexts/AuthContext.tsx`  
**함수**: `checkMemberAccess` (라인 65-84)

---

## (4) v1.1 제외 도메인으로 연결되는 네비 경로 (증거)

### AlbumPage 진입 경로
1. **BottomNav 탭**: `src/app/components/BottomNav.tsx` 라인 15
   - 탭 ID: `'album'`
   - 라벨: `'앨범'`
   - 아이콘: `Image`

2. **App.tsx 라우팅**: `src/app/App.tsx` 라인 184
   ```typescript
   {currentPage === 'album' && <AlbumPage />}
   ```

3. **HomePage 링크**: `src/app/pages/HomePage.tsx` 라인 197
   ```typescript
   onClick={() => onNavigate('album')}
   ```

### FinancePage 진입 경로
1. **App.tsx 라우팅**: `src/app/App.tsx` 라인 200
   ```typescript
   {currentPage === 'finance' && <FinancePage onBack={() => handlePageChange('home')} />}
   ```

2. **MyPage 링크**: `src/app/pages/MyPage.tsx` (확인 필요)
   - `onNavigateToFinance` prop 사용

### GameRecordPage 진입 경로
1. **App.tsx 라우팅**: `src/app/App.tsx` 라인 201
   ```typescript
   {currentPage === 'game-record' && <GameRecordPage onBack={() => handlePageChange('home')} />}
   ```

2. **MyPage 링크**: `src/app/pages/MyPage.tsx` (확인 필요)
   - `onNavigateToGameRecord` prop 사용

### PollVoteModal 진입 경로
1. **BoardsPage 탭**: `src/app/pages/BoardsPage.tsx` 라인 64-67
   ```typescript
   <TabsTrigger value="poll">투표</TabsTrigger>
   ```

2. **컴포넌트**: `src/app/components/PollVoteModal.tsx` 존재
   - `src/app/pages/BoardsPage.tsx` 라인 13에서 import

### ApprovalPendingPage 진입 경로
1. **파일 존재**: `src/app/pages/ApprovalPendingPage.tsx`
2. **App.tsx 라우팅**: 없음 (직접 라우팅 없음)
3. **상태**: 죽은 코드 가능성

---

## (5) 게시판 탭 구조 (BoardsPage)

**파일**: `src/app/pages/BoardsPage.tsx`

### 현재 탭 (5개)
- `notice` (공지) - ✅ v1.1 유지
- `free` (자유) - ✅ v1.1 유지
- `meetup` (기타) - ⚠️ v1.1에서 `event`로 변경 예정
- `poll` (투표) - ❌ v1.1 제외
- `game` (경기) - ❌ v1.1 제외

### 필터링 로직
**라인**: 31-40
```typescript
const notices = posts.filter(p => p.type === 'notice')...
const freePosts = posts.filter(p => p.type === 'free');
const meetupPosts = posts.filter(p => p.type === 'meetup');
const polls = posts.filter(p => p.type === 'poll');        // ⚠️ v1.1 제외
const games = posts.filter(p => p.type === 'game');         // ⚠️ v1.1 제외
```

---

## Done 체크리스트

- [x] 탭/라우팅 근거(파일/라인) 확보
- [x] 제외 도메인으로 가는 진입 경로 증거 확보
- [x] μATOM-0109(진입 제거) 대상 파일 리스트 확정

---

## μATOM-0109 대상 파일 리스트 (제거 예정)

### 파일 제거 대상
1. `src/app/pages/AlbumPage.tsx` - 앨범 페이지
2. `src/app/pages/FinancePage.tsx` - 회계 페이지
3. `src/app/pages/GameRecordPage.tsx` - 경기 기록 페이지
4. `src/app/pages/ApprovalPendingPage.tsx` - 승인 대기 페이지 (죽은 코드 가능성)
5. `src/app/components/PollVoteModal.tsx` - 투표 모달

### 코드 수정 대상 (제외 도메인 참조 제거)
1. `src/app/App.tsx`
   - 라인 14: `AlbumPage` import 제거
   - 라인 20: `FinancePage` import 제거
   - 라인 21: `GameRecordPage` import 제거
   - 라인 27: `PageType`에서 `'album'`, `'finance'`, `'game-record'` 제거
   - 라인 36: `activeTab` 타입에서 `'album'` 제거
   - 라인 184: `AlbumPage` 렌더링 제거
   - 라인 200: `FinancePage` 렌더링 제거
   - 라인 201: `GameRecordPage` 렌더링 제거

2. `src/app/components/BottomNav.tsx`
   - 라인 15: `album` 탭 제거
   - 라인 6-7: 타입에서 `'album'` 제거

3. `src/app/pages/BoardsPage.tsx`
   - 라인 13: `PollVoteModal` import 제거
   - 라인 39: `polls` 필터 제거
   - 라인 40: `games` 필터 제거
   - 라인 64-67: `poll`, `game` 탭 제거
   - 관련 TabsContent 제거

4. `src/app/pages/MyPage.tsx`
   - `onNavigateToFinance` prop 제거
   - `onNavigateToGameRecord` prop 제거
   - 관련 버튼/링크 제거

5. `src/app/pages/HomePage.tsx`
   - 라인 197: `album` 네비게이션 제거

---

**수집 완료일**: 2024년 (현재)  
**수집자**: AI Assistant (Cursor)  
**방식**: READ-ONLY (코드 변경 없음)

