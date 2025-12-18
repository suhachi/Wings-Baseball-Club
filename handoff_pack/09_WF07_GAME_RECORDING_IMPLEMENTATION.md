# handoff_pack/09_WF07_GAME_RECORDING_IMPLEMENTATION.md

## 목적/범위
WF-07 경기 기록 시스템의 구현 상세: 화면/탭 게이트, recorders 지정/LOCK, record_* 저장 방식, LOCK 이후 readonly 처리.

---

## 화면/탭 게이트 로직

### 진입 조건

**파일**: `src/app/pages/GameRecordPage.tsx` Line 155-160

```typescript
const canViewRecordTab = React.useMemo(() => {
  if (!user) return false;
  return isAdmin() || (game.recorders && game.recorders.includes(user.id));
}, [user, game, isAdmin]);
```

**조건**:
- `isAdmin()` === true OR
- `user.id in post.recorders`

**적용 위치**: GameDetailModal 내부 "라인업", "타자 기록", "투수 기록" 탭 표시 여부

---

## Recorders 지정/LOCK 호출 위치

### 1. Recorders 지정

**파일**: `src/app/pages/SchedulePage.tsx` Line 448-505

**위치**: EventDetailModal 내부 (관리자만 표시)

**UI**: 
- "기록원 관리" 섹션
- MemberPicker 컴포넌트 사용
- "편집" 버튼 클릭 → MemberPicker 모달 오픈

**호출**:
```typescript
const handleSaveRecorders = async () => {
  await updatePost(event.id, {
    recorders: recorderIds,
    recordersSnapshot: snapshotData // 멤버 정보 스냅샷 저장
  });
};
```

**Firestore 경로**: `clubs/{clubId}/posts/{postId}` 문서 업데이트

---

### 2. LOCK 호출

**파일**: `src/app/pages/GameRecordPage.tsx` Line 173-193

**위치**: GameDetailModal 내부 "요약" 탭

**권한**: `canLock` === true (관리자만)

```typescript
const canLock = React.useMemo(() => {
  if (!user) return false;
  return isAdmin(); // Only Admin can lock
}, [user, isAdmin]);
```

**호출**:
```typescript
const handleToggleLock = async () => {
  await updatePost(game.id, {
    recordingLocked: !game.recordingLocked,
    recordingLockedAt: !game.recordingLocked ? new Date() : undefined,
    recordingLockedBy: !game.recordingLocked ? user?.id : undefined
  });
};
```

**Firestore 경로**: `clubs/{clubId}/posts/{postId}` 문서 업데이트

---

## Record_* 저장 방식

### 1. 라인업 (record_lineup)

**파일**: `src/app/components/game-record/LineupEditor.tsx`

**저장 함수**: `handleSaveSlot()` Line 77-93

```typescript
const handleSaveSlot = async (slot: LineupSlot) => {
  const slotId = `slot_${slot.order}`;
  await setGameLineupSlot(currentClubId, gameId, slotId, {
    gameId,
    order: slot.order,
    memberId: slot.memberId,
    memberName: slot.memberName,
    position: slot.position,
    note: slot.note
  });
};
```

**Firestore 경로**: `clubs/{clubId}/posts/{gameId}/record_lineup/{slotId}`

**저장 방식**: 
- **Upsert** (`setDoc` with `merge: true`)
- **Autosave**: 사용자 입력 시 즉시 저장 (debounce 없음, Row 단위 저장)
- **docId 규칙**: `slot_1`, `slot_2`, ..., `slot_9` (고정)

**서비스 함수**: `src/lib/firebase/firestore.service.ts` Line 481-497

---

### 2. 타자 기록 (record_batting)

**파일**: `src/app/components/game-record/BatterTable.tsx`

**저장 함수**: `handleSave()` Line 82-100

```typescript
const handleSave = async (record: BatterRecordDoc) => {
  await setGameBatterRecord(currentClubId, gameId, record.playerId, {
    gameId,
    playerId: record.playerId,
    playerName: record.playerName,
    ab: record.ab,
    h: record.h,
    rbi: record.rbi,
    r: record.r,
    bb: record.bb,
    so: record.so,
    note: record.note
  });
};
```

