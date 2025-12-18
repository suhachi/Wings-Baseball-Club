# 09. PATCH_PLAN_ATOMIC
**작성일**: 2025-12-18 | **대상**: 3개 이슈 원자 단위 수정 계획  
**목적**: 각 버그를 최소 단위로 분해해서 배포 가능하게 구성

---

## 📋 패치 우선순위

| 순위 | 이슈 | 심각도 | 영향 | 난이도 |
|-----|------|--------|------|--------|
| **P0** | C (테이블 스크롤) | High | 사용자 데이터 입력 불가 | Low |
| **P1** | A (댓글 입력란) | High | 커뮤니케이션 단절 | Low |
| **P2** | B (기록원 상태) | Medium | UI 혼동, 기능은 작동 | Medium |

---

## 🔧 P0: Issue C - 테이블 스크롤 fix

### 패치 목표
BatterTable & PitcherTable에서 모바일/좁은 화면에서도 9명 데이터 입력 가능

### 파일 수정 목록

#### 1. **BatterTable.tsx** (라인 140~175)

**파일 경로**: `src/app/pages/GameRecordPage/BatterTable.tsx`

**변경 전**:
```typescript
return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">타자 기록</h3>
            {canEdit && (
                <MemberPicker
                    trigger={<Button size="sm" variant="outline">선수 추가</Button>}
                    onSelectionChange={handleCreate}
                    maxSelection={1}
                    label="타자 추가"
                />
            )}
        </div>

        {/* ← overflow-x-auto 만 있음 */}
        <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm text-center min-w-[600px]">
                {/* 8 columns */}
            </table>
        </div>
    </div>
);
```

**변경 후**:
```typescript
return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">타자 기록</h3>
            {canEdit && (
                <MemberPicker
                    trigger={<Button size="sm" variant="outline">선수 추가</Button>}
                    onSelectionChange={handleCreate}
                    maxSelection={1}
                    label="타자 추가"
                />
            )}
        </div>

        {/* ← overflow-x-auto, overflow-y-auto, max-h 추가 */}
        <div className="overflow-auto border rounded-lg max-h-[250px] md:max-h-[400px]">
            <table className="w-full text-sm text-center min-w-[600px]">
                {/* 8 columns */}
            </table>
        </div>
    </div>
);
```

**diff 명령**:
```bash
# 라인 155 수정
- <div className="overflow-x-auto border rounded-lg">
+ <div className="overflow-auto border rounded-lg max-h-[250px] md:max-h-[400px]">
```

---

#### 2. **PitcherTable.tsx** (라인 155~190)

**파일 경로**: `src/app/pages/GameRecordPage/PitcherTable.tsx`

**변경 전**:
```typescript
<div className="overflow-x-auto border rounded-lg">
    <table className="w-full text-sm text-center min-w-[600px]">
```

**변경 후**:
```typescript
<div className="overflow-auto border rounded-lg max-h-[250px] md:max-h-[400px]">
    <table className="w-full text-sm text-center min-w-[600px]">
```

**diff 명령**:
```bash
# 라인 170 수정 (PitcherTable은 라인 번호 약간 다를 수 있음)
- <div className="overflow-x-auto border rounded-lg">
+ <div className="overflow-auto border rounded-lg max-h-[250px] md:max-h-[400px]">
```

---

### 테스트 프로토콜

```bash
# 1. 개발 서버 시작
npm run dev

# 2. Chrome DevTools → F12
#    Device Toolbar (Ctrl+Shift+M) → iPhone 12 Pro 선택

# 3. 경기 기록 → "기록 입력" 탭 진입

# 4. BatterTable에서 멤버 9명 추가
#    각 추가 후: blur 이벤트로 자동 저장 확인

# 5. 스크롤 테스트
#    - 마우스 휠 스크롤 (모바일 에뮬레이션)
#    - 마지막 row (9번째) 도달 가능한지 확인

# 6. 네트워크 탭
#    각 save 요청: setGameBatterRecord(...) → Firestore OK
```

### 검증 체크리스트

- [ ] 모바일 에뮬레이션에서 스크롤 바 시각적으로 보임
- [ ] 9명 모두 데이터 입력 가능
- [ ] 마지막 row의 입력 필드가 가려지지 않음
- [ ] Firestore 요청 성공 (네트워크 탭)
- [ ] 콘솔 에러 없음
- [ ] 데스크톱에서도 정상 동작 (max-h-[400px])

### 롤백 절차

```bash
# 변경 사항 되돌리기
git checkout -- src/app/pages/GameRecordPage/BatterTable.tsx
git checkout -- src/app/pages/GameRecordPage/PitcherTable.tsx

# 또는 수동으로:
# overflow-x-auto 부분만 원상복구
```

