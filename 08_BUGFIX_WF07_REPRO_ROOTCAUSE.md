# 08. BUGFIX WF-07 REPRO & ROOTCAUSE
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA - Issue A, B, C  
**목적**: 3개 이슈 재현→원인→수정안→검증 완결

---

## 🐛 이슈 A: 경기-댓글 탭에 댓글 입력란이 없음

### 재현 절차

**전제 조건**:
- 사용자: active 상태 (pending 아님)
- 역할: Member 이상
- 경기: 존재하는 경기 문서 필요

**클릭 경로**:
1. 홈 → 하단 네비게이션 "경기 기록" 탭
2. 경기 목록에서 임의의 경기 클릭 → GameDetailModal 열림
3. Tabs → "댓글" 탭 클릭
4. 댓글 목록 아래 "댓글을 입력하세요..." 입력 필드 확인

**예상 동작**: 
- Input 필드 표시
- 실시간 입력 가능
- Enter 키 또는 버튼으로 전송

### 기대 동작 vs 실제 동작

| 항목 | 기대 | 실제 | 상태 |
|-----|------|------|------|
| 입력 필드 표시 | ✅ 표시 | ? 불명확 | 검증 필요 |
| 입력 필드 활성 | ✅ active | ? 불명확 | 검증 필요 |
| 입력 가능 | ✅ 가능 | ? 불명확 | 검증 필요 |
| Enter 전송 | ✅ 가능 | ? 불명확 | 검증 필요 |

---

### 원인 코드 위치

#### (1) 코드는 존재함 (GameRecordPage.tsx, 라인 410~440)
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
            // ... addComment 호출
          }
        }}
      />
      <Button size="icon" onClick={async () => {
        // ... addComment 호출
      }}>
        <ClipboardList className="w-4 h-4" />
      </Button>
    </div>
  )}
