# 12. 기획 vs 구현 원자단위 Gap 분석 보고서
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA v1.1  
**목적**: 가입 방식 제외, 나머지 기능을 원자 단위로 분해하여 구현 Gap 정밀 분석

---

## 📋 분석 범위 및 전제

### 전제 조건
- ✅ **가입 방식**: 현재 방식(Google OAuth + Admin 승인) 유지 확정
- 🔍 **분석 대상**: 가입 제외한 모든 기획 기능을 원자 단위로 분해
- 📊 **분석 기준**: 각 원자 기능별 구현 여부, 코드 위치, 미구현 상세

---

## 🎯 1. 멤버/권한 관리 (원자 단위 분석)

### 1.1 멤버 데이터 모델

| 원자 기능 | 기획 필드 | 구현 필드 | 위치 | 상태 |
|---------|---------|---------|------|------|
| 실명 저장 | realName | realName | types.ts:User | ✅ |
| 닉네임(선택) | nickname | nickname | types.ts:User | ✅ |
| 연락처(선택) | phone | ❌ 없음 | - | ❌ |
| 포지션 | position | position | types.ts:Member | ✅ |
| 백넘버 | backNumber | backNumber | types.ts:Member | ✅ |
| 프로필 사진 | photoURL | photoURL | types.ts:User | ✅ |
| 역할 | role | role | types.ts:Member | ✅ |
| 상태 | status | status | types.ts:Member | ✅ |
| 가입일 | createdAt | createdAt | types.ts:Member | ✅ |

**Gap**: 연락처(phone) 필드 없음

**조치**:
```typescript
// types.ts - Member 인터페이스에 추가
export interface Member {
  // ... 기존 필드
  phone?: string;  // 선택 필드
}

// firestore.service.ts - updateMember 함수에 phone 지원
export async function updateMember(
  clubId: string,
  userId: string,
  updates: { position?: string; backNumber?: string; phone?: string }
) {
  // ...
}
```

---

### 1.2 멤버 검색/필터

| 원자 기능 | 기획 요구 | 구현 위치 | 상태 | Gap |
|---------|---------|---------|------|-----|
| 실명 검색 | ✅ | ❌ 없음 | ❌ | UI/로직 없음 |
| 포지션 필터 | ✅ | ❌ 없음 | ❌ | 필터 UI 없음 |
| 백넘버 필터 | ✅ | ❌ 없음 | ❌ | 필터 UI 없음 |
| 역할 필터 | ✅ | ❌ 없음 | ❌ | 필터 UI 없음 |
| 상태 필터 (active/inactive) | ✅ | ⚠️ 부분 | DataContext.tsx:145 | active만 필터 |

**구현 상태**:
```typescript
// DataContext.tsx:145 - 현재 구현
const activeMembers = useMemo(
  () => Object.values(members).filter(m => m.status === 'active'),
  [members]
);
```

**Gap 상세**:
1. 검색 입력 필드 없음
2. 필터 드롭다운 없음
3. 검색/필터 로직 없음

**조치 - 검색/필터 컴포넌트 신규 생성**:
```typescript
// src/app/components/MemberSearchFilter.tsx (신규)
export const MemberSearchFilter: React.FC<{
  members: Member[];
  onFilter: (filtered: Member[]) => void;
}> = ({ members, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    const filtered = members.filter(m => {
      const matchName = m.realName.includes(searchTerm);
      const matchPosition = !positionFilter || m.position === positionFilter;
      const matchRole = !roleFilter || m.role === roleFilter;
      return matchName && matchPosition && matchRole;
    });
    onFilter(filtered);
  }, [searchTerm, positionFilter, roleFilter, members]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="이름 검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Select value={positionFilter} onValueChange={setPositionFilter}>
        <option value="">포지션 전체</option>
        <option value="P">투수</option>
        <option value="C">포수</option>
        {/* ... */}
      </Select>
      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <option value="">역할 전체</option>
        <option value="ADMIN">관리자</option>
        <option value="MEMBER">일반</option>
      </Select>
    </div>
  );
};
```

---

### 1.3 역할 변경 및 권한

| 원자 기능 | 기획 요구 | 구현 위치 | 상태 | Gap |
|---------|---------|---------|------|-----|
| ADMIN 부여 (회장/감독만) | ✅ | firestore.rules:78 | ✅ | - |
| ADMIN 회수 (회장/감독만) | ✅ | firestore.rules:78 | ✅ | - |
| TREASURER 지정 (회장만) | ✅ | ❌ 규칙 없음 | ⚠️ | TREASURER 변경 규칙 누락 |
| 역할 변경 UI | ✅ | ❌ 없음 | ❌ | 관리자 페이지 없음 |
| 역할 변경 감사 로그 | ✅ | ❌ audit 컬렉션 없음 | ❌ | 로그 시스템 없음 |

