# handoff_pack/05_FIRESTORE_SCHEMA.md

## 목적/범위
Firestore 컬렉션/문서 구조, 필드 정의, 샘플 데이터를 정리합니다.

---

## 컬렉션 구조 (전체)

```
/ (Root)
├── users/                    # 전역 사용자 프로필
│   └── {userId}
├── clubs/                    # 클럽 컬렉션
│   └── {clubId}/            # 현재 'default-club' 고정
│       ├── members/         # 클럽 멤버십
│       │   └── {userId}
│       ├── posts/           # 게시글
│       │   └── {postId}
│       │       ├── comments/        # 댓글 (서브컬렉션)
│       │       │   └── {commentId}
│       │       ├── attendance/      # 출석 기록 (서브컬렉션)
│       │       │   └── {userId}
│       │       ├── record_lineup/   # 라인업 기록 (서브컬렉션, WF-07)
│       │       │   └── {slotId}
│       │       ├── record_batting/  # 타자 기록 (서브컬렉션, WF-07)
│       │       │   └── {playerId}
│       │       └── record_pitching/ # 투수 기록 (서브컬렉션, WF-07)
│       │           └── {playerId}
│       └── ledger/          # 회계 내역
│           └── {financeId}
└── notifications/            # 알림 (전역)
    └── {notificationId}
```

---

## 문서 타입 상세

### 1. users/{userId} (전역 프로필)

**타입**: `UserDoc` (정의 위치: `src/lib/firebase/types.ts`)