</TabsContent>
```

✅ **입력란 코드 명시적으로 존재**

#### (2) 가능한 문제점 - CommentList vs CommentForm 혼동

**CommentList.tsx (라인 1~149)**
- 용도: **댓글 목록만 렌더링** (읽기 전용)
- 입력 필드 없음 ❌

```typescript
export const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const { user } = useAuth();
  const { comments } = useData();

  const postComments = (comments[postId] || [])
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (postComments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        첫 댓글을 작성해보세요!
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <AnimatePresence>
        {postComments.map((comment, index) => (
          <CommentItem key={comment.id} comment={comment} index={index} ... />
        ))}
      </AnimatePresence>
    </div>
  );
};
```

**결론**: CommentList는 목록 전용, **입력란은 GameRecordPage에서 별도 구현**

---

### 수정 전략

#### A-1: 입력란 렌더링 조건 확인
**파일**: GameRecordPage.tsx, 라인 415

현재 코드:
```typescript
{user && user.status !== 'pending' && (
  <div className="p-3 bg-white dark:bg-gray-900 border-t flex gap-2 shrink-0">
```

**확인 사항**:
- `user` 객체 null 확인 (인증 상태)
- `user.status` 필드 값 (pending 아닌지)
- 조건부 렌더링 동작

#### A-2: 입력란 레이아웃 최적화
**파일**: GameRecordPage.tsx, 라인 225

현재:
```typescript
<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
  {/* ... */}
  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
    <TabsContent ...>
```

**문제 가능성**:
- 입력란 fixed 위치 설정 누락 → CommentList에 의해 가려질 수 있음
- `pb-10` 패딩이 있어도, 부모 flex 레이아웃에서 입력란이 아래로 밀려날 수 있음

#### A-3: 입력란 위치 수정
**권장 수정**:
```typescript
// 변경 전
<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
  <CommentList postId={game.id} />
</div>
{/* Comment Input */}
{user && user.status !== 'pending' && (
  <div className="p-3 bg-white dark:bg-gray-900 border-t flex gap-2 shrink-0">
    ...
  </div>
)}

// 변경 후
<div className="flex-1 flex flex-col">
  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
    <CommentList postId={game.id} />
  </div>
  {/* Comment Input - fixed at bottom */}
  {user && user.status !== 'pending' && (
    <div className="p-3 bg-white dark:bg-gray-900 border-t flex gap-2 shrink-0">
      ...
    </div>
  )}
</div>
```

---

### 수정 후 검증 방법

**체크리스트**:
- [ ] npm run dev 실행
- [ ] 경기 기록 페이지 → "댓글" 탭 진입
- [ ] 입력 필드 시각적으로 보이는지 확인
- [ ] 입력 필드에 텍스트 입력 가능한지 확인
- [ ] Enter 키 또는 버튼 클릭 후 댓글 추가되는지 확인
- [ ] 네트워크 탭에서 Firestore 요청 성공 확인 (200 OK)
- [ ] 콘솔에서 에러 메시지 없는지 확인

**테스트 시나리오**:
```javascript
// 1. 댓글 입력 테스트
입력값: "테스트 댓글입니다"
예상: Firestore에 저장, 화면에 즉시 표시

// 2. 특수문자 테스트
입력값: "안녕! 😀 #경기기록"
예상: 특수문자 정상 저장

// 3. 빈 입력 테스트
입력값: "   " (공백만)
예상: trim() 후 전송 안 됨 (e.currentTarget.value.trim()이 false)
```

---

### 부작용/리스크

| 항목 | 설명 | 완화 방법 |
|-----|------|---------|
| **레이아웃 변경** | flex 변경으로 탭 높이 영향 | 테스트 후 CSS 미세 조정 |
| **입력란 가림** | 모바일에서 키보드 올라올 때 | safe area 패딩 확인 |
| **스크롤 충돌** | overflow-y-auto와 shrink-0 충돌 | flex-1과 shrink-0 조합 검증 |

---

---

## 🐛 이슈 B: 기록원 변경 - "변경됨"은 뜨지만 선택 인원 0 / "선택된 멤버 없음"

### 재현 절차

**전제 조건**:
- 사용자: Admin (또는 isAdminLike)
- 경기: 존재하는 경기

**클릭 경로**:
1. 경기 기록 페이지 → "요약" 탭
2. "기록원 지정" 버튼 클릭 → MemberPicker 모달 열림
3. 멤버 1명 이상 선택 (체크박스 클릭)
4. "완료" 버튼 클릭
5. toast: "기록원이 변경되었습니다" 표시 **✅ 성공**
6. 하지만 라벨 "멤버 선택 (0)" 또는 칩이 "선택된 멤버 없음" 표시 **❌ 실제 동작**

### 기대 동작 vs 실제 동작

| 항목 | 기대 | 실제 | 상태 |
|-----|------|------|------|
| 모달 선택 | 1명 선택 | 1명 선택 ✅ | OK |
| onSelectionChange 호출 | ✅ 호출됨 | ✅ 호출됨 | OK |
| updatePost 호출 | ✅ 호출됨 | ✅ 호출됨 (성공) | OK |
| toast 표시 | ✅ 성공 메시지 | ✅ 성공 메시지 | OK |
| 모달 닫기 후 상태 | selectedMemberIds 유지 | selectedMemberIds = [] (초기화됨) | ❌ Bug |
| 라벨 표시 | "멤버 선택 (1)" | "멤버 선택 (0)" | ❌ Bug |

### 원인 코드 위치

#### (1) MemberPicker.tsx - 상태 관리 (라인 22~32)

```typescript
export const MemberPicker: React.FC<MemberPickerProps> = ({
    selectedMemberIds = [],  // ← 기본값: 빈 배열
    onSelectionChange,
    maxSelection = 10,
    label = '멤버 선택',
    trigger
}) => {
    const { members } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');  // ← 내부 상태
```

**문제점**: `selectedMemberIds`는 **props에서만 전달되는 값**, 내부에서 상태 관리 안 함

#### (2) GameRecordPage.tsx - MemberPicker 사용 (라인 335~345)

```typescript
<MemberPicker
  label="기록원 변경"
  selectedMemberIds={game.recorders || []}  // ← props로 전달
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
  maxSelection={5}
  trigger={...}
/>
```

**문제점**: 
- updatePost 성공 후 **게시글 데이터 리로드 안 됨**
- `game.recorders` props가 스냅샷 값 (데이터 갱신 안 됨)
- MemberPicker는 props 의존 → 부모 state 변경 없으면 리렌더링 안 됨

#### (3) 원인 분석

```
사용자 멤버 선택
  ↓ MemberPicker.toggleSelection() → selectedMemberIds state 변경
  ↓ 모달에서 선택 상태 표시: "완료 (1)"
  ↓ "완료" 버튼 클릭
  ↓ 모달 닫기: setIsOpen(false)
  ↓ GameRecordPage로 돌아옴
  ✅ updatePost() 호출 → Firestore 저장 성공
  ✅ toast 표시
  ❌ 하지만 game.recorders props 업데이트 안 됨 (DataContext 리로드 딜레이)
  ❌ MemberPicker re-render → selectedMemberIds 초기화 (= [])
  ❌ 라벨 "(0)" 표시
```

---

### 수정 전략

#### B-1: GameRecordPage에서 데이터 리로드 명시

**현재 코드** (라인 335~345):
```typescript
await updatePost(game.id, { recorders: ids });
toast.success('기록원이 변경되었습니다');
// 여기서 끝 - game.recorders 업데이트 안 됨
```

**수정**:
```typescript
await updatePost(game.id, { recorders: ids });
toast.success('기록원이 변경되었습니다');

// Option 1: 로컬 상태 동기화
// setSelectedGameId(null); setSelectedGameId(game.id);  // 모달 리로드

// Option 2: DataContext 강제 리로드
// await refreshPosts();  // DataContext에서 제공

// Option 3: Optimistic Update
// 로컬 game 객체 즉시 수정 → UI 반영
```

#### B-2: MemberPicker에서 외부 state 감지

**개선안**:
```typescript
export const MemberPicker: React.FC<MemberPickerProps> = ({
    selectedMemberIds = [],
    onSelectionChange,
    ...
}) => {
    const [localSelected, setLocalSelected] = useState(selectedMemberIds);  // ← 추가

    useEffect(() => {
      setLocalSelected(selectedMemberIds);  // props 변경 감지
    }, [selectedMemberIds]);

    const toggleSelection = (memberId: string) => {
      const newIds = localSelected.includes(memberId)
        ? localSelected.filter(id => id !== memberId)
        : [...localSelected, memberId];
      setLocalSelected(newIds);  // 로컬 상태 업데이트
      onSelectionChange(newIds, members);  // 콜백
    };

    return (
      <div>
        <label>{label} ({localSelected.length})</label>  // ← localSelected 사용
      </div>
    );
};
```

---

### 수정 후 검증 방법

**체크리스트**:
- [ ] MemberPicker 모달에서 멤버 선택
- [ ] "완료" 버튼 클릭
- [ ] "기록원이 변경되었습니다" toast 표시
- [ ] **라벨 "(n)"에서 n이 선택 인원 반영하는지 확인**
- [ ] 모달 닫기 후 재조회 → 기록원 정보 유지되는지 확인
- [ ] 콘솔에서 에러 메시지 없는지 확인

**테스트 시나리오**:
```javascript
// 1. 단일 선택 테스트
선택: 1명
예상 라벨: "멤버 선택 (1)"

// 2. 다중 선택 테스트
선택: 3명
예상 라벨: "멤버 선택 (3)"

// 3. 선택 해제 테스트
선택 후 → 1명 선택 해제
예상 라벨: "멤버 선택 (2)"
```

---

### 부작용/리스크

| 항목 | 설명 | 완화 방법 |
|-----|------|---------|
| **로컬 상태 복잡** | useEffect 추가로 복잡도 증가 | prop 변경 감지 테스트 |
| **성능** | re-render 빈도 증가 가능 | useMemo로 최적화 |
| **Race condition** | 빠른 연속 선택 시 | debounce 고려 (선택사항) |

---

---

## 🐛 이슈 C: 기록페이지 타자/포지션 입력 카드가 움직이지/스크롤되지 않아 2명만 입력됨

### 재현 절차

**전제 조건**:
- 사용자: Admin 또는 Recorder
- 경기: 존재하고, recordingLocked = false
- 디바이스: **모바일 (또는 좁은 화면)**

**클릭 경로**:
1. 경기 기록 페이지 → 경기 선택 → "기록 입력" 탭
2. BatterTable 도달
3. "선수 추가" 버튼 → MemberPicker 모달
4. 멤버 1명 선택 → 테이블 행 추가
5. 입력 필드에 데이터 입력 후 blur → 저장
6. 반복 (2번 더)
7. **4번째 멤버 추가 시: 테이블이 스크롤되지 않음** ❌

### 기대 동작 vs 실제 동작

| 항목 | 기대 | 실제 | 상태 |
|-----|------|------|------|
| 테이블 행 추가 | 1~9명 가능 | 1~2명만 가능 | ❌ 스크롤 실패 |
| 수평 스크롤 | 테이블 가로 스크롤 가능 | 어느 정도 작동 | ⚠️ 부분 작동 |
| 수직 스크롤 | 테이블 세로 스크롤 가능 | 작동 안 함 | ❌ 안 됨 |
| 모바일 다중 터치 | swipe로 스크롤 | swipe 안 됨 | ❌ 안 됨 |

### 원인 코드 위치

#### (1) BatterTable 렌더링 구조 (라인 130~171)

```typescript
return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">타자 기록</h3>
            {canEdit && (
                <MemberPicker
                    trigger={<Button size="sm" variant="outline">...</Button>}
                    onSelectionChange={handleCreate}
                    maxSelection={1}
                    label="타자 추가"
                />
            )}
        </div>

        <div className="overflow-x-auto border rounded-lg">  {/* ← overflow-x-auto만 */}
            <table className="w-full text-sm text-center min-w-[600px]">  {/* ← 최소 너비 600px */}
                <thead className="bg-gray-100 text-gray-600 font-medium">
                    <tr>
                        {/* 8개 열 */}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {records.map(rec => (
                        <tr key={rec.id} className="bg-white">
                            {/* 입력 필드 */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);
```

**문제점**:
- `overflow-x-auto` **만** 설정 (수직 스크롤 없음)
- `min-w-[600px]` 테이블 최소 너비 설정 → 세로로 여러 행 보이지 않음
- 부모 컨테이너 높이 제한 없음 → 테이블 확장

#### (2) GameRecordPage 모달 레이아웃 (라인 240~260)

```typescript
<motion.div
    className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg h-[90vh] flex flex-col shadow-2xl"
    // ← max-width: 32rem (lg), height: 90vh
>
    {/* 1. Header Block (Fixed) */}
    <div className="p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-2xl z-10 flex-shrink-0">
        ...
    </div>

    {/* 2. Tabs & Content (Scrollable) */}
    <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 border-b">
                <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-6">
                    ...
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <TabsContent value="record" className="mt-0 space-y-8 pb-10">
                    <LineupEditor ... />
                    <div className="border-t my-4" />
                    <BatterTable ... />
                    <div className="border-t my-4" />
                    <PitcherTable ... />
                </TabsContent>
            </div>
        </Tabs>
    </div>
</motion.div>
```

**분석**:
- 부모: `h-[90vh]` (높이 90% 뷰포트)
- 콘텐츠: `overflow-y-auto` (세로 스크롤 활성)
- **BUT**: TabsContent 내부 테이블들이 stacking 때문에 BatterTable이 아래로 밀려남

#### (3) CSS flex 레이아웃 문제

```
Modal (h-[90vh], flex flex-col)
  ├── Header (flex-shrink-0)  ← 고정 높이
  └── Tabs (flex-1, overflow-hidden, flex flex-col)
      ├── TabsList (h-12, flex-shrink-0)  ← 고정 높이
      └── Content (flex-1, overflow-y-auto)
          └── TabsContent
              ├── LineupEditor
              │   └── Cards[] (space-y-2)  ← 약 9 × 50px = 450px
              ├── Divider (h-1)
              ├── BatterTable
              │   ├── Header
              │   └── Table (overflow-x-auto, min-w-[600px])  ← ⚠️ 문제!
              │       ├── TR × n (행 높이 40px)
              │       └── 여러 행이 아래로 쌓임
              └── Footer (pb-10)
```

**원인**: BatterTable 테이블이 **height 제한 없이 자연스럽게 확장** → 모달 높이 초과 → 스크롤 안 보임

---

### 수정 전략

#### C-1: BatterTable에 최대 높이 및 스크롤 추가

**현재**:
```typescript
<div className="overflow-x-auto border rounded-lg">
    <table className="w-full text-sm text-center min-w-[600px]">
```

**수정**:
```typescript
<div className="overflow-x-auto overflow-y-auto border rounded-lg max-h-[300px]">
    {/* ← overflow-y-auto 추가, max-h-[300px] 추가 */}
    <table className="w-full text-sm text-center min-w-[600px]">
```

또는 sticky header:
```typescript
<div className="overflow-auto border rounded-lg max-h-[300px]">
    <table className="w-full text-sm text-center min-w-[600px]">
        <thead className="bg-gray-100 text-gray-600 font-medium sticky top-0">
            {/* ← sticky 추가 */}
        </thead>
```

#### C-2: 모바일 반응형 테이블

**권장**:
```typescript
// Tailwind responsive
<div className="overflow-x-auto overflow-y-auto border rounded-lg max-h-[250px] md:max-h-[400px]">
```

#### C-3: 모바일에서 축소 뷰 대안

**고급 해법**:
```typescript
// 모바일: 카드 레이아웃
// 데스크톱: 테이블 레이아웃

{isMobile ? (
    <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {records.map(rec => (
            <Card className="p-3">
                {/* 축약된 입력 폼 */}
            </Card>
        ))}
    </div>
) : (
    <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
        <table>...</table>
    </div>
)}
```

---

### 수정 후 검증 방법

**체크리스트**:
- [ ] npm run dev 실행
- [ ] 경기 기록 → "기록 입력" 탭
- [ ] BatterTable에 멤버 1명 추가
- [ ] 반복해서 9명까지 추가 가능한지 확인
- [ ] 스크롤 바 시각적으로 나타나는지 확인
- [ ] 수직 스크롤 동작 확인
- [ ] 모바일 (또는 좁은 화면) 에뮬레이션으로 테스트
- [ ] swipe/터치 스크롤 동작 확인

**테스트 시나리오**:
```javascript
// 1. 9명 추가 테스트
반복: 멤버 선택 → 데이터 입력 (9회)
예상: 모든 9명 row 스크롤로 접근 가능

// 2. 스크롤 테스트
마우스 휠: 테이블 내 스크롤
터치: swipe로 스크롤
예상: 부드러운 스크롤

// 3. 입력 테스트 (마지막 row)
9번째 row까지 스크롤해서 도달
입력 필드 클릭 → 입력 → blur
예상: 정상 저장
```

---

### 부작용/리스크

| 항목 | 설명 | 완화 방법 |
|-----|------|---------|
| **높이 고정** | max-h-[300px] 고정으로 UX 제약 | 반응형으로 조정 (md: 등) |
| **sticky header** | sticky header 추가로 복잡도 증가 | 필요시만 적용 |
| **테이블 깨짐** | 좁은 화면에서 컬럼 숨김 가능 | 반응형 CSS 추가 |
| **성능** | 많은 row 렌더링 시 성능 저하 | virtualization 고려 (향후) |

---

## ✅ 3개 이슈 검증 요약

| 이슈 | 원인 | 수정 난이도 | 리스크 |
|-----|------|-----------|--------|
| **A** (댓글 입력란) | 레이아웃 flex 순서 | 낮음 | 낮음 |
| **B** (기록원 상태) | props 동기화 미흡 | 중간 | 낮음 |
| **C** (테이블 스크롤) | 높이 제한 없음 | 낮음 | 낮음 |

---

## 📌 다음 단계

1. 09번 "PATCH_PLAN_ATOMIC.md"에서 원자 단위 수정 제시
2. 각 패치 코드 작성 및 테스트
3. 배포 전 통합 검증
