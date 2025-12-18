# 🔬 WF-07 경기 기록 시스템 코드 검수 보고서

**검수일**: 2024년  
**검수 범위**: 프롬프트 요구사항 대비 구현 상태  
**검수 수준**: 초정밀 (원자 단위)

---

## 📊 실행 요약

### 전체 평가: ⚠️ **부분 준수** (60/100)

프롬프트의 핵심 요구사항 중 **일부만 구현**되었으며, **중요한 버그와 불일치**가 발견되었습니다.

### 주요 발견 사항

| 항목 | 요구사항 | 현재 상태 | 평가 |
|------|---------|----------|------|
| A. 권한 체크 분리 | `canRecord` / `canEditRecord` 명확히 분리 | ❌ 분리 안 됨 | **실패** |
| B. 기록원 선택 에러 처리 | try-catch + toast | ❌ 에러 처리 없음 | **실패** |
| C. 스크롤 지원 | 9명 이상 스크롤 가능 | ✅ 구현됨 | **성공** |
| D. 댓글 입력란 | 댓글 입력란 복구 | ⚠️ 부분 구현 (잘못된 방식) | **부분** |
| E. undefined[0] guard | 모든 배열 접근에 guard | ⚠️ 일부 누락 | **부분** |

---

## 🔍 상세 검수 결과

### A. 권한 체크 (canRecord) - ❌ **실패**

#### 요구사항
```typescript
const isAdminLike = isAdmin()
const isGameRecorder = (game.recorders ?? []).includes(user.uid)
const canRecord = isAdminLike || isGameRecorder
const isLocked = game.recordingLocked === true
const canEditRecord = isAdminLike ? true : (canRecord && !isLocked)
```

#### 현재 구현 (`GameRecordPage.tsx:106-115`)
```typescript
const canEdit = React.useMemo(() => {
  if (!user) return false;
  if (isAdmin()) return true; // ✅ 관리자는 항상 수정 가능

  const isGameRecorder = game.recorders?.includes(user.id); // ✅ 기록원 체크
  if (isGameRecorder) return !game.recordingLocked; // ✅ LOCK 체크

  return false;
}, [user, game, isAdmin]);
```

#### 문제점

1. **`canRecord`와 `canEditRecord` 분리 안 됨**
   - 요구사항: `canRecord` (기록 탭 표시용)와 `canEditRecord` (수정 권한용) 분리
   - 현재: `canEdit` 하나만 존재
   - 영향: 기록 탭 표시 로직과 수정 권한이 혼재됨

2. **`canViewRecordTab` 로직 중복**
   - Line 117-121: `canViewRecordTab` 계산에 `canRecord` 로직 중복
   - 권장: `canRecord` 변수 생성 후 재사용

3. **`game.recorders` null 체크 부족**
   - `game.recorders?.includes()` 사용 (✅ 좋음)
   - 하지만 `canViewRecordTab`에서는 `|| false` 추가 필요

#### 수정 필요 사항

```typescript
// 수정 전
const canEdit = React.useMemo(() => { ... });
const canViewRecordTab = React.useMemo(() => { ... });

// 수정 후 (요구사항 반영)
const isAdminLike = isAdmin();
const isGameRecorder = (game.recorders ?? []).includes(user?.id || '');
const canRecord = isAdminLike || isGameRecorder;
const isLocked = game.recordingLocked === true;
const canEditRecord = isAdminLike ? true : (canRecord && !isLocked);

// canViewRecordTab은 canRecord와 동일
const canViewRecordTab = canRecord;
```

---

### B. 기록원 선택 버그 + 런타임 에러 - ❌ **실패**

#### 요구사항
- `selectedIds` 항상 배열, 기본값 `[]`
- `[0]` 직접 접근 금지 (guard 필수)
- 기록원 변경 시 try-catch + toast 에러 처리
- 성공 시에만 모달 닫기

#### 현재 구현

##### 1. MemberPicker (`MemberPicker.tsx`)
- ✅ `selectedMemberIds = []` 기본값 있음 (Line 20)
- ✅ 내부에서 `[0]` 직접 접근 없음
- ✅ `onSelectionChange(ids, members)` 시그니처 일치