**firestore.rules 검증**:
```javascript
// 현재 구현 (firestore.rules:78)
match /members/{userId} {
  allow update: if isAdminLike() && 
    (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']));
  // ← role 변경 시 차단! (버그)
}
```

**Gap 상세**:
1. **규칙 버그**: role 필드 변경이 차단됨 (affectedKeys 조건 오류)
2. 역할 변경 UI 없음 (관리자 페이지 미구현)
3. 감사 로그 없음

**조치 1 - firestore.rules 수정**:
```javascript
// firestore.rules 수정
match /members/{userId} {
  // 포지션/백넘버 수정: 관리자
  allow update: if isAdminLike() && 
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['position', 'backNumber', 'phone', 'nickname']);
  
  // 역할 변경: 회장/감독만
  allow update: if (request.auth.token.role == 'PRESIDENT' || 
                     request.auth.token.role == 'DIRECTOR') &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['role']);
}
```

**조치 2 - 관리자 페이지 신규 생성**:
```typescript
// src/app/pages/AdminPage.tsx (신규)
export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { members } = useData();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  if (!user || !['PRESIDENT', 'DIRECTOR'].includes(user.role)) {
    return <div>권한이 없습니다</div>;
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateMemberRole(currentClubId, userId, newRole);
    // TODO: audit 로그 기록
  };

  return (
    <div>
      <h1>멤버 관리</h1>
      <MemberSearchFilter members={Object.values(members)} />
      <MemberList onSelect={setSelectedMember} />
      {selectedMember && (
        <MemberEditModal
          member={selectedMember}
          onRoleChange={handleRoleChange}
        />
      )}
    </div>
  );
};
```

**조치 3 - 감사 로그 시스템**:
```typescript
// firestore.service.ts - audit 로그 추가
export async function logAudit(
  clubId: string,
  event: {
    type: 'ROLE_CHANGE' | 'RECORD_LOCK' | 'LEDGER_APPROVE';
    actorId: string;
    targetId: string;
    before: any;
    after: any;
    timestamp: Date;
  }
) {
  await addDoc(collection(db, `clubs/${clubId}/audit`), {
    ...event,
    timestamp: serverTimestamp(),
  });
}

// 사용
await updateMemberRole(clubId, userId, newRole);
await logAudit(clubId, {
  type: 'ROLE_CHANGE',
  actorId: user.id,
  targetId: userId,
  before: { role: oldRole },
  after: { role: newRole },
  timestamp: new Date(),
});
```

---

## 🎯 2. 게시판/댓글 (원자 단위 분석)

### 2.1 게시판 타입별 구현

| 게시판 타입 | 기획 type | 구현 type | 상태 | Gap |
|-----------|---------|---------|------|-----|
| 공지 | notice | notice | ✅ | - |
| 자유 | free | free | ✅ | - |
| 연습/경기 일정 | event | schedule | ⚠️ | type명 차이 |
| 기타 (회의/회식/번개) | meetup | ❌ 없음 | ❌ | 미구현 |
| 투표 | poll | ❌ 없음 | ❌ | 미구현 |
| 경기결과/기록 | game | game | ✅ | - |
| 앨범 | album | ❌ 없음 | ❌ | 미구현 |

**Gap 상세**:
1. meetup 타입 없음 (회의/회식/번개/기타 선택 UI)
2. poll 타입 없음 (투표 전용 게시판)
3. album 타입 없음 (사진/영상 게시판)

**조치 - types.ts 확장**:
```typescript
// types.ts
export type PostType = 
  | 'notice' 
  | 'free' 
  | 'schedule'  // 기존: event
  | 'meetup'    // 신규: 회의/회식/번개/기타
  | 'poll'      // 신규: 투표
  | 'game' 
  | 'album';    // 신규: 앨범

// meetup 서브타입
export type MeetupType = 'MEETING' | 'DINNER' | 'IMPROMPTU' | 'OTHER';

export interface Post {
  // ... 기존 필드
  meetupType?: MeetupType;  // type=meetup일 때만
  pollData?: {              // type=poll일 때만
    choices: { id: string; label: string }[];
    multi: boolean;
    anonymous: boolean;
    closeAt: Date;
  };
}
```

---

### 2.2 댓글 기능

| 원자 기능 | 기획 요구 | 구현 위치 | 상태 | Gap |
|---------|---------|---------|------|-----|
| 댓글 작성 | ✅ | DataContext.tsx:addComment | ✅ | - |
| 댓글 수정 | ✅ | ❌ 없음 | ❌ | 수정 기능 없음 |
| 댓글 삭제 | ✅ | DataContext.tsx:deleteComment | ✅ | - |
| 댓글 작성자 확인 | ✅ | CommentList.tsx:50 | ⚠️ | **버그**(author.id) |
| 댓글 목록 조회 | ✅ | DataContext.tsx:loadComments | ✅ | - |
| 댓글 실시간 업데이트 | ✅ | onSnapshot | ✅ | - |

