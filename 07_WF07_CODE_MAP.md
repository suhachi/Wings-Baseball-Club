# 07. WF07 CODE MAP
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA - Workflow 07 (경기 기록)  
**목적**: 경기 기록 기능 코드 구조와 데이터 흐름 지도

---

## 🗺️ 관련 파일 및 역할

### Core Components

| 파일 | 경로 | 역할 | 라인 | 우선도 |
|-----|------|------|------|--------|
| **GameRecordPage.tsx** | `src/app/pages/GameRecordPage.tsx` | 경기 기록 메인 페이지, 모달 및 탭 관리 | 1-449 | P0 |
| **LineupEditor.tsx** | `src/app/components/game-record/LineupEditor.tsx` | 라인업 편집 (1-9타자 선택/포지션) | 1-212 | P0 |
| **BatterTable.tsx** | `src/app/components/game-record/BatterTable.tsx` | 타자 기록 테이블 입력 | 1-171 | P0 |
| **PitcherTable.tsx** | `src/app/components/game-record/PitcherTable.tsx` | 투수 기록 테이블 입력 | 1-200 | P0 |

### Supporting Components

| 파일 | 경로 | 역할 | 라인 | 연관 이슈 |
|-----|------|------|------|---------|
| **MemberPicker.tsx** | `src/app/components/MemberPicker.tsx` | 멤버 선택 모달 | 1-184 | **Issue B** |
| **CommentList.tsx** | `src/app/components/CommentList.tsx` | 댓글 목록 렌더링 | 1-149 | **Issue A** |
| **CommentForm.tsx** | `src/app/components/CommentForm.tsx` | 댓글 입력 폼 (있으면) | N/A | **Issue A** |

### Data Layer

| 파일 | 경로 | 역할 | 관련 함수 |
|-----|------|------|---------|
| **DataContext.tsx** | `src/app/contexts/DataContext.tsx` | 게시글/댓글 상태 관리 | addComment, updatePost, deleteComment |
| **firestore.service.ts** | `src/lib/firebase/firestore.service.ts` | Firestore CRUD | getGameLineup, setGameLineupSlot, getGameBatterRecords, setGameBatterRecord |
| **auth.service.ts** | `src/lib/firebase/auth.service.ts` | 인증 서비스 | isAdmin, canRecordGame |

### Types & Constants