##### 2. GameRecordPage 기록원 변경 (`GameRecordPage.tsx:258-276`)
```typescript
<MemberPicker
  selectedMemberIds={game.recorders || []} // ✅ 기본값 처리
  onSelectionChange={async (ids) => {
    if (game.recordingLocked) {
      toast.error('마감된 경기는 기록원을 변경할 수 없습니다.');
      return;
    }
    await updatePost(game.id, { recorders: ids }); // ❌ 에러 처리 없음
    toast.success('기록원이 변경되었습니다');
  }}
  ...
/>
```

#### 문제점

1. **에러 처리 없음**
   - `updatePost` 실패 시 예외가 상위로 전파됨
   - 모달이 닫히지 않지만 사용자에게 에러 피드백 없음
   - 요구사항: `try-catch` + `toast.error` + 모달 유지

2. **성공 후 모달 닫기 로직 없음**
   - 요구사항: 성공 후 모달 닫기 (또는 refresh)
   - 현재: MemberPicker 내부에서 모달 닫기 (`setIsOpen(false)`)
   - 영향: 기록원 변경 성공 여부와 무관하게 모달이 닫힘

3. **`members` 파라미터 미사용**
   - `onSelectionChange`가 `(ids, members)` 시그니처지만 `ids`만 사용
   - 문제 없으나 일관성 부족

#### 수정 필요 사항

```typescript
// 수정 후
<MemberPicker
  selectedMemberIds={game.recorders || []}
  onSelectionChange={async (ids) => {
    if (game.recordingLocked) {
      toast.error('마감된 경기는 기록원을 변경할 수 없습니다.');
      return;
    }
    try {
      await updatePost(game.id, { recorders: ids });
      toast.success('기록원이 변경되었습니다');
      // 성공 후 refresh 또는 모달 닫기 (선택적)
    } catch (error) {
      console.error('Error updating recorders:', error);
      toast.error('기록원 변경 실패');
      // 모달은 유지 (MemberPicker 내부에서 처리)
    }
  }}
  ...
/>
```

---

### C. 스크롤 문제 - ✅ **성공**

#### 요구사항
- 9명 이상 라인업/타자 입력 카드 스크롤 가능
- 모달 내부에서 스크롤 작동

#### 현재 구현

##### 1. GameRecordPage 모달 (`GameRecordPage.tsx:231`)
```typescript
<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
  <TabsContent value="summary" className="mt-0 space-y-6">
    ...
  </TabsContent>
  {canViewRecordTab && (
    <TabsContent value="record" className="mt-0 space-y-8 pb-10">
      <LineupEditor ... />
      <BatterTable ... />
      <PitcherTable ... />
    </TabsContent>
  )}
</div>
```

- ✅ `overflow-y-auto` 적용 (Line 231)
- ✅ `flex-1`로 남은 공간 채움
- ✅ `space-y-8 pb-10`로 여백 확보

##### 2. LineupEditor (`LineupEditor.tsx:134`)
```typescript
<div className="space-y-2">
  {lineup.map((slot, index) => (
    <Card key={slot.order} className="p-3 ...">
      ...
    </Card>
  ))}
</div>
```

- ✅ 부모 스크롤에 의존 (모달 레벨에서 스크롤)
- ✅ 9개 슬롯 모두 렌더링됨

##### 3. BatterTable (`BatterTable.tsx:128`)
```typescript
<div className="overflow-x-auto border rounded-lg">
  <table className="w-full text-sm text-center min-w-[600px]">
    ...
  </table>
</div>
```

- ✅ 가로 스크롤 지원 (테이블이 넓을 경우)
- ✅ 부모 스크롤에 의존 (세로 스크롤)

#### 평가: ✅ **요구사항 충족**

모달 내부에서 스크롤이 정상 작동하며, 9명 이상의 데이터도 스크롤하여 확인 가능합니다.

---

### D. 댓글 입력란 복구 - ⚠️ **부분 구현**

#### 요구사항
- 댓글 탭에 댓글 입력란 표시
- `<CommentComposer postId={game.id} />` 또는 기존 입력 컴포넌트 사용
- Pending 사용자 제외, Active 멤버는 입력 가능

#### 현재 구현 (`GameRecordPage.tsx:349-391`)