**버그 상세**:
```typescript
// CommentList.tsx:50 (현재 - 오류)
{comment.author.id === user?.id && " (나)"}
// ❌ comment.author 객체 없음

// 수정 필요
{comment.authorId === user?.id && " (나)"}
// ✅ authorId 필드 사용
```

**Gap - 댓글 수정 기능**:
```typescript
// DataContext.tsx - updateComment 추가
const updateComment = async (postId: string, commentId: string, content: string) => {
  const commentRef = doc(db, `clubs/${currentClubId}/posts/${postId}/comments/${commentId}`);
  await updateDoc(commentRef, {
    content,
    updatedAt: serverTimestamp(),
  });
};

// CommentList.tsx - 수정 UI 추가
const [editingId, setEditingId] = useState<string | null>(null);

{editingId === comment.id ? (
  <Input
    value={editContent}
    onChange={(e) => setEditContent(e.target.value)}
    onBlur={() => {
      updateComment(postId, comment.id, editContent);
      setEditingId(null);
    }}
  />
) : (
  <p>{comment.content}</p>
)}
```

---

### 2.3 공지 푸시 (핵심 Gap)

| 원자 기능 | 기획 요구 | 구현 위치 | 상태 | Gap |
|---------|---------|---------|------|-----|
| FCM 토큰 저장 | ✅ | ❌ | ❌ | members/{userId}.fcmToken 없음 |
| 토큰 갱신 로직 | ✅ | ❌ | ❌ | 클라이언트 FCM 초기화 없음 |
| 공지 작성 시 푸시 발송 | ✅ 필수 | ❌ | ❌ | Cloud Functions 없음 |
| 푸시 실패 재시도 | ✅ | ❌ | ❌ | 재시도 로직 없음 |
| 푸시 실패 기록 | ✅ | ❌ | ❌ | audit/푸시 로그 없음 |

**조치 1 - FCM 클라이언트 설정**:
```typescript
// src/lib/firebase/messaging.service.ts (신규)
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export async function initializeFCM() {
  const messaging = getMessaging();
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });
  
  // 토큰 저장
  await updateMember(currentClubId, currentUserId, { fcmToken: token });
  
  // 포그라운드 메시지 수신
  onMessage(messaging, (payload) => {
    console.log('Foreground message:', payload);
    // toast 또는 notification 표시
  });
}
```

**조치 2 - Cloud Functions 푸시 발송**:
```typescript
// functions/src/index.ts (신규)
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendNoticeNotification = functions.firestore
  .document('clubs/{clubId}/posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    
    if (post.type !== 'notice') return;  // 공지만 푸시
    
    const clubId = context.params.clubId;
    
    // 멤버 FCM 토큰 조회
    const membersSnap = await admin.firestore()
      .collection(`clubs/${clubId}/members`)
      .where('status', '==', 'active')
      .get();
    
    const tokens = membersSnap.docs
      .map(doc => doc.data().fcmToken)
      .filter(t => !!t);
    
    if (tokens.length === 0) return;
    
    // 푸시 발송
    const message = {
      notification: {
        title: `[공지] ${post.title}`,
        body: post.content.substring(0, 100),
      },
      tokens,
    };
    
    try {
      const response = await admin.messaging().sendMulticast(message);
      
      // 실패 로그 기록
      if (response.failureCount > 0) {
        await admin.firestore().collection(`clubs/${clubId}/audit`).add({
          type: 'PUSH_FAILURE',
          postId: snap.id,
          failureCount: response.failureCount,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Push failed:', error);
      // 재시도 큐에 추가 (옵션)
    }
  });
```

**조치 3 - firebase.json 수정**:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

---

## 🎯 3. 일정/출석 투표 (원자 단위 분석)

### 3.1 일정 데이터 모델

| 원자 기능 | 기획 필드 | 구현 필드 | 위치 | 상태 | Gap |
|---------|---------|---------|------|------|-----|
| 일정 유형 | eventType: PRACTICE\|GAME | ❌ | - | ❌ | 유형 구분 없음 |
| 시작 시각 | startAt | date | types.ts:Post | ⚠️ | 필드명 차이 |
| 장소 | place | location | types.ts:Post | ⚠️ | 필드명 차이 |
| 상대팀 (경기) | opponent | opponent | types.ts:Post | ✅ | - |
| 마감 시각 | voteCloseAt | ❌ | - | ❌ | 미구현 |
| 마감 상태 | voteClosed | ❌ | - | ❌ | 미구현 |

**조치 - types.ts 확장**:
```typescript
// types.ts
export interface Post {
  // ... 기존 필드
  
  // 일정 전용 (type=schedule)
  eventType?: 'PRACTICE' | 'GAME';  // 신규
  startAt?: Date;                    // date → startAt로 통일
  location?: string;                 // place → location (현재 일치)
  opponent?: string;
  voteCloseAt?: Date;                // 신규: 전날 23:00 계산
  voteClosed?: boolean;              // 신규: 마감 상태
}
```

