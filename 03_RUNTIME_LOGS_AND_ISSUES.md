# 03. RUNTIME LOGS AND ISSUES
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA  
**목적**: 런타임 콘솔 로그 및 네트워크 이슈 고정

---

## 🚀 개발 서버 실행

### 명령어
```bash
npm run dev
```

### 예상 출력
```
VITE v6.3.5  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### 포트
- **기본**: `5173` (Vite 기본값)
- **VITE 설정**: `vite.config.ts`에서 커스터마이징 가능 (현재 기본값 사용)

---

## 🔍 브라우저 콘솔 예상 로그

### 정상 로그 (초기 로드)

**1. 버전 체크 (App.tsx, 라인 30)**
```javascript
console.log('%c Wings PWA v1.3-debug loaded ', 'background: #222; color: #ff00ff');
```
콘솔 출력:
```
 Wings PWA v1.3-debug loaded   [스타일: 검은 배경, 핑크 텍스트]
```

**2. Firebase 초기화**
```javascript
// src/lib/firebase/config.ts
console.log('[Firebase] Initialized with project: wings-baseball-club');  // 예상
```

**3. 인증 상태 체크 (AuthContext.tsx)**
```javascript
onAuthStateChange(auth, (user) => {
  if (user) {
    console.log('[Auth] User logged in:', user.uid);  // 예상
  } else {
    console.log('[Auth] User logged out');  // 예상
  }
});
```

---

### 예상 에러 / 경고

#### 에러 1: TypeScript 미사용 import
**발생 위치**: 페이지 로드 시 컴포넌트 렌더링  
**가능성**: **낮음** (TS 에러는 런타임에 영향 없음, 번들링 완료 후 제거됨)

#### 에러 2: Firebase 권한 거부 (permission-denied)
**발생 조건**:
- pending 상태 사용자가 게시글/댓글 작성 시도
- 기록원이 아닌데 record_* 컬렉션 쓰기 시도
- Firestore rules 정책 위배

**예상 로그**:
```
FirebaseError: Missing or insufficient permissions.
Code: PERMISSION_DENIED
```

**근거** (firestore.rules, 라인 24):
```
function isActiveMember(clubId) {
  return isClubMember(clubId) && member(clubId).status == 'active';
}
```
```
allow create: if isActiveMember(clubId);
```

---

#### 에러 3: Comment 입력 실패 (Issue A 관련)
**발생 위치**: GameRecordPage.tsx, Comments 탭  
**조건**: 댓글 입력 필드 입력 → Enter 또는 버튼 클릭

**예상 로그 (정상)**:
```
Comment added successfully
```

**예상 로그 (오류)**:
```
Error adding comment: [error message]
TypeError: Cannot read property 'addComment' of undefined
```

**근거** (GameRecordPage.tsx, 라인 390~420):
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
              await addComment(game.id, content);  // ← 호출
              toast.success('댓글이 등록되었습니다');
            } catch (err) {
              console.error('Error adding comment:', err);
              toast.error('댓글 등록 실패');
            }
          }
        }}
      />
    </div>
  )}
</TabsContent>
```

---

#### 에러 4: 기록원 변경 저장 실패 (Issue B 관련)
**발생 위치**: GameRecordPage.tsx, 기록원 지정 버튼  
**조건**: MemberPicker에서 멤버 선택 → onChange 콜백

**예상 로그 (정상)**:
```
기록원이 변경되었습니다
```

**예상 로그 (오류)**:
```
Error updating recorders: [error]
기록원 변경 실패
```

**근거** (GameRecordPage.tsx, 라인 325~345):
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
  maxSelection={5}
/>
```

---

#### 에러 5: 타자/투수 레코드 입력 렌더링 문제 (Issue C 관련)
**발생 위치**: GameRecordPage.tsx, Record 탭  
**조건**: LineupEditor, BatterTable, PitcherTable 마운트 시

**예상 콘솔 로그**:
```
Warning: Each child in a list should have a unique "key" prop
[React Warning]

