# 📋 프롬프트 요구사항 vs 현재 코드 대조 분석

**분석 기준**: 사용자 제공 프롬프트  
**대조일**: 2024년

---

## 프롬프트 요구사항 정리

### 목표
1. ✅ 경기 기록원(recorders)이 "경기 단위 임시 권한"으로 정상 동작
2. ❌ 기록원 선택/타자 선택에서 발생하는 undefined[0] 런타임 에러 제거
3. ✅ 라인업/타자 입력 카드가 9명 이상도 스크롤/이동 가능
4. ⚠️ 경기 댓글 탭에 댓글 입력란 복구 (부분)

### 핵심 규칙
```
canRecord = isAdminLike(user.role) || post.recorders.includes(user.uid)
canEditRecord = canRecord && post.recordingLocked !== true (LOCK이면 관리자만)
선택 컴포넌트는 항상 배열 기반, 기본값 [], 절대 [0] 직접 접근 금지(guard 필수)
```

---

## A. Fix "can record" authorization (A안)

### 프롬프트 요구사항
```typescript
const isAdminLike = isAdmin() (existing helper)
const isGameRecorder = (game.recorders ?? []).includes(user.uid)
const canRecord = isAdminLike || isGameRecorder
const isLocked = game.recordingLocked === true
const canEditRecord = isAdminLike ? true : (canRecord && !isLocked)
```

**사용처:**
- show/hide "기록 입력" 탭 → `canRecord`
- disable inputs when readonly → `canEditRecord`
- block save/update calls when unauthorized → `canEditRecord`

### 현재 코드 (`GameRecordPage.tsx:106-121`)

```typescript
const canEdit = React.useMemo(() => {
  if (!user) return false;
  if (isAdmin()) return true;  // ✅ 관리자는 항상 수정 가능
  const isGameRecorder = game.recorders?.includes(user.id);  // ⚠️ ?? [] 없음
  if (isGameRecorder) return !game.recordingLocked;  // ⚠️ 로직은 비슷하나 변수 분리 안 됨
  return false;
}, [user, game, isAdmin]);

const canViewRecordTab = React.useMemo(() => {
  if (!user) return false;
  if (isAdmin()) return true;
  return game.recorders?.includes(user.id) || false;  // ⚠️ canRecord 로직과 중복
}, [user, game, isAdmin]);
```

### 대조 결과: ❌ **불일치**

| 요구사항 | 현재 코드 | 일치 여부 |
|---------|----------|----------|
| `isAdminLike` 변수 명시적 선언 | `isAdmin()` 직접 호출 | ❌ |
| `isGameRecorder` 변수 명시적 선언 | `isGameRecorder` 지역 변수 | ⚠️ (로직은 유사) |
| `canRecord` 변수 분리 | `canViewRecordTab`에 로직만 있음 | ❌ |
| `canEditRecord` 변수 분리 | `canEdit` 하나만 존재 | ❌ |
| `game.recorders ?? []` null 체크 | `game.recorders?.includes()` 사용 | ⚠️ (기능은 동일하나 명시적 배열 기본값 없음) |

### 차이점

1. **변수 분리 부족**
   - 요구: `canRecord`와 `canEditRecord` 명확히 분리
   - 현재: `canEdit`와 `canViewRecordTab` 두 개지만 로직이 분리되지 않음

2. **명시적 변수 선언 부족**
   - 요구: `isAdminLike`, `isGameRecorder` 명시적 선언
   - 현재: `isAdmin()` 직접 호출, `isGameRecorder`는 지역 변수로만 존재

3. **로직 정확성**
   - `canEdit` 로직은 요구사항과 **기능적으로는 동일**하나 구조가 다름

---

## B. Fix Recorder Picker selection bug + runtime error

### 프롬프트 요구사항

1. **배열 기본값 보장**
   ```typescript
   const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds ?? [])
   ```

2. **toggle 함수**
   ```typescript
   const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
   ```

3. **절대 [0] 직접 접근 금지**
   - Never read `selectedIds[0]` without guard.

4. **onSelectionChange 시그니처**
   - If parent expects `string[]`, pass `selectedIds` only.
   - If parent expects `Member[]`, map by ids and pass array (never undefined).

5. **기록원 변경 완료 처리**
   ```typescript
   // In GameRecordPage, when "완료" pressed:
   call update function (firestore update or callable)
   await success
   then close modal and refresh game doc (or rely on onSnapshot)
   only then toast "기록원이 변경되었습니다"
   on failure: toast error and keep modal open.
   ```

### 현재 코드