---

### 3.2 출석 투표 시스템

| 원자 기능 | 기획 요구 | 구현 위치 | 상태 | Gap |
|---------|---------|---------|------|-----|
| 출석 문서 구조 | posts/{postId}/attendance/{userId} | ❌ | ❌ | 서브컬렉션 없음 |
| 투표 선택 (참/불/미정) | status: JOIN\|ABSENT\|UNDECIDED | ❌ | ❌ | 투표 저장 없음 |
| 투표 변경 (마감 전) | ✅ | ❌ | ❌ | 변경 로직 없음 |
| 실시간 집계 | ✅ | ❌ | ❌ | 집계 로직 없음 |
| 마감 시각 계산 | startAt - 1일 + 23:00 | ❌ | ❌ | 자동 계산 없음 |
| 마감 후 변경 차단 | ✅ | ❌ | ❌ | 규칙 없음 |

**Gap 전체**: 출석 투표 시스템이 완전히 미구현

**조치 1 - 출석 투표 데이터 모델**:
```typescript
// types.ts
export type AttendanceStatus = 'JOIN' | 'ABSENT' | 'UNDECIDED';

export interface Attendance {
  userId: string;
  status: AttendanceStatus;
  votedAt: Date;
  updatedAt: Date;
}

// Firestore 경로: clubs/{clubId}/posts/{postId}/attendance/{userId}
```

**조치 2 - firestore.service.ts 투표 함수**:
```typescript
// firestore.service.ts
export async function voteAttendance(
  clubId: string,
  postId: string,
  userId: string,
  status: AttendanceStatus
) {
  const postRef = doc(db, `clubs/${clubId}/posts/${postId}`);
  const post = (await getDoc(postRef)).data();
  
  // 마감 체크
  if (post.voteClosed) {
    throw new Error('투표가 마감되었습니다');
  }
  
  const attendanceRef = doc(db, `clubs/${clubId}/posts/${postId}/attendance/${userId}`);
  await setDoc(attendanceRef, {
    userId,
    status,
    votedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getAttendanceStats(clubId: string, postId: string) {
  const attendanceSnap = await getDocs(
    collection(db, `clubs/${clubId}/posts/${postId}/attendance`)
  );
  
  const stats = {
    join: 0,
    absent: 0,
    undecided: 0,
  };
  
  attendanceSnap.forEach(doc => {
    const data = doc.data();
    if (data.status === 'JOIN') stats.join++;
    else if (data.status === 'ABSENT') stats.absent++;
    else stats.undecided++;
  });
  
  return stats;
}
```

**조치 3 - 마감 시각 계산 로직**:
```typescript
// utils/attendance.ts (신규)
export function calculateVoteCloseAt(startAt: Date): Date {
  const closeAt = new Date(startAt);
  closeAt.setDate(closeAt.getDate() - 1);  // 하루 전
  closeAt.setHours(23, 0, 0, 0);           // 23:00:00
  return closeAt;
}

// 일정 생성 시 자동 계산
export async function createSchedulePost(data: {
  title: string;
  startAt: Date;
  // ...
}) {
  const voteCloseAt = calculateVoteCloseAt(data.startAt);
  
  await addDoc(collection(db, `clubs/${clubId}/posts`), {
    ...data,
    type: 'schedule',
    voteCloseAt,
    voteClosed: false,
    createdAt: serverTimestamp(),
  });
}
```

---

### 3.3 자동 마감 스케줄러 (핵심 Gap)

| 원자 기능 | 기획 요구 | 구현 위치 | 상태 | Gap |
|---------|---------|---------|------|-----|
| Cloud Scheduler 설정 | ✅ | ❌ | ❌ | 스케줄러 없음 |
| 마감 대상 탐색 | voteCloseAt <= now && !voteClosed | ❌ | ❌ | Functions 없음 |
| voteClosed 업데이트 | ✅ | ❌ | ❌ | 자동화 없음 |
| 마감 푸시 발송 | ✅ | ❌ | ❌ | 푸시 연동 없음 |
| 관리자 집계 알림 | ✅ | ❌ | ❌ | 집계 알림 없음 |