또는

TypeError: Cannot read property 'map' of undefined
[BatterTable/PitcherTable 렌더링 실패]
```

**근거** (BatterTable.tsx, 라인 155~170):
```typescript
return (
  <div className="overflow-x-auto border rounded-lg">
    <table className="w-full text-sm text-center min-w-[600px]">
      <tbody className="divide-y">
        {records.map(rec => (
          <tr key={rec.id} className="bg-white">  // ← key 존재
            {/* 입력 필드 */}
            <td className="p-1">
              <Input 
                type="number" 
                value={rec.ab} 
                onChange={(e) => handleUpdate(rec.id, 'ab', e.target.value)}
                onBlur={() => handleBlur(rec)}
                disabled={!canEdit}
              />
            </td>
            {/* ... 8개 열 */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

**스크롤 컨테이너 설정** (GameRecordPage.tsx, 라인 250):
```typescript
<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
  <TabsContent value="record" className="mt-0 space-y-8 pb-10">
    {/* ... components ... */}
  </TabsContent>
</div>
```

---

## 🌐 네트워크 요청 분석

### Firestore 읽기/쓰기 요청

#### (1) 게시글 목록 요청
**요청**: GET `/clubs/{clubId}/posts`  
**상태**: ✅ 200 (인증 사용자) | ❌ 401 (미인증)  
**규칙** (firestore.rules, 라인 57):
```
allow read: if isAuthenticated();
```

#### (2) 댓글 추가 요청
**요청**: POST `/clubs/{clubId}/posts/{postId}/comments`  
**상태**: ✅ 200 (active) | ❌ PERMISSION_DENIED (pending/미인증)  
**규칙** (firestore.rules, 라인 100):
```
allow create: if isActiveMember(clubId);
```

**성공 예시**:
```
POST /clubs/default-club/posts/game-123/comments
Headers: Authorization: Bearer [token]
Body: {
  content: "댓글 내용",
  authorId: "[USER-ID-HASH]",
  authorName: "[MEMBER-NAME]"
}
Status: 200 OK
Response: { id: "comment-456", createdAt: "2025-12-18T..." }
```

**실패 예시 (pending)**:
```
POST /clubs/default-club/posts/game-123/comments
Status: 403 Forbidden
Error: "Missing or insufficient permissions."
Reason: user.status = 'pending', not 'active'
```

---

#### (3) 기록원 변경 요청
**요청**: PATCH `/clubs/{clubId}/posts/{postId}`  
**요청 본문**:
```json
{
  "recorders": ["[USER-ID-HASH-1]", "[USER-ID-HASH-2]"],
  "updatedAt": "2025-12-18T..."
}
```

**상태**: ✅ 200 (admin/author) | ❌ PERMISSION_DENIED (recorder/member)  
**규칙** (firestore.rules, 라인 87~92):
```typescript
function updatingProtectedPostFields() {
  return request.resource.data.keys().hasAny([
    'authorId','authorName','authorPhotoURL','type',
    'recorders','recordersSnapshot',
    'recordingLocked','recordingLockedAt','recordingLockedBy'
  ]);
}

allow update: if isActiveMember(clubId) && (
  isAdminLike(clubId)
  || (isPostAuthor() && !updatingProtectedPostFields())
);
```

**결론**: `recorders`는 protected field → **admin만 변경 가능**

---

#### (4) 레코드 쓰기 요청 (record_batting, record_pitching)
**요청**: POST/PUT `/clubs/{clubId}/posts/{postId}/record_batting/{docId}`  
**상태**: ✅ 200 (admin/recorder) | ❌ PERMISSION_DENIED (locked) | ❌ 403 (member)  
**규칙** (firestore.rules, 라인 125~135):
```typescript
function canRecordAdminOverride() {
  let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
  let recorders = post.recorders != null ? post.recorders : [];
  let isRecorder = request.auth.uid in recorders;
  let isLocked = post.recordingLocked == true;
  return isAdminLike(clubId) || (isRecorder && !isLocked);
}

match /record_batting/{docId} {
  allow read: if isAuthenticated();
  allow write: if isActiveMember(clubId) && canRecordAdminOverride();
}
```

**조건 분석**:
| 사용자 역할 | recordingLocked | 결과 | 이유 |
|----------|-----------------|------|------|
| Admin | false | ✅ 가능 | isAdminLike() = true |
| Admin | true | ✅ 가능 | isAdminLike() = true (override) |
| Recorder | false | ✅ 가능 | isRecorder && !isLocked |
| Recorder | true | ❌ 불가 | isLocked = true |
| Member | any | ❌ 불가 | isRecorder = false |
| pending | any | ❌ 불가 | !isActiveMember() |

---

## 🚨 Firestore 권한 거부 사례 분석

### Case 1: pending 사용자가 댓글 작성 시도
```javascript
// 시나리오
const user = { status: 'pending', role: 'MEMBER' };
await addComment(gameId, '테스트 댓글');

// 예상 에러
FirebaseError: Missing or insufficient permissions. (code: permission-denied)

// 원인 분석
firestore.rules:100 - allow create: if isActiveMember(clubId);
isActiveMember(clubId) = isClubMember(clubId) && member(clubId).status == 'active'
                      = true && false  // pending ≠ active
                      = false
// 따라서 create 거부됨
```

### Case 2: Recorder가 locked 경기 기록 입력 시도
```javascript
// 시나리오
const game = { recordingLocked: true, recorders: [currentUser.id] };
await setGameBatterRecord(gameId, {playerId, ab: 3, h: 1, ...});

// 예상 에러
FirebaseError: Missing or insufficient permissions. (code: permission-denied)

// 원인 분석
firestore.rules:127-133 - canRecordAdminOverride()
isRecorder = currentUser.id in recorders  // true
isLocked = post.recordingLocked == true   // true
return isAdminLike(clubId) || (isRecorder && !isLocked)
     = false || (true && false)  // locked이므로 !isLocked = false
     = false
// 따라서 write 거부됨
```

### Case 3: Member가 기록원 변경 시도
```javascript
// 시나리오
const user = { role: 'MEMBER', status: 'active' };
await updatePost(gameId, { recorders: [newUser1, newUser2] });

// 예상 에러
FirebaseError: Missing or insufficient permissions. (code: permission-denied)

// 원인 분석
firestore.rules:72-77 - updatingProtectedPostFields()
request.resource.data.keys() includes 'recorders' = true
updatingProtectedPostFields() = true

allow update: if isActiveMember(clubId) && (
  isAdminLike(clubId) || (isPostAuthor() && !updatingProtectedPostFields())
);
     = true && (false || (false && false))
     = true && false
     = false
// protected field 변경이므로 admin 필수
```

---

## ✅ 런타임 체크리스트

- [ ] 개발 서버 시작 (`npm run dev`) ✅ 예상 포트: 5173
- [ ] 로그인 페이지 로드 (비인증)
- [ ] 구글 로그인 (pending 상태로 생성)
- [ ] 관리자 승인 후 active 상태로 변경
- [ ] 게시글 목록 읽기 (권한 OK)
- [ ] 댓글 작성 (active 권한 OK)
- [ ] 경기 기록 페이지 로드
- [ ] 댓글 입력란 존재 여부 (Issue A)
- [ ] 기록원 선택 및 저장 (Issue B)
- [ ] 타자/투수 입력 카드 스크롤 (Issue C)
- [ ] Firestore 콘솔에서 permission-denied 로그 확인

---

## 📌 다음 단계

1. **npm run dev** 실행 → 브라우저 콘솔 로그 수집
2. **Issue A, B, C 재현** 및 콘솔 에러 기록
3. **Firestore Console**에서 요청 로그 확인
4. **08_BUGFIX_WF07_REPRO_ROOTCAUSE.md** 작성