**Firestore 경로**: `clubs/{clubId}/posts/{gameId}/record_batting/{playerId}`

**저장 방식**:
- **Upsert** (`setDoc` with `merge: true`)
- **Autosave**: 입력 필드 변경 시 즉시 저장 (Row 단위)
- **docId 규칙**: `playerId` (멤버 UID)

**서비스 함수**: `src/lib/firebase/firestore.service.ts` Line 516-530

---

### 3. 투수 기록 (record_pitching)

**파일**: `src/app/components/game-record/PitcherTable.tsx`

**저장 방식**: 타자 기록과 동일 (Upsert, Autosave, Row 단위)

**Firestore 경로**: `clubs/{clubId}/posts/{gameId}/record_pitching/{playerId}`

---

### 타임스탬프 및 업데이트자

**필드**:
- `updatedAt`: `serverTimestamp()` (자동)
- `updatedBy`: 저장 함수에서 전달하지 않음 (현재 누락)

**문제**: `updatedBy` 필드가 저장되지 않음. 필요 시 추가 필요.

---

## LOCK 이후 Readonly 처리

### Policy A: 관리자 Override 가능

**Firestore Rules**: `firestore.rules` Line 82-89

```javascript
function canRecordAdminOverride() {
   let post = get(...).data;
   let isRecorder = request.auth.uid in (post.recorders != null ? post.recorders : []);
   let isLocked = post.recordingLocked == true;
   
   return isAdmin() || (isRecorder && !isLocked); 
}
```

**규칙**:
- 관리자: LOCK 후에도 쓰기 가능
- 기록원: `!recordingLocked`일 때만 쓰기 가능

---

### 클라이언트 권한 체크

**파일**: `src/app/pages/GameRecordPage.tsx` Line 147-153

```typescript
const canEdit = React.useMemo(() => {
  if (!user) return false;
  if (isAdmin()) return true; // Admin can edit even if locked
  if (game.recorders && game.recorders.includes(user.id)) {
    return !game.recordingLocked; // Recorders can only edit if !locked
  }
  return false;
}, [user, game, isAdmin]);
```

**적용 위치**: 
- `LineupEditor`, `BatterTable`, `PitcherTable`에 `canEdit` prop 전달
- `canEdit === false`일 때 입력 필드 비활성화

---

### UI 표시

**파일**: `src/app/pages/GameRecordPage.tsx` Line 195-220

**LOCK 상태 배너**:
```typescript
<div className={`p-4 rounded-xl border ${game.recordingLocked
  ? 'bg-gray-100 border-gray-200 text-gray-700'
  : 'bg-green-50 border-green-200 text-green-700'
  }`}>
  {game.recordingLocked ? <Lock /> : <Edit />}
  <p>{game.recordingLocked ? '기록 마감됨' : '기록 입력 중'}</p>
  <p>{game.recordingLocked
    ? '관리자만 잠금을 해제할 수 있습니다.'
    : '기록원 및 관리자가 수정할 수 있습니다.'}</p>
</div>
```

---

## Batched Write 여부

**현재 상태**: ❌ Batched Write 미사용

**저장 방식**: 
- 각 Row/Field 변경 시 즉시 개별 `setDoc` 호출
- 트랜잭션 없음

**장점**: 실시간 저장, 사용자 경험 좋음  
**단점**: 쓰기 횟수 증가 (비용)

---

## TODO/누락

1. **updatedBy 필드 저장**: 현재 누락, 필요 시 추가
2. **Batched Write 고려**: 다중 Row 동시 저장 시 트랜잭션 사용 고려
3. **LOCK 해제 권한**: 현재 관리자만 가능, 필요 시 규칙 변경

---

## 관련 코드 원문

- `src/app/pages/GameRecordPage.tsx` → `handoff_pack/_raw/GameRecordPage.tsx.md`
- `src/app/components/game-record/LineupEditor.tsx` → `handoff_pack/_raw/LineupEditor.tsx.md`
- `src/app/components/game-record/BatterTable.tsx` → `handoff_pack/_raw/BatterTable.tsx.md`
- `src/lib/firebase/firestore.service.ts` (game records 부분) → `handoff_pack/_raw/firestore_game_records.md`