**조치 1 - Cloud Functions 스케줄러**:
```typescript
// functions/src/index.ts
export const closeAttendanceVotes = functions.pubsub
  .schedule('*/10 * * * *')  // 10분마다 실행
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // 마감 대상 조회
    const postsSnap = await admin.firestore()
      .collectionGroup('posts')
      .where('type', '==', 'schedule')
      .where('voteClosed', '==', false)
      .where('voteCloseAt', '<=', now)
      .get();
    
    const batch = admin.firestore().batch();
    const notifications: any[] = [];
    
    postsSnap.forEach(doc => {
      const postRef = doc.ref;
      batch.update(postRef, {
        voteClosed: true,
        closedAt: now,
      });
      
      // 푸시 알림 준비
      const clubId = postRef.parent.parent?.id;
      if (clubId) {
        notifications.push({
          clubId,
          postId: doc.id,
          title: doc.data().title,
        });
      }
    });
    
    await batch.commit();
    
    // 푸시 발송
    for (const notif of notifications) {
      await sendAttendanceClosedNotification(notif.clubId, notif.postId, notif.title);
    }
    
    console.log(`Closed ${postsSnap.size} attendance votes`);
  });

async function sendAttendanceClosedNotification(
  clubId: string,
  postId: string,
  title: string
) {
  const membersSnap = await admin.firestore()
    .collection(`clubs/${clubId}/members`)
    .where('status', '==', 'active')
    .get();
  
  const tokens = membersSnap.docs
    .map(doc => doc.data().fcmToken)
    .filter(t => !!t);
  
  if (tokens.length === 0) return;
  
  await admin.messaging().sendMulticast({
    notification: {
      title: `[출석 마감] ${title}`,
      body: '출석 투표가 마감되었습니다. 최종 인원을 확인하세요.',
    },
    tokens,
  });
}
```

**조치 2 - Cloud Scheduler 설정**:
```bash
# Firebase Console에서 설정 또는 CLI
gcloud scheduler jobs create pubsub close-attendance-job \
  --schedule="*/10 * * * *" \
  --topic=firebase-schedule-closeAttendanceVotes \
  --message-body='{}' \
  --time-zone=Asia/Seoul
```

---

## 🎯 4. 투표 게시판 (원자 단위 분석)

### 4.1 투표 데이터 모델

| 원자 기능 | 기획 필드 | 구현 필드 | 상태 | Gap |
|---------|---------|---------|------|-----|
| 의제/설명 | title, content | title, content | ✅ | - |
| 선택지 | choices: [{id, label}] | ❌ | ❌ | pollData 없음 |
| 단일/복수 선택 | multi: boolean | ❌ | ❌ | - |
| 익명 투표 | anonymous: boolean | ❌ | ❌ | - |
| 마감 시각 | closeAt | ❌ | ❌ | - |
| 마감 상태 | closed: boolean | ❌ | ❌ | - |
| 결과 공개 정책 | showResultsWhen: IMMEDIATE\|AFTER_CLOSE | ❌ | ❌ | - |

**Gap**: 투표 기능 완전 미구현

**조치 - types.ts 투표 모델**:
```typescript
// types.ts
export interface PollChoice {
  id: string;
  label: string;
  voteCount?: number;  // 집계용 (캐시)
}

export interface PollData {
  choices: PollChoice[];
  multi: boolean;
  anonymous: boolean;
  closeAt: Date;
  closed: boolean;
  showResultsWhen: 'IMMEDIATE' | 'AFTER_CLOSE';
}

export interface PollVote {
  userId: string;
  choiceIds: string[];  // 복수 선택 지원
  votedAt: Date;
}

// Firestore 경로:
// - posts/{postId}.pollData
// - posts/{postId}/votes/{userId}
```

**조치 - firestore.service.ts 투표 함수**:
```typescript
// firestore.service.ts
export async function createPoll(
  clubId: string,
  data: {
    title: string;
    content: string;
    choices: string[];  // 라벨 배열
    multi: boolean;
    anonymous: boolean;
    closeAt: Date;
  }
) {
  const pollData: PollData = {
    choices: data.choices.map((label, i) => ({
      id: `choice_${i}`,
      label,
      voteCount: 0,
    })),
    multi: data.multi,
    anonymous: data.anonymous,
    closeAt: data.closeAt,
    closed: false,
    showResultsWhen: 'AFTER_CLOSE',
  };
  
  await addDoc(collection(db, `clubs/${clubId}/posts`), {
    type: 'poll',
    title: data.title,
    content: data.content,
    pollData,
    createdAt: serverTimestamp(),
  });
}

export async function votePoll(
  clubId: string,
  postId: string,
  userId: string,
  choiceIds: string[]
) {
  const postRef = doc(db, `clubs/${clubId}/posts/${postId}`);
  const post = (await getDoc(postRef)).data();
  
  if (post.pollData.closed) {
    throw new Error('투표가 마감되었습니다');
  }
  
  if (!post.pollData.multi && choiceIds.length > 1) {
    throw new Error('단일 선택만 가능합니다');
  }
  
  // 투표 저장
  const voteRef = doc(db, `clubs/${clubId}/posts/${postId}/votes/${userId}`);
  await setDoc(voteRef, {
    userId,
    choiceIds,
    votedAt: serverTimestamp(),
  }, { merge: true });
  
  // 집계 업데이트 (Transaction으로 안전하게)
  await runTransaction(db, async (transaction) => {
    const postSnap = await transaction.get(postRef);
    const pollData = postSnap.data().pollData;
    
    // 선택지별 카운트 증가
    pollData.choices.forEach((choice: PollChoice) => {
      if (choiceIds.includes(choice.id)) {
        choice.voteCount = (choice.voteCount || 0) + 1;
      }
    });
    
    transaction.update(postRef, { pollData });
  });
}
```