```typescript
<TabsContent value="comments" className="mt-0 flex flex-col h-full">
  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
    <CommentList postId={game.id} />
  </div>
  {/* Comment Input */}
  <div className="p-3 bg-white dark:bg-gray-900 border-t flex gap-2 shrink-0">
    <Input
      placeholder="댓글을 입력하세요..."
      className="flex-1"
      onKeyDown={async (e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.currentTarget.value.trim()) {
          try {
            const { addComment } = await import('../../lib/firebase/firestore.service');
            if (!user) {
              toast.error('로그인이 필요합니다');
              return;
            }
            await addComment(currentClubId, game.id, {
              content: e.currentTarget.value,
              authorId: user.id,
              authorName: user.realName || user.nickname || 'Unknown',
              authorPhotoURL: user.photoURL || undefined,
            });
            e.currentTarget.value = '';
            toast.success('댓글이 등록되었습니다');
          } catch (err) {
            console.error(err);
            toast.error('댓글 등록 실패');
          }
        }
      }}
    />
    <Button size="icon" onClick={() => { ... }}>
      <ClipboardList className="w-4 h-4" />
    </Button>
  </div>
</TabsContent>
```

#### 문제점

1. **직접 import 방식 사용**
   - `firestore.service.addComment` 직접 호출
   - 요구사항: `CommentComposer` 또는 DataContext의 `addComment` 사용
   - 영향: 데이터 일관성 문제 (댓글 리스트 자동 갱신 안 됨)

2. **댓글 리스트 갱신 없음**
   - `addComment` 성공 후 `CommentList` 갱신 안 됨
   - `DataContext.addComment`는 내부에서 `loadComments` 호출하지만, 직접 import 방식은 호출 안 됨

3. **Pending 사용자 체크 없음**
   - 요구사항: Pending 사용자는 입력 불가
   - 현재: `user` 체크만 있음

4. **CommentForm 컴포넌트 미사용**
   - `CommentForm.tsx` 컴포넌트가 존재하나 사용하지 않음
   - 중복 코드 발생

#### 수정 필요 사항

```typescript
// 옵션 1: DataContext.addComment 사용 (권장)
<TabsContent value="comments" className="mt-0 flex flex-col h-full">
  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
    <CommentList postId={game.id} />
  </div>
  {user && user.status !== 'pending' && (
    <CommentForm postId={game.id} />
  )}
</TabsContent>

// 옵션 2: 인라인 구현 (현재 방식 개선)
const { addComment } = useData(); // DataContext에서 가져오기
const handleCommentSubmit = async (content: string) => {
  if (!user || user.status === 'pending') {
    toast.error('댓글 작성 권한이 없습니다');
    return;
  }
  try {
    await addComment(game.id, content);
    toast.success('댓글이 등록되었습니다');
  } catch (err) {
    console.error(err);
    toast.error('댓글 등록 실패');
  }
};
```

---

### E. undefined[0] 런타임 에러 방지 - ⚠️ **부분 구현**

#### 요구사항
- 모든 배열 접근 시 guard 필수
- `selectedIds[0]` 직접 접근 금지
- 기본값 `[]` 보장

#### 현재 구현 검수

##### 1. LineupEditor (`LineupEditor.tsx:164-172`)
```typescript
onSelectionChange={(ids, members) => {
  if (members && members.length > 0 && members[0]) { // ✅ Guard 있음
    updateSlot(index, {
      memberId: members[0].id,
      memberName: members[0].realName,
      position: members[0].position || ''
    });
  }
}}
```

- ✅ **Guard 있음**: `members && members.length > 0 && members[0]`
- 평가: **요구사항 충족**

##### 2. BatterTable (`BatterTable.tsx:66-70`)
```typescript
const handleCreate = async (ids: string[], members: any[]) => {
  if (members && members.length > 0 && members[0]) { // ✅ Guard 있음
    addPlayer(members[0]);
  }
};
```

- ✅ **Guard 있음**: `members && members.length > 0 && members[0]`
- 평가: **요구사항 충족**

##### 3. PitcherTable (`PitcherTable.tsx:69-73`)
```typescript
const handleCreate = async (ids: string[], members: any[]) => {
  if (members[0]) { // ❌ Guard 불완전
    addPlayer(members[0]);
  }
};
```

- ❌ **Guard 불완전**: `members[0]`만 체크, `members`와 `members.length` 체크 없음
- 문제: `members`가 `undefined`이면 `Cannot read properties of undefined (reading '0')` 에러
- 평가: **요구사항 미충족**

##### 4. MemberPicker (`MemberPicker.tsx`)
- ✅ `selectedMemberIds = []` 기본값 보장 (Line 20)
- ✅ 내부에서 `[0]` 직접 접근 없음
- ✅ `selectedMemberIds.map()` 안전하게 사용
- 평가: **요구사항 충족**