| 파일 | 경로 | 내용 |
|-----|------|------|
| **types.ts** | `src/lib/firebase/types.ts` | LineupDoc, BatterRecordDoc, PitcherRecordDoc |
| **constants/** | `src/lib/constants/` | POSITIONS 배열 등 |

---

## 🔄 권한 로직 흐름 (다이어그램)

### Permission Calculation Flow

```
GameRecordPage로 게임 진입
  ↓
user.id, game.recorders, game.recordingLocked 로드
  ↓
isAdminLike = isAdmin() ? true : false  [AuthContext.isAdmin()]
  ↓
isGameRecorder = game.recorders?.includes(user.id) ? true : false  [GameRecordPage:161]
  ↓
canRecord = isAdminLike || isGameRecorder  [GameRecordPage:162]
  ↓
isLocked = game.recordingLocked === true  [GameRecordPage:168]
  ↓
canEditRecord = isAdminLike ? true : (canRecord && !isLocked)  [GameRecordPage:169]
  ├→ Admin: 항상 true (locked 무시 override)
  ├→ Recorder (unlocked): true
  ├→ Recorder (locked): false
  └→ Member: false
  ↓
canViewRecordTab = canRecord  [GameRecordPage:173 - 기록 탭 표시]
  ↓
canEdit = canEditRecord  [LineupEditor, BatterTable, PitcherTable로 전달]
```

### 권한 결정 테이블

| 사용자 | recordingLocked | canRecord | canViewRecordTab | canEditRecord | Tab 표시 | 입력 가능 |
|--------|-----------------|-----------|-----------------|--------------|--------|----------|
| Admin | false | true | true | true | ✅ 표시 | ✅ 가능 |
| Admin | true | true | true | true | ✅ 표시 | ✅ 가능 |
| Recorder | false | true | true | true | ✅ 표시 | ✅ 가능 |
| Recorder | true | true | true | false | ✅ 표시 | ❌ 불가 |
| Member | false | false | false | false | ❌ 숨김 | ❌ 불가 |
| pending | N/A | false | false | false | ❌ 숨김 | ❌ 불가 |

**근거 코드** (GameRecordPage.tsx, 라인 140~173):
```typescript
const isAdminLike = isAdmin();
const isGameRecorder = React.useMemo(() => {
  if (!user) return false;
  return (game.recorders ?? []).includes(user.id);  // Line 161
}, [user, game.recorders]);

const canRecord = isAdminLike || isGameRecorder;  // Line 162

const isLocked = game.recordingLocked === true;
const canEditRecord = React.useMemo(() => {  // Line 169
  if (!user) return false;
  return isAdminLike ? true : (canRecord && !isLocked);
}, [user, isAdminLike, canRecord, isLocked]);

const canViewRecordTab = canRecord;  // Line 173
const canEdit = canEditRecord;  // Line 175
```

---

## 🎨 UI 구조

### 페이지 레이아웃

```
GameRecordPage
│
├── Header (Orange/Red gradient)
│   ├── Trophy icon + "경기 기록" 제목
│   └── "라인업 및 타자/투수 기록 관리" 설명
│
├── Games List (스크롤 가능)
│   └── GameCard[] (각 경기)
│       ├── 배지 (리그/연습, 마감 여부)
│       ├── 제목, 날짜, 장소, 상대팀
│       ├── 스코어
│       └── onclick → GameDetailModal
│
└── GameDetailModal (Portal로 렌더링)
    │
    ├── Header (Fixed)
    │   ├── 배지
    │   ├── 제목, 날짜, 장소, 상대팀
    │   ├── 스코어 & 기록원 정보
    │   └── Close 버튼
    │
    ├── Tabs (Border-bottom active style)
    │   ├── "요약" (항상 표시)
    │   ├── "기록 입력" (canViewRecordTab && 표시)
    │   └── "댓글" (항상 표시)
    │
    ├── Scrollable Content Area
    │   │
    │   ├── TabsContent: "요약"
    │   │   ├── 참석 / MVP / 안타 stat 카드
    │   │   └── Admin 메뉴 (기록원 지정, 기록 마감 버튼)
    │   │
    │   ├── TabsContent: "기록 입력" (canViewRecordTab)
    │   │   ├── Status Bar (마감 상태 표시)
    │   │   ├── LineupEditor
    │   │   ├── Border divider
    │   │   ├── BatterTable
    │   │   ├── Border divider
    │   │   └── PitcherTable
    │   │
    │   └── TabsContent: "댓글"
    │       ├── Scrollable: CommentList
    │       └── Input Footer (pending 아닐 때만 표시)
    │           ├── Input field "댓글을 입력하세요..."
    │           └── Send 버튼
    │
    └── Footer (Fixed, 댓글 입력)
        └── (comments 탭일 때만 표시)
```

**스크롤 컨테이너 설정** (GameRecordPage.tsx, 라인 250):
```tsx
<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
  <TabsContent value="record" className="mt-0 space-y-8 pb-10">
    {/* LineupEditor, BatterTable, PitcherTable */}
  </TabsContent>
</div>
```

---

## 💾 데이터 저장 흐름

### 라인업 저장 (LineupEditor.tsx)

```
사용자 선수 선택
  ↓ MemberPicker.onSelectionChange(ids, members)
  ↓ LineupEditor:updateSlot(index, {memberId, memberName, position})
  ↓ LineupEditor:handleSaveSlot(slot)
  ↓ setGameLineupSlot(currentClubId, gameId, slotId, {order, memberId, memberName, position})
    ├→ const slotId = `slot_${slot.order}`  [LINE 103]
    ├→ Firestore 경로: clubs/{clubId}/posts/{gameId}/record_lineup/{slotId}
    └→ updateDoc으로 저장
  ↓ savingState[order] = 'saved'
  ↓ 2초 후 상태 제거
```

**근거 코드** (LineupEditor.tsx, 라인 100~110):
```typescript
const handleSaveSlot = async (slot: LineupSlot) => {
  if (!canEdit) return;  // 권한 체크

  setSavingState(prev => ({ ...prev, [slot.order]: 'saving' }));
  try {
    const slotId = `slot_${slot.order}`;
    await setGameLineupSlot(currentClubId, gameId, slotId, {
      gameId,
      order: slot.order,
      memberId: slot.memberId,
      memberName: slot.memberName,
      position: slot.position,
      note: slot.note
    });
    // ...
  }
};
```

### 타자 기록 저장 (BatterTable.tsx)

```
사용자 타수/안타/타점 등 입력
  ↓ Input.onChange → handleUpdate(rec.id, 'ab', e.target.value)
  ↓ 로컬 state 즉시 업데이트 (긍정적 피드백)
  ↓ Input.onBlur → handleBlur(rec)
  ↓ handleSave(record)
  ↓ setGameBatterRecord(currentClubId, gameId, playerId, {...})
    ├→ Firestore 경로: clubs/{clubId}/posts/{gameId}/record_batting/{playerId}
    └→ setDoc으로 저장 (자동 생성/업데이트)
  ↓ savingId = null (로딩 완료)