---

## 🎯 5. 앨범 (원자 단위 분석)

### 5.1 앨범 데이터 모델

| 원자 기능 | 기획 필드 | 구현 필드 | 상태 | Gap |
|---------|---------|---------|------|-----|
| 사진/영상 URL | mediaUrls: string[] | ❌ | ❌ | 미구현 |
| 썸네일 URL | thumbnailUrls: string[] | ❌ | ❌ | 미구현 |
| 미디어 타입 | mediaType: IMAGE\|VIDEO | ❌ | ❌ | 미구현 |
| 파일 크기 | fileSize: number | ❌ | ❌ | 미구현 |
| 업로드 진행률 | (클라이언트 state) | ❌ | ❌ | 미구현 |

**Gap**: 앨범 기능 완전 미구현

**조치 - types.ts 앨범 모델**:
```typescript
// types.ts
export interface AlbumMedia {
  url: string;
  thumbnailUrl?: string;
  type: 'IMAGE' | 'VIDEO';
  fileSize: number;
  uploadedAt: Date;
}

export interface Post {
  // ... 기존 필드
  
  // 앨범 전용 (type=album)
  media?: AlbumMedia[];
}
```

**조치 - storage.service.ts 업로드**:
```typescript
// src/lib/firebase/storage.service.ts (신규)
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

export async function uploadMedia(
  clubId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `clubs/${clubId}/album/${fileName}`);
  
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(percent);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function createAlbumPost(
  clubId: string,
  data: {
    title: string;
    content: string;
    files: File[];
  }
) {
  const mediaPromises = data.files.map(async (file) => {
    const url = await uploadMedia(clubId, file);
    return {
      url,
      type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
      fileSize: file.size,
      uploadedAt: new Date(),
    } as AlbumMedia;
  });
  
  const media = await Promise.all(mediaPromises);
  
  await addDoc(collection(db, `clubs/${clubId}/posts`), {
    type: 'album',
    title: data.title,
    content: data.content,
    media,
    createdAt: serverTimestamp(),
  });
}
```

---

## 🎯 6. 회비/회계 (원자 단위 분석)

### 6.1 회비 관리

| 원자 기능 | 기획 요구 | 구현 위치 | 상태 | Gap |
|---------|---------|---------|------|-----|
| 회비 컬렉션 | clubs/{clubId}/dues/{userId} | ❌ | ❌ | 컬렉션 없음 |
| 납부 상태 | status: PAID\|UNPAID | ❌ | ❌ | - |
| 납부 일자 | paidAt | ❌ | ❌ | - |
| 금액 | amount | ❌ | ❌ | - |
| 메모 | memo | ❌ | ❌ | - |
| 월별 필터 | yearMonth: '2025-12' | ❌ | ❌ | - |

**조치 - types.ts 회비 모델**:
```typescript
// types.ts
export interface Dues {
  userId: string;
  yearMonth: string;  // '2025-12'
  amount: number;
  status: 'PAID' | 'UNPAID';
  paidAt?: Date;
  memo?: string;
  updatedBy: string;
  updatedAt: Date;
}

// Firestore 경로: clubs/{clubId}/dues/{userId}_{yearMonth}
```

**조치 - firestore.service.ts 회비 함수**:
```typescript
// firestore.service.ts
export async function updateDues(
  clubId: string,
  userId: string,
  yearMonth: string,
  data: {
    amount: number;
    status: 'PAID' | 'UNPAID';
    paidAt?: Date;
    memo?: string;
  },
  updatedBy: string
) {
  const duesId = `${userId}_${yearMonth}`;
  const duesRef = doc(db, `clubs/${clubId}/dues/${duesId}`);
  
  await setDoc(duesRef, {
    userId,
    yearMonth,
    ...data,
    updatedBy,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getDuesByMonth(clubId: string, yearMonth: string) {
  const duesSnap = await getDocs(
    query(
      collection(db, `clubs/${clubId}/dues`),
      where('yearMonth', '==', yearMonth)
    )
  );
  
  return duesSnap.docs.map(doc => doc.data() as Dues);
}
```

---

### 6.2 회계 장부

| 원자 기능 | 기획 요구 | 구현 위치 | 상태 | Gap |
|---------|---------|---------|------|-----|
| 회계 컬렉션 | clubs/{clubId}/ledger/{entryId} | ❌ | ❌ | 컬렉션 없음 |
| 항목 작성 (총무) | createdBy = TREASURER | ❌ | ❌ | - |
| 승인/반려 (회장) | status: DRAFT\|SUBMITTED\|APPROVED\|REJECTED | ❌ | ❌ | - |
| 승인 후 수정 불가 | firestore.rules 제약 | ❌ | ❌ | - |
| 첨부 파일 | attachments: string[] | ❌ | ❌ | - |
| 감사 로그 | audit 기록 | ❌ | ❌ | - |