#### 수정 필요 사항

```typescript
// PitcherTable.tsx 수정
const handleCreate = async (ids: string[], members: any[]) => {
  if (members && members.length > 0 && members[0]) { // ✅ Guard 추가
    addPlayer(members[0]);
  }
};
```

---

## 📋 종합 평가

### 구현 완성도

| 항목 | 요구사항 | 구현 상태 | 점수 |
|------|---------|----------|------|
| A. 권한 체크 분리 | `canRecord` / `canEditRecord` 명확히 분리 | ❌ 미구현 | 0/20 |
| B. 기록원 선택 에러 처리 | try-catch + toast | ❌ 미구현 | 0/20 |
| C. 스크롤 지원 | 9명 이상 스크롤 가능 | ✅ 완료 | 20/20 |
| D. 댓글 입력란 | 댓글 입력란 복구 | ⚠️ 부분 | 10/20 |
| E. undefined[0] guard | 모든 배열 접근 guard | ⚠️ 부분 (1개 누락) | 15/20 |
| **합계** | | | **45/100** |

### 발견된 버그

1. **PitcherTable.tsx:70** - `members[0]` 접근 시 guard 불완전 (런타임 에러 가능)
2. **GameRecordPage.tsx:261-268** - 기록원 변경 시 에러 처리 없음
3. **GameRecordPage.tsx:354-390** - 댓글 입력 시 직접 import 사용 (데이터 일관성 문제)

### 개선 필요 사항

1. **권한 체크 로직 정리**
   - `canRecord`와 `canEditRecord` 명확히 분리
   - `isAdminLike`, `isGameRecorder` 변수로 가독성 향상

2. **에러 처리 강화**
   - 기록원 변경 시 try-catch 추가
   - 댓글 입력 시 DataContext 사용

3. **코드 일관성**
   - CommentForm 컴포넌트 재사용
   - Pending 사용자 체크 추가

---

## 🔧 수정 우선순위

### 🔴 P0 (즉시 수정)

1. **PitcherTable.tsx:70** - Guard 추가
   ```typescript
   // 수정 전
   if (members[0]) { ... }
   
   // 수정 후
   if (members && members.length > 0 && members[0]) { ... }
   ```

2. **GameRecordPage.tsx:261-268** - 에러 처리 추가
   ```typescript
   try {
     await updatePost(game.id, { recorders: ids });
     toast.success('기록원이 변경되었습니다');
   } catch (error) {
     console.error('Error updating recorders:', error);
     toast.error('기록원 변경 실패');
   }
   ```

### 🟡 P1 (단기 수정)

3. **GameRecordPage.tsx:354-390** - 댓글 입력 방식 변경
   - DataContext의 `addComment` 사용
   - 또는 CommentForm 컴포넌트 사용

4. **GameRecordPage.tsx:106-126** - 권한 체크 로직 분리
   - `canRecord` / `canEditRecord` 분리
   - 변수명 명확화

### 🟢 P2 (중기 개선)

5. **코드 일관성 개선**
   - CommentForm 컴포넌트 재사용
   - Pending 사용자 체크 추가

---

## ✅ 검증 체크리스트

### 런타임 테스트

- [ ] 기록원 선택 시 정상 동작 (에러 처리 포함)
- [ ] 타자 선택 시 `undefined[0]` 에러 없음 (LineupEditor, BatterTable, PitcherTable)
- [ ] 라인업 9명 이상 스크롤 가능
- [ ] 댓글 입력 후 리스트 자동 갱신
- [ ] Pending 사용자 댓글 입력 불가

### 권한 테스트

- [ ] 관리자는 LOCK 상태에서도 수정 가능
- [ ] 기록원은 LOCK 상태에서 수정 불가
- [ ] 기록원이 아닌 사용자는 기록 탭 숨김
- [ ] 기록원 지정은 관리자만 가능

---

## 📝 결론

현재 코드는 **핵심 기능은 작동하나, 프롬프트의 요구사항을 완전히 충족하지 못함**. 특히 **권한 체크 분리**와 **에러 처리**가 누락되어 있어 **즉시 수정이 필요**합니다.

**다음 단계**: P0 에러부터 순차적으로 수정하여 안정성을 확보한 후, 코드 일관성을 개선하는 것을 권장합니다.

---

**보고서 작성 완료**