```

**근거 코드** (BatterTable.tsx, 라인 85~115):
```typescript
const handleSave = async (record: BatterRecordDoc) => {
  if (!canEdit) return;  // 권한 체크

  setSavingId(record.id);
  try {
    await setGameBatterRecord(currentClubId, gameId, record.playerId, {
      gameId,
      playerId: record.playerId,
      playerName: record.playerName,
      ab: Number(record.ab),
      h: Number(record.h),
      // ...
    });
  } finally {
    setSavingId(null);
  }
};
```

### 댓글 입력 (GameRecordPage.tsx)

```
사용자 댓글 입력 후 Enter 또는 버튼 클릭
  ↓ Input.onKeyDown (e.key === 'Enter') 또는 Button.onClick
  ↓ 입력값 유효성 체크 (trim() 확인)
  ↓ DataContext.addComment(game.id, content)
    ├→ firestore.service.addComment(clubId, postId, {content, authorId, authorName, ...})
    ├→ Firestore 경로: clubs/{clubId}/posts/{postId}/comments/{commentId}
    └→ addDoc으로 자동 ID 생성
  ↓ toast.success('댓글이 등록되었습니다')
  ↓ 입력 필드 초기화
  ↓ DataContext.loadComments() 자동 호출 (onSnapshot 또는 refetch)
```

**근거 코드** (GameRecordPage.tsx, 라인 415~435):
```typescript
<Input
  placeholder="댓글을 입력하세요..."
  className="flex-1"
  onKeyDown={async (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.currentTarget.value.trim()) {
      const content = e.currentTarget.value.trim();
      e.currentTarget.value = '';  // 즉시 초기화
      try {
        await addComment(game.id, content);
        toast.success('댓글이 등록되었습니다');
      } catch (err) {
        console.error('Error adding comment:', err);
        toast.error('댓글 등록 실패');
      }
    }
  }}
/>
```

### 기록원 변경 (MemberPicker + updatePost)

```
Admin이 "기록원 지정" 버튼 클릭
  ↓ MemberPicker 모달 열림
  ↓ 멤버 선택 (1명 이상 maxSelection=5)
  ↓ MemberPicker.onSelectionChange(ids, members)
  ↓ updatePost(game.id, { recorders: ids })
    ├→ firestore.service.updatePost(clubId, postId, {recorders: ids, updatedAt})
    ├→ Firestore 경로: clubs/{clubId}/posts/{postId}
    ├→ updateDoc으로 recorders 필드만 업데이트
    └→ Firestore rules에서 protected field 체크 (admin 필수)
  ↓ toast.success('기록원이 변경되었습니다')
```

**근거 코드** (GameRecordPage.tsx, 라인 325~345):
```typescript
<MemberPicker
  label="기록원 변경"
  selectedMemberIds={game.recorders || []}
  onSelectionChange={async (ids) => {
    if (game.recordingLocked) {
      toast.error('마감된 경기는 기록원을 변경할 수 없습니다.');
      return;
    }
    try {
      await updatePost(game.id, { recorders: ids });
      toast.success('기록원이 변경되었습니다');
    } catch (error) {
      console.error('Error updating recorders:', error);
      toast.error('기록원 변경 실패');
    }
  }}