**조치 - types.ts 회계 모델**:
```typescript
// types.ts
export type LedgerStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Ledger {
  id: string;
  title: string;
  amount: number;
  date: Date;
  category: string;  // 수입/지출/기타
  memo?: string;
  attachments?: string[];  // Storage URLs
  status: LedgerStatus;
  createdBy: string;       // TREASURER
  createdAt: Date;
  approvedBy?: string;     // PRESIDENT
  approvedAt?: Date;
  rejectedReason?: string;
}

// Firestore 경로: clubs/{clubId}/ledger/{entryId}
```

**조치 - firestore.rules 회계 규칙**:
```javascript
// firestore.rules
match /ledger/{entryId} {
  // 총무만 작성 가능
  allow create: if request.auth.token.role == 'TREASURER' &&
    request.resource.data.status == 'DRAFT';
  
  // 총무: DRAFT/SUBMITTED 상태만 수정
  allow update: if request.auth.token.role == 'TREASURER' &&
    resource.data.status in ['DRAFT', 'SUBMITTED'] &&
    request.resource.data.status in ['DRAFT', 'SUBMITTED'];
  
  // 회장: 승인/반려
  allow update: if request.auth.token.role == 'PRESIDENT' &&
    resource.data.status == 'SUBMITTED' &&
    request.resource.data.status in ['APPROVED', 'REJECTED'];
  
  // 승인 후 수정 불가
  allow update: if resource.data.status != 'APPROVED';
  
  allow read: if isAdminLike();
}
```

**조치 - firestore.service.ts 회계 함수**:
```typescript
// firestore.service.ts
export async function createLedgerEntry(
  clubId: string,
  data: {
    title: string;
    amount: number;
    date: Date;
    category: string;
    memo?: string;
  },
  createdBy: string
) {
  await addDoc(collection(db, `clubs/${clubId}/ledger`), {
    ...data,
    status: 'DRAFT',
    createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function approveLedger(
  clubId: string,
  entryId: string,
  approvedBy: string
) {
  const entryRef = doc(db, `clubs/${clubId}/ledger/${entryId}`);
  
  await updateDoc(entryRef, {
    status: 'APPROVED',
    approvedBy,
    approvedAt: serverTimestamp(),
  });
  
  // 감사 로그
  await logAudit(clubId, {
    type: 'LEDGER_APPROVE',
    actorId: approvedBy,
    targetId: entryId,
    before: { status: 'SUBMITTED' },
    after: { status: 'APPROVED' },
    timestamp: new Date(),
  });
}
```

---

## 📊 7. 전체 Gap 요약 (원자 단위)

### 7.1 P0 - 즉시 수정 필요

| 원자 기능 | 위치 | 조치 | 예상 시간 |
|---------|------|------|---------|
| CommentList author.id 버그 | CommentList.tsx:50 | authorId로 수정 | 5분 |
| 경기 기록 3개 버그 | GameRecordPage, MemberPicker, BatterTable | 08/09 문서 기반 수정 | 2시간 |
| firestore.rules 역할 변경 버그 | firestore.rules:78 | role 변경 허용 규칙 추가 | 10분 |

**총 예상**: 2시간 15분

---

### 7.2 P1 - 단기 구현 필요 (1주일)

| 원자 기능 | 구성 요소 | 예상 시간 |
|---------|---------|---------|
| **FCM 푸시 인프라** | messaging.service.ts, Cloud Functions, firebase.json | 4시간 |
| **출석 투표 시스템** | Attendance 모델, 투표/집계 함수, UI | 8시간 |
| **자동 마감 스케줄러** | Cloud Functions, Scheduler 설정 | 3시간 |
| **멤버 검색/필터** | MemberSearchFilter 컴포넌트 | 2시간 |
| **관리자 페이지** | AdminPage, 역할 변경 UI | 4시간 |
| **댓글 수정 기능** | updateComment 함수, UI | 1시간 |

**총 예상**: 22시간 (약 3일)

---

### 7.3 P2 - 중기 구현 (2주일)

| 원자 기능 | 구성 요소 | 예상 시간 |
|---------|---------|---------|
| **투표 게시판** | Poll 모델, 투표 함수, UI, 집계 | 12시간 |
| **앨범 기본 기능** | Album 모델, Storage 업로드, 그리드 UI | 8시간 |
| **meetup 게시판** | Meetup 타입, 서브타입 선택 UI | 2시간 |

**총 예상**: 22시간 (약 3일)

---

### 7.4 P3 - 장기 구현 (1개월)