---

---

## 🔧 P1: Issue A - 댓글 입력란 fix

### 패치 목표
GameRecordPage "댓글" 탭에 입력 필드 확실하게 표시 및 입력 가능하게

### 파일 수정 목록

#### 1. **GameRecordPage.tsx** (라인 400~450)

**파일 경로**: `src/app/pages/GameRecordPage/GameRecordPage.tsx`

**변경 전**:
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
            // ... addComment
          }
        }}
      />
      <Button size="icon" onClick={async () => {
        // ... addComment
      }}>
        <ClipboardList className="w-4 h-4" />
      </Button>
    </div>
  )}
</TabsContent>
```

**분석 (원인)**:
- Input이 존재하지만 **상위 flex 레이아웃에서 가려질 가능성**
- `pb-10` 패딩이 없어서 입력란이 스크롤 아래에 숨을 가능성

**변경 후**:
```typescript
<TabsContent value="comments" className="mt-0 flex flex-col h-full">
  {/* Comment List - scrollable area */}
  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
    <CommentList postId={game.id} />
  </div>
  
  {/* Comment Input - fixed at bottom */}
  {user && user.status !== 'pending' && (
    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2 shrink-0">
      <Input
        placeholder="댓글을 입력하세요..."
        className="flex-1"
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.currentTarget.value.trim()) {
            // ... addComment 호출
            e.currentTarget.value = '';  // ← 입력 완료 후 초기화
          }
        }}
      />
      <Button 
        size="icon" 
        onClick={async () => {
          // ... addComment 호출
        }}
      >
        <Send className="w-4 h-4" />  {/* ← ClipboardList에서 Send 아이콘으로 변경 권장 */}
      </Button>
    </div>
  )}
</TabsContent>
```

**diff**:
```diff
- <TabsContent value="comments" className="mt-0 flex flex-col h-full">
+ <TabsContent value="comments" className="mt-0 flex flex-col h-full pb-0">
  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
    <CommentList postId={game.id} />
  </div>
- {user && user.status !== 'pending' && (
-   <div className="p-3 bg-white dark:bg-gray-900 border-t flex gap-2 shrink-0">
+ {user && user.status !== 'pending' ? (
+   <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2 shrink-0">
      <Input
        placeholder="댓글을 입력하세요..."
        className="flex-1"
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.currentTarget.value.trim()) {
            // ... addComment 호출
+           e.currentTarget.value = '';
          }
        }}
      />
      <Button size="icon">
-       <ClipboardList className="w-4 h-4" />
+       <Send className="w-4 h-4" />
      </Button>
    </div>
- )}
+ ) : (
+   <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
+     계정 승인 대기 중: 관리자 승인 후 댓글 작성 가능합니다.
+   </div>
+ )}
</TabsContent>
```

---

### 테스트 프로토콜

```bash
# 1. npm run dev 실행
npm run dev

# 2. 경기 기록 → "댓글" 탭 클릭
#    → 입력 필드 시각적으로 보이는지 확인

