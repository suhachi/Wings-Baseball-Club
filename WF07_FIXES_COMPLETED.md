# ✅ WF-07 프롬프트 요구사항 수정 완료 보고서

**수정 완료일**: 2024년  
**수정 기준**: 사용자 제공 프롬프트 요구사항

---

## 📋 수정 완료 항목

### ✅ A. 권한 체크 (canRecord) - 프롬프트 A안 요구사항 반영

**파일**: `src/app/pages/GameRecordPage.tsx:105-122`

**수정 내용**:
```typescript
// 프롬프트 요구사항대로 변수 분리 및 명시적 선언
const isAdminLike = isAdmin(); // existing helper
const isGameRecorder = React.useMemo(() => {
  if (!user) return false;
  return (game.recorders ?? []).includes(user.id);
}, [user, game.recorders]);
const canRecord = isAdminLike || isGameRecorder;
const isLocked = game.recordingLocked === true;
const canEditRecord = React.useMemo(() => {
  if (!user) return false;
  return isAdminLike ? true : (canRecord && !isLocked);
}, [user, isAdminLike, canRecord, isLocked]);

// canViewRecordTab은 canRecord와 동일
const canViewRecordTab = canRecord;

// canEdit은 canEditRecord와 동일 (하위 호환성)
const canEdit = canEditRecord;
```

**요구사항 충족**:
- ✅ `isAdminLike` 변수 명시적 선언
- ✅ `isGameRecorder` 변수 명시적 선언 (null 체크 포함: `?? []`)
- ✅ `canRecord` 변수 분리
- ✅ `canEditRecord` 변수 분리 (LOCK 상태 고려)
- ✅ `isLocked` 명시적 계산

---

### ✅ B. 기록원 선택 에러 처리

**파일**: `src/app/pages/GameRecordPage.tsx:260-276`

**수정 내용**:
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
      // 성공 후 데이터 자동 갱신 (onSnapshot 또는 refreshPosts)
    } catch (error) {
      console.error('Error updating recorders:', error);
      toast.error('기록원 변경 실패');
      // 실패 시 모달은 유지 (MemberPicker 내부에서 처리)
    }
  }}
  ...
/>
```

**요구사항 충족**:
- ✅ try-catch 에러 처리 추가
- ✅ 실패 시 toast.error 표시
- ✅ 성공 시 toast.success 표시
- ✅ 실패 시 모달 유지 (MemberPicker 내부 처리)

---

### ✅ C. 스크롤 지원

**상태**: 이미 구현되어 있음 (수정 불필요)

**파일**: `src/app/pages/GameRecordPage.tsx:260`

**현재 구현**:
```typescript
<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
  <TabsContent value="record" className="mt-0 space-y-8 pb-10">
    <LineupEditor ... />
    <BatterTable ... />
    <PitcherTable ... />
  </TabsContent>
</div>
```

**요구사항 충족**:
- ✅ `overflow-y-auto` 적용
- ✅ 9개 슬롯 스크롤 가능
- ✅ 모달 내부 스크롤 정상 작동

---

### ✅ D. 댓글 입력란 복구 및 개선

**파일**: `src/app/pages/GameRecordPage.tsx:357-400`

**수정 내용**:
```typescript
<TabsContent value="comments" className="mt-0 flex flex-col h-full">
  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
    <CommentList postId={game.id} />
  </div>
  {/* Comment Input */}
  {user && user.status !== 'pending' && (
    <div className="p-3 bg-white dark:bg-gray-900 border-t flex gap-2 shrink-0">
      <Input
        placeholder="댓글을 입력하세요..."
        className="flex-1"
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.currentTarget.value.trim()) {
            const content = e.currentTarget.value.trim();
            e.currentTarget.value = '';
            try {
              await addComment(game.id, content);
              toast.success('댓글이 등록되었습니다');
              // DataContext.addComment는 내부에서 loadComments 호출하므로 자동 갱신됨
            } catch (err) {
              console.error('Error adding comment:', err);
              toast.error('댓글 등록 실패');
            }
          }
        }}
      />
      <Button size="icon" onClick={async () => {
        const input = document.querySelector('input[placeholder="댓글을 입력하세요..."]') as HTMLInputElement;
        if (input && input.value.trim()) {
          const content = input.value.trim();
          input.value = '';
          try {
            await addComment(game.id, content);
            toast.success('댓글이 등록되었습니다');
          } catch (err) {
            console.error('Error adding comment:', err);
            toast.error('댓글 등록 실패');
          }
        }
      }}>
        <ClipboardList className="w-4 h-4" />
      </Button>
    </div>
  )}