#### 1. MemberPicker (`MemberPicker.tsx:19-44`)

```typescript
selectedMemberIds = [],  // ✅ 기본값 []
onSelectionChange: (ids: string[], members: Member[]) => void;  // ✅ 시그니처 일치

const toggleSelection = (memberId: string) => {
  if (selectedMemberIds.includes(memberId)) {
    emitChange(selectedMemberIds.filter((id) => id !== memberId));  // ✅ 올바른 toggle
  } else {
    if (selectedMemberIds.length >= maxSelection) {
      return;
    }
    emitChange([...selectedMemberIds, memberId]);  // ✅ 올바른 toggle
  }
};
```

- ✅ 배열 기본값 보장
- ✅ [0] 직접 접근 없음
- ✅ toggle 로직 올바름

#### 2. GameRecordPage 기록원 변경 (`GameRecordPage.tsx:258-276`)

```typescript
<MemberPicker
  selectedMemberIds={game.recorders || []}  // ✅ 기본값 보장
  onSelectionChange={async (ids) => {
    if (game.recordingLocked) {
      toast.error('마감된 경기는 기록원을 변경할 수 없습니다.');
      return;
    }
    await updatePost(game.id, { recorders: ids });  // ❌ 에러 처리 없음
    toast.success('기록원이 변경되었습니다');  // ⚠️ 성공 시에만 toast
  }}
  ...
/>
```

### 대조 결과: ⚠️ **부분 일치**

| 요구사항 | 현재 코드 | 일치 여부 |
|---------|----------|----------|
| 배열 기본값 `[]` | `game.recorders || []` | ✅ |
| toggle 로직 | `toggleSelection` 올바름 | ✅ |
| [0] 직접 접근 금지 | MemberPicker 내부에서 없음 | ✅ |
| onSelectionChange 시그니처 | `(ids, members)` 일치 | ✅ |
| **에러 처리 (try-catch)** | **없음** | ❌ |
| **실패 시 toast + 모달 유지** | **없음** | ❌ |
| **성공 후 refresh** | **없음 (onSnapshot 의존)** | ⚠️ |

---

## C. Fix Batter/Position cards stuck (scroll/overflow)

### 프롬프트 요구사항

1. **스크롤 가능한 컨테이너**
   ```typescript
   Add a container around tab content: 
   style={{ maxHeight: 'calc(100vh - XXXpx)', overflowY: 'auto' }}
   ```

2. **리스트 컨테이너 스크롤**
   - remove/avoid overflow-hidden on the list parent
   - guarantee rendering of 9 slots with vertical scroll

### 현재 코드 (`GameRecordPage.tsx:231`)

```typescript
<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
  <TabsContent value="record" className="mt-0 space-y-8 pb-10">
    <LineupEditor ... />
    <BatterTable ... />
    <PitcherTable ... />
  </TabsContent>
</div>
```

- ✅ `overflow-y-auto` 적용
- ✅ `flex-1`로 남은 공간 채움
- ✅ `space-y-8 pb-10` 여백 확보

### LineupEditor (`LineupEditor.tsx:134`)

```typescript
<div className="space-y-2">
  {lineup.map((slot, index) => (
    <Card key={slot.order} className="p-3 ...">
      ...
    </Card>
  ))}
</div>
```

- ✅ 부모 스크롤에 의존 (overflow-hidden 없음)
- ✅ 9개 슬롯 모두 렌더링

### 대조 결과: ✅ **일치**

| 요구사항 | 현재 코드 | 일치 여부 |
|---------|----------|----------|
| 스크롤 가능한 컨테이너 | `overflow-y-auto` 적용 | ✅ |
| overflow-hidden 제거 | 리스트 부모에 없음 | ✅ |
| 9개 슬롯 렌더링 | `lineup.map()` 사용 | ✅ |

---

## D. Restore Game Comments composer

### 프롬프트 요구사항

1. **댓글 입력란 렌더링**
   ```typescript
   <CommentComposer postId={game.id} /> (or existing input component)
   <CommentList postId={game.id} />
   ```