/>
```

---

## 📊 컴포넌트 계층도

```
GameRecordPage
│
├── GameCard (List)
│   └── onClick → setSelectedGameId
│
└── GameDetailModal (Portal)
    │
    ├── Header
    │   ├── Badge (게임 타입)
    │   ├── Title, Date, Place
    │   └── Score & Recorder Info
    │
    └── Tabs
        │
        ├── Summary Tab
        │   ├── Stats Cards (Attendance, MVP, Hits)
        │   └── Admin Panel
        │       ├── MemberPicker (기록원 변경)
        │       ├── Lock/Unlock Button
        │       └── recordersText 표시
        │
        ├── Record Tab (canViewRecordTab)
        │   ├── Status Bar (Locked/Open status)
        │   ├── LineupEditor
        │   │   └── Card[] (Slot 1-9)
        │   │       ├── Order number
        │   │       ├── MemberPicker (선수 선택)
        │   │       ├── Position Select
        │   │       └── Save Status
        │   │
        │   ├── BatterTable
        │   │   ├── Header (타자 기록, 선수 추가 MemberPicker)
        │   │   ├── Table
        │   │   │   ├── Header (이름, 타수, 안타, 타점, 득점, 볼넷, 삼진, 비고)
        │   │   │   └── Row[] (Input fields)
        │   │   └── Autosave on blur
        │   │
        │   └── PitcherTable
        │       ├── Header (투수 기록, 선수 추가 MemberPicker)
        │       ├── Tooltip (이닝 설명)
        │       ├── Table
        │       │   ├── Header (이름, 이닝, 투구수, 피안타, 실점, 자책, 볼넷, 삼진, 비고)
        │       │   └── Row[] (Input fields)
        │       └── Autosave on blur
        │
        └── Comments Tab
            ├── CommentList (Scrollable)
            │   └── CommentItem[]
            │       ├── Avatar
            │       ├── Author name
            │       ├── Content
            │       └── Delete button (canDelete)
            │
            └── Comment Input (pending 아닐 때)
                ├── Input field
                └── Send button
```

---

## 🔌 핵심 API 호출 경로

### Firestore Service 함수들

| 함수 | 위치 | 목적 | Firestore 경로 |
|-----|------|------|-------------|
| `getGameLineup()` | firestore.service.ts | 라인업 로드 | `clubs/{clubId}/posts/{gameId}/record_lineup` |
| `setGameLineupSlot()` | firestore.service.ts | 라인업 저장 | `clubs/{clubId}/posts/{gameId}/record_lineup/{slotId}` |
| `getGameBatterRecords()` | firestore.service.ts | 타자 기록 로드 | `clubs/{clubId}/posts/{gameId}/record_batting` |
| `setGameBatterRecord()` | firestore.service.ts | 타자 기록 저장 | `clubs/{clubId}/posts/{gameId}/record_batting/{playerId}` |
| `getGamePitcherRecords()` | firestore.service.ts | 투수 기록 로드 | `clubs/{clubId}/posts/{gameId}/record_pitching` |
| `setGamePitcherRecord()` | firestore.service.ts | 투수 기록 저장 | `clubs/{clubId}/posts/{gameId}/record_pitching/{playerId}` |
| `addComment()` | firestore.service.ts | 댓글 추가 | `clubs/{clubId}/posts/{postId}/comments` |
| `updatePost()` | firestore.service.ts | 게시글 업데이트 | `clubs/{clubId}/posts/{postId}` |

---

## ⚠️ 현재 문제점

### Issue A: 댓글 입력란 존재 여부
**위치**: GameRecordPage.tsx, Comments 탭 (라인 415)  
**상태**: ✅ 입력란 코드 있음 (근거: 라인 415~435)  
**문제**: 런타임에 보이지 않을 수 있음

### Issue B: 기록원 변경 후 선택 인원 표시
**위치**: MemberPicker.tsx, 상단 레이블 (라인 60)  
**상태**: ⚠️ 렌더링 로직 확인 필요
**문제**: selectedMemberIds.length가 0으로 표시될 수 있음

### Issue C: 타자/포지션 입력 카드 스크롤
**위치**: BatterTable.tsx, 테이블 overflow (라인 155)  
**상태**: ⚠️ overflow-x-auto 있으나 데스크톱에서만 작동
**문제**: 모바일에서 2명만 입력 가능

---

## ✅ WF-07 코드맵 체크리스트

- [x] 관련 파일 7개 목록화
- [x] 권한 로직 흐름 다이어그램
- [x] 권한 결정 테이블 (6가지 케이스)
- [x] UI 레이아웃 다이어그램
- [x] 데이터 저장 흐름 (라인업, 타자, 댓글, 기록원)
- [x] 컴포넌트 계층도
- [x] API 호출 경로 테이블
- [x] 3개 이슈 위치 명시

---

## 📌 다음 단계

1. 08번 보고서에서 3개 이슈 재현 → 원인 분석
2. 09번에서 원자 단위 패치 계획 제시
3. 각 패치 검증 및 배포