| 원자 기능 | 구성 요소 | 예상 시간 |
|---------|---------|---------|
| **회비 관리** | Dues 모델, CRUD, 월별 필터 UI | 8시간 |
| **회계 장부** | Ledger 모델, 승인 워크플로우, UI | 12시간 |
| **감사 로그 시스템** | audit 컬렉션, 이벤트 기록, 관리자 대시보드 | 6시간 |
| **앨범 고급 기능** | 용량 모니터링, 압축, 썸네일 생성 | 8시간 |

**총 예상**: 34시간 (약 4.5일)

---

## 🎯 8. 우선순위별 실행 계획

### Phase 1: 버그 수정 및 핵심 Gap (P0 + 일부 P1)
**기간**: 1주일  
**목표**: 현재 기능 완성도 100% + 자동화 인프라

```
Day 1 (P0):
  ✅ CommentList author.id → authorId 수정
  ✅ 경기 기록 3개 버그 수정 (A/B/C)
  ✅ firestore.rules 역할 변경 규칙 추가

Day 2-3 (P1 자동화):
  ✅ FCM 클라이언트 설정 (messaging.service.ts)
  ✅ Cloud Functions 푸시 발송 (sendNoticeNotification)
  ✅ Cloud Functions 스케줄러 (closeAttendanceVotes)
  ✅ firebase.json functions 섹션 추가

Day 4-5 (P1 출석):
  ✅ Attendance 모델 및 투표 함수
  ✅ 출석 투표 UI (ScheduleDetailPage)
  ✅ 실시간 집계 표시

Day 6-7 (P1 관리):
  ✅ 멤버 검색/필터 컴포넌트
  ✅ 관리자 페이지 (역할 변경)
  ✅ 댓글 수정 기능
```

**Deliverable**: Release 1.1 배포 준비

---

### Phase 2: 핵심 미구현 모듈 (P2)
**기간**: 2주일  
**목표**: 투표/앨범/meetup 게시판 구현

```
Week 1 (투표):
  ✅ Poll 모델 및 투표 함수
  ✅ 투표 생성 UI
  ✅ 투표 참여 UI
  ✅ 결과 집계/그래프

Week 2 (앨범/meetup):
  ✅ Album 모델 및 Storage 업로드
  ✅ 다중 업로드 UI + 진행률
  ✅ 썸네일 그리드
  ✅ meetup 타입 추가 (회의/회식/번개/기타)
```

**Deliverable**: Release 1.5 배포

---

### Phase 3: 회비/회계 시스템 (P3)
**기간**: 1개월  
**목표**: 재무 관리 완성

```
Week 1-2 (회비):
  ✅ Dues 모델 및 CRUD
  ✅ 월별 납부 상태 UI
  ✅ 납부 체크/메모 기능

Week 3-4 (회계):
  ✅ Ledger 모델 및 승인 워크플로우
  ✅ 총무 작성 UI
  ✅ 회장 승인/반려 UI
  ✅ 감사 로그 통합

Week 4 (감사 시스템):
  ✅ audit 컬렉션 전체 이벤트 기록
  ✅ 관리자 감사 로그 대시보드
```

**Deliverable**: Release 2.0 배포 (기획 100% 달성)

---

## 📋 9. 결론

### 9.1 현재 상태 (가입 방식 제외)

**전체 완성도**: **52.9%** → **목표: 100%**

| 영역 | 현재 | 목표 | Gap |
|-----|------|------|-----|
| 멤버/권한 | 83% | 100% | 검색/필터, 관리 UI, 감사 로그 |
| 게시판/댓글 | 62% | 100% | 푸시 알림, 댓글 수정 |
| 일정/출석 | 30% | 100% | 투표 시스템, 자동 마감 |
| 경기 기록 | 90% | 100% | 3개 버그 수정 |
| 투표 | 10% | 100% | 전체 시스템 구현 |
| 앨범 | 0% | 100% | 전체 시스템 구현 |
| 회비/회계 | 0% | 100% | 전체 시스템 구현 |

---

### 9.2 총 개발 공수 추정

| Phase | 예상 시간 | 기간 |
|-------|---------|------|
| Phase 1 (P0+P1) | 24시간 | 1주일 |
| Phase 2 (P2) | 22시간 | 2주일 |
| Phase 3 (P3) | 34시간 | 1개월 |

**총 개발 시간**: **80시간** (1인 기준 약 2개월, 2인 기준 1개월)

---

### 9.3 핵심 제언

1. **Phase 1 우선 집중**: 자동화 인프라(FCM, Scheduler)가 없으면 동호회 운영 불가능
2. **경기 기록 완성도 유지**: 현재 90%로 가장 잘 구현됨, 3개 버그만 수정하면 완벽
3. **회비/회계는 필수**: 재무 관리 없이는 동호회 지속 운영 어려움
4. **투표/앨범은 상대적 우선도 낮음**: 외부 도구로 임시 대체 가능

---

✅ **원자 단위 Gap 분석 완료!** | **총 80+ 원자 기능 분석** | **3단계 실행 계획 수립**