</TabsContent>
```

**주요 변경사항**:
- ✅ `firestore.service.addComment` 직접 import 제거
- ✅ `DataContext.addComment` 사용 (자동 갱신)
- ✅ Pending 사용자 체크 추가 (`user.status !== 'pending'`)
- ✅ 에러 처리 추가 (try-catch)

**요구사항 충족**:
- ✅ 댓글 입력란 복구
- ✅ CommentList props 올바르게 전달
- ✅ Pending 사용자 체크
- ✅ DataContext 사용 (데이터 일관성)

---

### ✅ E. undefined[0] 런타임 에러 방지

**파일**: `src/app/components/game-record/PitcherTable.tsx:69-73`

**수정 내용**:
```typescript
// 수정 전
const handleCreate = async (ids: string[], members: any[]) => {
  if (members[0]) {  // ❌ Guard 불완전
    addPlayer(members[0]);
  }
};

// 수정 후
const handleCreate = async (ids: string[], members: any[]) => {
  if (members && members.length > 0 && members[0]) {  // ✅ 완전한 Guard
    addPlayer(members[0]);
  }
};
```

**요구사항 충족**:
- ✅ `members` null 체크 추가
- ✅ `members.length > 0` 체크 추가
- ✅ `members[0]` 접근 전 guard 완료

**다른 컴포넌트 확인**:
- ✅ LineupEditor: Guard 이미 완전함
- ✅ BatterTable: Guard 이미 완전함
- ✅ MemberPicker: `[0]` 직접 접근 없음

---

## 📊 수정 완료 요약

| 항목 | 요구사항 | 수정 전 상태 | 수정 후 상태 | 완료도 |
|------|---------|------------|------------|--------|
| A. 권한 체크 | 변수 분리 + 명시적 선언 | 로직만 존재 | ✅ 변수 분리 완료 | 100% |
| B. 기록원 선택 에러 처리 | try-catch + toast | 에러 처리 없음 | ✅ 에러 처리 추가 | 100% |
| C. 스크롤 지원 | overflow-y-auto, 9개 슬롯 | ✅ 이미 구현 | ✅ 유지 | 100% |
| D. 댓글 입력란 | CommentComposer 또는 DataContext | 직접 import | ✅ DataContext 사용 | 100% |
| E. undefined[0] guard | 모든 배열 접근 guard | PitcherTable 누락 | ✅ Guard 추가 | 100% |

**전체 완료도**: **100%** ✅

---

## 🔍 추가 수정 사항

### GameCard 컴포넌트 추가

**파일**: `src/app/pages/GameRecordPage.tsx:92-120`

**이유**: GameCard 컴포넌트가 누락되어 타입 에러 발생

**수정 내용**: GameCard 컴포넌트 정의 추가

```typescript
const GameCard: React.FC<{
  game: Post;
  index: number;
  onClick: () => void;
}> = ({ game, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      onClick={onClick}
    >
      <Card className="p-4 hover:shadow-lg transition-all cursor-pointer">
        {/* ... GameCard UI ... */}
      </Card>
    </motion.div>
  );
};
```

---

## ✅ 검증 체크리스트

### 런타임 테스트
- [x] 기록원 선택 시 에러 처리 정상 동작
- [x] 타자/투수 선택 시 undefined[0] 에러 없음
- [x] 라인업 9명 이상 스크롤 가능
- [x] 댓글 입력 후 리스트 자동 갱신
- [x] Pending 사용자 댓글 입력 불가

### 권한 테스트
- [x] 관리자는 LOCK 상태에서도 수정 가능 (`isAdminLike ? true`)
- [x] 기록원은 LOCK 상태에서 수정 불가 (`canRecord && !isLocked`)
- [x] 기록원이 아닌 사용자는 기록 탭 숨김 (`canViewRecordTab = canRecord`)
- [x] 기록원 지정은 관리자만 가능

---

## 🎯 결론

프롬프트의 모든 요구사항이 **100% 완료**되었습니다.

1. ✅ **A안 권한 체크**: 변수 분리 및 명시적 선언 완료
2. ✅ **기록원 선택 에러 처리**: try-catch + toast 추가 완료
3. ✅ **스크롤 지원**: 이미 구현되어 있음 (유지)
4. ✅ **댓글 입력란**: DataContext 사용 및 Pending 체크 추가 완료
5. ✅ **undefined[0] guard**: PitcherTable Guard 보강 완료

**모든 수정 사항이 적용되었으며, 타입 에러 없이 컴파일됩니다.**

---

**수정 완료 보고서 작성 완료**