# 3. 입력 필드에 텍스트 입력
# 4. Enter 키 또는 버튼 클릭
# 5. 새 댓글 즉시 표시되는지 확인
# 6. Firestore 요청 성공 (네트워크 탭)
```

### 검증 체크리스트

- [ ] 입력 필드 시각적으로 화면에 보임
- [ ] 입력 필드 클릭 가능
- [ ] 텍스트 입력 가능
- [ ] Enter 키 또는 버튼으로 전송 가능
- [ ] 새 댓글 즉시 리스트에 추가됨
- [ ] Firestore 요청 성공 (network console OK)
- [ ] 콘솔 에러 없음
- [ ] pending 사용자: "계정 승인 대기 중" 메시지 표시

### 롤백 절차

```bash
git checkout -- src/app/pages/GameRecordPage/GameRecordPage.tsx
```

---

---

## 🔧 P2: Issue B - 기록원 상태 동기화 fix

### 패치 목표
기록원 변경 후 라벨 "(n)"에서 n이 올바르게 반영되도록

### 파일 수정 목록

#### 1. **MemberPicker.tsx** (라인 1~70, 100~184)

**파일 경로**: `src/app/components/MemberPicker.tsx`

**변경 전**:
```typescript
export const MemberPicker: React.FC<MemberPickerProps> = ({
    selectedMemberIds = [],
    onSelectionChange,
    maxSelection = 10,
    label = '멤버 선택',
    trigger
}) => {
    const { members } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // ← 내부 상태 없음 - props에만 의존
    
    const toggleSelection = (memberId: string) => {
        // ...
    };

    return (
        <div>
            <label className="text-sm font-medium">
                {label} ({selectedMemberIds.length})  {/* ← props 사용 */}
            </label>
        </div>
    );
};
```

**문제점**:
- `selectedMemberIds` props는 **스냅샷** (게시글 로드 시점)
- updatePost 후 DataContext 리로드 전까지 props 업데이트 안 됨
- 모달 재렌더링 → props 변경 감지 안 됨 → "선택 (0)" 표시

**변경 후**:
```typescript
export const MemberPicker: React.FC<MemberPickerProps> = ({
    selectedMemberIds = [],
    onSelectionChange,
    maxSelection = 10,
    label = '멤버 선택',
    trigger
}) => {
    const { members } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // ← 로컬 상태 추가
    const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedMemberIds);
    
    // ← useEffect: props 변경 감지
    useEffect(() => {
        setLocalSelectedIds(selectedMemberIds);
    }, [selectedMemberIds]);
    
    const toggleSelection = (memberId: string) => {
        const newIds = localSelectedIds.includes(memberId)
            ? localSelectedIds.filter(id => id !== memberId)
            : [...localSelectedIds, memberId];
        
        // 최대 선택 수 체크
        if (newIds.length <= maxSelection) {
            setLocalSelectedIds(newIds);  // ← 로컬 상태 업데이트
        }
    };
    
    const handleConfirm = () => {
        const selectedMembers = members.filter(m => localSelectedIds.includes(m.id));
        onSelectionChange(localSelectedIds, selectedMembers);  // ← 콜백
        setIsOpen(false);
    };

    return (
        <div>
            <label className="text-sm font-medium">
                {label} ({localSelectedIds.length})  {/* ← 로컬 상태 사용 */}
            </label>
            {/* ... rest */}
        </div>
    );
};
```

**diff**:
```diff
+ import { useEffect } from 'react';

export const MemberPicker: React.FC<MemberPickerProps> = ({
    selectedMemberIds = [],
    onSelectionChange,
    maxSelection = 10,
    label = '멤버 선택',
    trigger
}) => {
    const { members } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
+   const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedMemberIds);
+   
+   useEffect(() => {
+       setLocalSelectedIds(selectedMemberIds);
+   }, [selectedMemberIds]);
    
    const toggleSelection = (memberId: string) => {
        const newIds = localSelectedIds.includes(memberId)
            ? localSelectedIds.filter(id => id !== memberId)
-           : [...localSelectedIds, memberId];
+           : [...localSelectedIds, memberId].slice(0, maxSelection);
        setLocalSelectedIds(newIds);
    };
    
    const handleConfirm = () => {
-       const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));
-       onSelectionChange(selectedMemberIds, selectedMembers);
+       const selectedMembers = members.filter(m => localSelectedIds.includes(m.id));
+       onSelectionChange(localSelectedIds, selectedMembers);
        setIsOpen(false);
    };

    return (
        <div>
-           <label>{label} ({selectedMemberIds.length})</label>
+           <label>{label} ({localSelectedIds.length})</label>
        </div>
    );
};
```

---

#### 2. **GameRecordPage.tsx** (라인 325~345) - Optional: 강제 리로드

**파일 경로**: `src/app/pages/GameRecordPage/GameRecordPage.tsx`

**선택 사항**: Optimistic Update 추가 (MemberPicker 수정 후에도 추가로 강화)

```typescript
const handleRecorderChange = async (ids: string[]) => {
    if (game.recordingLocked) {
        toast.error('마감된 경기는 기록원을 변경할 수 없습니다.');
        return;
    }
    
    try {
        // 1. Firestore 업데이트
        await updatePost(game.id, { recorders: ids });
        toast.success('기록원이 변경되었습니다');
        
        // 2. Optional: 로컬 상태 즉시 업데이트 (Optimistic Update)
        // setGame({ ...game, recorders: ids });
        
        // 3. Optional: DataContext 강제 리로드
        // await refreshPosts();  // DataContext에서 제공하는 함수
    } catch (error) {
        console.error('Error updating recorders:', error);
        toast.error('기록원 변경 실패');
    }
};
```

---

### 테스트 프로토콜

```bash
# 1. npm run dev 실행
npm run dev

# 2. 경기 기록 → "요약" 탭 → "기록원 지정" 클릭
#    → MemberPicker 모달 열림

# 3. 멤버 3명 선택
#    → 라벨 "(3)" 표시되는지 확인

# 4. "완료" 버튼 클릭
#    → "기록원이 변경되었습니다" toast
#    → Firestore 요청 성공