```typescript
{
  uid: string;                    // Firebase Auth UID
  realName: string;               // 실명
  nickname?: string | null;       // 닉네임
  phone?: string | null;          // 전화번호
  photoURL?: string | null;       // 프로필 사진 URL
  role: UserRole;                 // 'PRESIDENT' | 'DIRECTOR' | 'TREASURER' | 'ADMIN' | 'MEMBER'
  position?: string;              // 포지션 (예: 'P', 'C', '1B')
  backNumber?: string;            // 등번호
  status: 'pending' | 'active' | 'rejected' | 'withdrawn';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**샘플** (PENDING):
```json
{
  "uid": "user123",
  "realName": "홍길동",
  "nickname": "길동이",
  "phone": "010-1234-5678",
  "photoURL": null,
  "role": "MEMBER",
  "position": null,
  "backNumber": null,
  "status": "pending",
  "createdAt": "2024-12-18T01:00:00Z",
  "updatedAt": "2024-12-18T01:00:00Z"
}
```

**샘플** (ACTIVE):
```json
{
  "uid": "user456",
  "realName": "김철수",
  "nickname": "철수",
  "phone": "010-9876-5432",
  "photoURL": "https://storage.../profiles/user456.jpg",
  "role": "ADMIN",
  "position": "SS",
  "backNumber": "7",
  "status": "active",
  "createdAt": "2024-12-15T01:00:00Z",
  "updatedAt": "2024-12-17T01:00:00Z"
}
```

---

### 2. clubs/{clubId}/members/{userId} (멤버십)

**타입**: `UserDoc`와 동일한 구조 (중복 저장)

**목적**: 클럽별 멤버십 관리 (멀티 클럽 지원 가능성)

**참고**: `users/`와 `clubs/{clubId}/members/`는 동일한 데이터를 중복 저장 (동기화 필요)

---

### 3. clubs/{clubId}/posts/{postId} (게시글)

**타입**: `PostDoc` (정의 위치: `src/lib/firebase/types.ts`)

**공통 필드**:
```typescript
{
  id: string;
  type: PostType;                 // 'notice' | 'free' | 'event' | 'poll' | 'game' | 'album'
  title: string;
  content: string;
  authorId: string;               // 작성자 UID
  authorName: string;             // 작성자 실명
  authorPhotoURL?: string;        // 작성자 프로필 사진
  createdAt: Timestamp;
  updatedAt: Timestamp;
  pinned?: boolean;               // 고정 게시글
  likes?: string[];               // 좋아요한 사용자 UID 배열
}
```

**type === 'event' 필드**:
```typescript
{
  eventType?: 'PRACTICE' | 'GAME';
  startAt?: Timestamp | null;
  place?: string | null;
  opponent?: string | null;       // 상대팀 (경기인 경우)
  voteCloseAt?: Timestamp;        // 출석 투표 마감 시각 (startAt - 1일 23:00)
  voteClosed?: boolean;           // 마감 여부
}
```

**type === 'poll' 필드**:
```typescript
{
  choices?: Array<{
    id: string;
    label: string;
    votes: string[];              // 투표한 사용자 UID 배열
  }>;
  multi?: boolean;                // 복수 선택 허용
  anonymous?: boolean;            // 익명 투표
  closeAt?: Timestamp;            // 투표 마감일
  closed?: boolean;               // 마감 여부
}
```

**type === 'game' 필드** (eventType === 'GAME'인 경우 추가):
```typescript
{
  gameType?: 'LEAGUE' | 'PRACTICE';
  score?: { our: number; opp: number };
  recorders?: string[];           // 기록원 UID 배열
  recordersSnapshot?: Array<{     // 기록원 스냅샷 (스냅샷 시점 정보)
    userId: string;
    realName: string;
    position?: string;
    backNumber?: string;
  }>;
  recordingLocked?: boolean;      // 기록 잠금 여부
  recordingLockedAt?: Timestamp;  // 잠금 시각
  recordingLockedBy?: string;     // 잠금한 사용자 UID
  lastRecordUpdatedAt?: Timestamp;
  lastRecordUpdatedBy?: string;
}
```

**type === 'album' 필드**:
```typescript
{
  mediaUrls?: string[];           // 미디어 URL 배열
  mediaType?: 'photo' | 'video';
}
```

**type === 'notice' 필드**:
```typescript
{
  pushStatus?: 'SENT' | 'FAILED' | 'PENDING';  // 푸시 발송 상태
  pushSentAt?: Timestamp;
}
```

**샘플** (type === 'game', recordingLocked 포함):
```json
{
  "id": "post_game_001",
  "type": "event",
  "eventType": "GAME",
  "title": "vs 야구팀",
  "content": "정기 경기",
  "authorId": "user456",
  "authorName": "김철수",
  "authorPhotoURL": null,
  "startAt": "2024-12-20T14:00:00Z",
  "place": "야구장",
  "opponent": "야구팀",
  "voteCloseAt": "2024-12-19T14:00:00Z",
  "voteClosed": true,
  "recorders": ["user456", "user789"],
  "recordersSnapshot": [
    {
      "userId": "user456",
      "realName": "김철수",
      "position": "SS",
      "backNumber": "7"
    },
    {
      "userId": "user789",
      "realName": "박영희",
      "position": "C",
      "backNumber": "10"
    }
  ],
  "recordingLocked": true,
  "recordingLockedAt": "2024-12-20T18:00:00Z",
  "recordingLockedBy": "user456",
  "createdAt": "2024-12-18T01:00:00Z",
  "updatedAt": "2024-12-20T18:00:00Z",
  "pinned": false,
  "likes": []
}
```

---

### 4. clubs/{clubId}/posts/{postId}/comments/{commentId} (댓글)

**⚠️ 타입 누락**: `CommentDoc` 타입이 `types.ts`에 정의되지 않음 (TS2305 에러 원인)

**추정 구조** (firestore.service.ts 사용 패턴 기반):
```typescript
{
  id: string;
  postId: string;
  authorId: string;               // 작성자 UID
  authorName: string;             // 작성자 실명
  authorPhotoURL?: string | null; // 작성자 프로필 사진
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**샘플**:
```json
{
  "id": "comment_001",
  "postId": "post_game_001",
  "authorId": "user123",
  "authorName": "홍길동",
  "authorPhotoURL": null,
  "content": "경기 잘 봤습니다!",
  "createdAt": "2024-12-18T02:00:00Z",
  "updatedAt": "2024-12-18T02:00:00Z"
}
```

---

### 5. clubs/{clubId}/posts/{postId}/attendance/{userId} (출석 기록)

**⚠️ 타입 누락**: `AttendanceDoc` 타입이 `types.ts`에 정의되지 않음 (TS2305 에러 원인)

**추정 구조** (firestore.service.ts 사용 패턴 기반):
```typescript
{
  id: string;                     // userId와 동일
  postId: string;
  userId: string;
  userName: string;               // 사용자 실명
  status: 'attending' | 'absent' | 'maybe' | 'none';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**샘플**:
```json
{
  "id": "user123",
  "postId": "post_event_001",
  "userId": "user123",
  "userName": "홍길동",
  "status": "attending",
  "createdAt": "2024-12-18T01:00:00Z",
  "updatedAt": "2024-12-18T02:00:00Z"
}
```

---

### 6. clubs/{clubId}/posts/{postId}/record_lineup/{slotId} (라인업, WF-07)

**타입**: `LineupDoc` (정의 위치: `src/lib/firebase/types.ts`)

```typescript
{
  id: string;                     // slotId (예: 'slot_1', 'slot_2', ..., 'slot_9')
  gameId: string;
  order: number;                  // 1-9 (타순)
  memberId: string;               // 선수 UID
  memberName: string;             // 선수 실명
  position: string;               // 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'
  note?: string;
  updatedAt: Timestamp;
  updatedBy: string;              // 업데이트한 사용자 UID
}
```

**샘플**:
```json
{
  "id": "slot_1",
  "gameId": "post_game_001",
  "order": 1,
  "memberId": "user456",
  "memberName": "김철수",
  "position": "SS",
  "note": "리드오프",
  "updatedAt": "2024-12-20T13:00:00Z",
  "updatedBy": "user456"
}
```

---

### 7. clubs/{clubId}/posts/{postId}/record_batting/{playerId} (타자 기록, WF-07)

**타입**: `BatterRecordDoc` (정의 위치: `src/lib/firebase/types.ts`)

```typescript
{
  id: string;                     // playerId와 동일
  gameId: string;
  playerId: string;
  playerName: string;
  ab: number;                     // 타수
  h: number;                      // 안타
  rbi: number;                    // 타점
  r: number;                      // 득점
  bb: number;                     // 볼넷
  so: number;                     // 삼진
  note?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy?: string;
}
```

**샘플**:
```json
{
  "id": "user456",
  "gameId": "post_game_001",
  "playerId": "user456",
  "playerName": "김철수",
  "ab": 4,
  "h": 2,
  "rbi": 1,
  "r": 1,
  "bb": 0,
  "so": 1,
  "note": null,
  "createdAt": "2024-12-20T14:00:00Z",
  "updatedAt": "2024-12-20T17:30:00Z",
  "updatedBy": "user456"
}
```

---

### 8. clubs/{clubId}/posts/{postId}/record_pitching/{playerId} (투수 기록, WF-07)

**타입**: `PitcherRecordDoc` (정의 위치: `src/lib/firebase/types.ts`)

```typescript
{
  id: string;                     // playerId와 동일
  gameId: string;
  playerId: string;
  playerName: string;
  ipOuts: number;                 // 이닝(아웃카운트) - 1이닝 = 3
  pitches: number;                // 투구 수
  h: number;                      // 피안타
  r: number;                      // 실점
  er: number;                     // 자책점
  bb: number;                     // 볼넷
  k: number;                      // 삼진
  note?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy?: string;
}
```

**샘플**:
```json
{
  "id": "user789",
  "gameId": "post_game_001",
  "playerId": "user789",
  "playerName": "박영희",
  "ipOuts": 21,                   // 7이닝 (7 * 3 = 21)
  "pitches": 95,
  "h": 5,
  "r": 2,
  "er": 2,
  "bb": 2,
  "k": 8,
  "note": null,
  "createdAt": "2024-12-20T14:00:00Z",
  "updatedAt": "2024-12-20T17:45:00Z",
  "updatedBy": "user456"
}
```

---

### 9. clubs/{clubId}/ledger/{financeId} (회계 내역)

**⚠️ 타입 누락**: `FinanceDoc` 타입이 `types.ts`에 정의되지 않음 (TS2305 에러 원인)

**추정 구조** (firestore.service.ts, FinancePage.tsx 사용 패턴 기반):
```typescript
{
  id: string;
  clubId: string;
  type: 'income' | 'expense';
  category: 'dues' | 'event' | 'equipment' | 'other';
  amount: number;
  description: string;
  date: Timestamp;
  createdBy: string;              // 작성자 UID
  createdByName: string;          // 작성자 실명
  duesPaidBy?: string;            // 회비 납부자 UID (category === 'dues')
  duesPaidByName?: string;        // 회비 납부자 실명
  duesMonth?: string;             // 회비 납부 월 (예: '2024-12')
  createdAt: Timestamp;
}
```

**샘플**:
```json
{
  "id": "finance_001",
  "clubId": "default-club",
  "type": "income",
  "category": "dues",
  "amount": 50000,
  "description": "12월 회비",
  "date": "2024-12-01T00:00:00Z",
  "createdBy": "user456",
  "createdByName": "김철수",
  "duesPaidBy": "user123",
  "duesPaidByName": "홍길동",
  "duesMonth": "2024-12",
  "createdAt": "2024-12-01T01:00:00Z"
}
```

---

### 10. notifications/{notificationId} (알림)

**타입**: `NotificationDoc` (정의 위치: `src/lib/firebase/types.ts`)

```typescript
{
  id: string;
  userId: string;                 // 수신자 UID
  type: NotificationType;         // 'notice' | 'comment' | 'like' | 'event' | 'mention' | 'system'
  title: string;
  message: string;
  link?: string;                  // 링크 URL
  read: boolean;
  createdAt: Timestamp;
}
```

---

## TODO/누락

1. **타입 정의 추가 필요**:
   - `CommentDoc` → `src/lib/firebase/types.ts`에 추가
   - `AttendanceDoc` → `src/lib/firebase/types.ts`에 추가
   - `FinanceDoc` → `src/lib/firebase/types.ts`에 추가

2. **초대 코드 컬렉션**: `inviteCodes/`는 DEPRECATED (현재 정책에서는 선택 사항)

3. **멀티 클럽 지원**: 현재는 `default-club` 고정, 향후 확장 가능