2. **잘못된 props 제거**
   - Remove wrong props usage (e.g., do not pass `comments={[]}` if component doesn't accept it)

3. **권한 체크**
   - Verify pending/role gating does not hide composer for active members
   - (only block if user not logged in)

### 현재 코드 (`GameRecordPage.tsx:349-391`)

```typescript
<TabsContent value="comments" className="mt-0 flex flex-col h-full">
  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
    <CommentList postId={game.id} />  // ✅ 올바른 props
  </div>
  {/* Comment Input */}
  <div className="p-3 bg-white dark:bg-gray-900 border-t flex gap-2 shrink-0">
    <Input
      placeholder="댓글을 입력하세요..."
      onKeyDown={async (e) => {
        // ⚠️ firestore.service.addComment 직접 호출
        const { addComment } = await import('../../lib/firebase/firestore.service');
        ...
        await addComment(currentClubId, game.id, { ... });
        ...
      }}
    />
  </div>
</TabsContent>
```

### 대조 결과: ⚠️ **부분 일치**

| 요구사항 | 현재 코드 | 일치 여부 |
|---------|----------|----------|
| CommentList 렌더링 | ✅ `postId`만 전달 | ✅ |
| 댓글 입력란 렌더링 | ✅ 인라인 Input 컴포넌트 | ✅ |
| CommentComposer 사용 | ❌ 직접 import 사용 | ⚠️ (요구는 컴포넌트 사용) |
| 잘못된 props 제거 | ✅ `comments={[]}` 없음 | ✅ |
| **Pending 사용자 체크** | ❌ **없음** | ❌ |
| **DataContext 사용** | ❌ **직접 import** | ⚠️ |

---

## E. Fix undefined[0] runtime error

### 프롬프트 요구사항

1. **Guard 필수**
   ```typescript
   Add console-safe guards around any array[0] usage found in WF-07 components.
   ```

2. **기본값 보장**
   - 선택 컴포넌트는 항상 배열 기반, 기본값 []

### 현재 코드 검수

#### 1. LineupEditor (`LineupEditor.tsx:164-172`)

```typescript
onSelectionChange={(ids, members) => {
  if (members && members.length > 0 && members[0]) {  // ✅ Guard 있음
    updateSlot(index, {
      memberId: members[0].id,
      memberName: members[0].realName,
      position: members[0].position || ''
    });
  }
}}
```

- ✅ Guard 있음

#### 2. BatterTable (`BatterTable.tsx:66-70`)

```typescript
const handleCreate = async (ids: string[], members: any[]) => {
  if (members && members.length > 0 && members[0]) {  // ✅ Guard 있음
    addPlayer(members[0]);
  }
};
```

- ✅ Guard 있음

#### 3. PitcherTable (`PitcherTable.tsx:69-73`)

```typescript
const handleCreate = async (ids: string[], members: any[]) => {
  if (members[0]) {  // ❌ Guard 불완전
    addPlayer(members[0]);
  }
};
```

- ❌ Guard 불완전 (`members` null 체크 없음)

### 대조 결과: ⚠️ **부분 일치**

| 컴포넌트 | Guard 상태 | 일치 여부 |
|---------|----------|----------|
| LineupEditor | ✅ 완전한 guard | ✅ |
| BatterTable | ✅ 완전한 guard | ✅ |
| PitcherTable | ❌ 불완전한 guard | ❌ |

---

## 종합 대조 결과

### 요구사항별 일치도

| 항목 | 요구사항 | 현재 상태 | 일치도 |
|------|---------|----------|--------|
| **A. 권한 체크 (canRecord)** | 변수 분리 + 명시적 선언 | 로직만 존재, 변수 미분리 | **40%** |
| **B. 기록원 선택 에러 처리** | try-catch + toast + 모달 유지 | 에러 처리 없음 | **60%** (MemberPicker는 OK) |
| **C. 스크롤 지원** | overflow-y-auto, 9개 슬롯 | ✅ 완전 구현 | **100%** |
| **D. 댓글 입력란** | CommentComposer 또는 기존 컴포넌트 | 인라인 구현 (직접 import) | **70%** (기능은 동작) |
| **E. undefined[0] guard** | 모든 배열 접근 guard | PitcherTable 1개 누락 | **80%** |

### 전체 일치도: **70%**

---

## 결론

**프롬프트 요구사항을 기준으로 분석한 결과, 현재 코드는:**

1. ✅ **기능적으로는 대부분 동작** (스크롤, 댓글 입력란, MemberPicker 기본 동작)
2. ⚠️ **구조적으로는 불일치** (권한 체크 변수 분리, 에러 처리)
3. ❌ **버그 존재** (PitcherTable guard 불완전)

**즉시 수정 필요한 사항:**
- PitcherTable.tsx:70 - Guard 보강
- GameRecordPage.tsx:261-268 - 에러 처리 추가
- GameRecordPage.tsx:106-121 - 권한 체크 변수 분리 (프롬프트 A안 요구사항)

---

**대조 분석 완료**