# 5. 모달 닫기 후 다시 "기록원 지정" 클릭
#    → MemberPicker 재열림
#    → 라벨 "(3)" 유지되는지 확인
#    → 3명이 선택 상태인지 확인
```

### 검증 체크리스트

- [ ] 모달에서 멤버 선택 시 라벨 "(n)" 업데이트됨
- [ ] "완료" 클릭 후 toast 표시
- [ ] Firestore 요청 성공
- [ ] 모달 닫기 후 재오픈 → 선택 상태 유지
- [ ] 라벨 "(n)"에서 n이 정확한 값 표시
- [ ] 콘솔 에러 없음
- [ ] 최대 선택 제한 (maxSelection=5) 동작

### 롤백 절차

```bash
git checkout -- src/app/components/MemberPicker.tsx
git checkout -- src/app/pages/GameRecordPage/GameRecordPage.tsx  # optional
```

---

---

## 📦 배포 및 검증 전략

### 1단계: 개별 테스트 (각 개발자)

```bash
# P0 fix 테스트
git checkout -b fix/issue-c-table-scroll
# ... BatterTable.tsx, PitcherTable.tsx 수정
npm run build
npm run type-check
# → 테스트 완료 후 commit

# P1 fix 테스트
git checkout -b fix/issue-a-comment-input
# ... GameRecordPage.tsx 수정
npm run build
npm run type-check
# → 테스트 완료 후 commit

# P2 fix 테스트
git checkout -b fix/issue-b-recorder-state
# ... MemberPicker.tsx 수정
npm run build
npm run type-check
# → 테스트 완료 후 commit
```

### 2단계: 통합 테스트 (전체 workflow)

```bash
# main 브랜치에서 3개 fix 모두 merge
git checkout main
git merge fix/issue-c-table-scroll
git merge fix/issue-a-comment-input
git merge fix/issue-b-recorder-state

# 전체 빌드 테스트
npm run build
npm run type-check

# 통합 e2e 테스트
npm run dev
# → 모든 경기 기록 workflow 검증
```

### 3단계: 배포 전 체크리스트

- [ ] 3개 fix 모두 main에 merge됨
- [ ] npm run build 성공 (dist/ 생성)
- [ ] npm run type-check 성공 (43 errors → 0 errors로 개선)
- [ ] 콘솔 에러 없음
- [ ] 모바일 에뮬레이션 테스트 통과
- [ ] Firestore 규칙 적용 (firestore.rules 배포)
- [ ] git tag (v1.2.0 등) 생성

### 4단계: 배포 (Firebase Hosting)

```bash
# Firebase 프로젝트 배포
firebase deploy --only hosting

# 또는 full deploy (functions + rules + hosting)
firebase deploy

# 배포 상태 확인
firebase hosting:channel:list
```

### 5단계: 배포 후 검증

- [ ] https://wings-baseball-club.firebaseapp.com 접속 가능
- [ ] 3개 이슈 모두 해결됨
- [ ] 성능 회귀 없음 (Lighthouse score 확인)

---

## 🔄 롤백 전략

### 긴급 롤백 (배포 직후)

```bash
# Firebase Hosting 이전 버전으로 롤백
firebase hosting:channel:deploy main --origin main --expires 0d

# 또는 이전 deployment로 복원
firebase hosting:sites:list
firebase deploy --only hosting:wings-baseball-club --message "Rollback to v1.1.0"
```

### 부분 롤백 (개별 fix)

```bash
# 개별 파일 롤백
git revert <commit-hash>
npm run build
firebase deploy --only hosting
```

---

## 📊 영향도 분석

| 파일 | 변경 라인 | 영향 범위 | 리스크 |
|-----|---------|---------|--------|
| BatterTable.tsx | 155 | 타자 입력 테이블 렌더링 | 낮음 |
| PitcherTable.tsx | 170 | 투수 입력 테이블 렌더링 | 낮음 |
| GameRecordPage.tsx | 415 | 댓글 입력란 렌더링 | 낮음 |
| MemberPicker.tsx | 22-70, 100+ | 멤버 선택 모달 상태 | 중간 |

**총 변경 라인**: ~30 라인  
**변경 파일**: 4개  
**테스트 필요**: Workflow 07 (경기 기록) 전체  

---

## 🎯 완료 기준

✅ 모든 P0 이슈 해결  
✅ 모든 P1 이슈 해결  
✅ 모든 P2 이슈 해결  
✅ 통합 테스트 통과  
✅ Firebase 배포 성공  
✅ 3개 이슈 모두 재현 불가능  
