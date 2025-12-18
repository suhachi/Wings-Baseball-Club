# 05. FIRESTORE SCHEMA SNAPSHOT
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA  
**목적**: Firestore 스키마 정합성 확인

---

## 🗂️ Firestore 컬렉션 구조

### 전체 데이터 모델
```
/
├── users/{userId}
│   ├── uid: string
│   ├── realName: string
│   ├── status: 'pending' | 'active' | 'rejected' | 'withdrawn'
│   ├── role: UserRole
│   └── ...
│
├── inviteCodes/{code}
│   ├── code: string
│   ├── clubId: string
│   ├── role: UserRole
│   ├── isUsed: boolean
│   └── ...
│
├── clubs/{clubId}
│   ├── (club doc 정보 - 미정의)
│   │
│   ├── members/{memberId}
│   │   ├── uid: string (= memberId)
│   │   ├── status: 'pending' | 'active' | 'rejected' | 'withdrawn'
│   │   ├── role: UserRole
│   │   ├── realName: string
│   │   ├── position?: string
│   │   ├── backNumber?: string
│   │   └── ...
│   │
│   ├── posts/{postId}
│   │   ├── id: string
│   │   ├── type: PostType
│   │   ├── title: string
│   │   ├── content: string
│   │   ├── authorId: string  ← ✅ authorId (not author.id)
│   │   ├── authorName: string
│   │   ├── authorPhotoURL?: string
│   │   ├── createdAt: Date
│   │   ├── updatedAt: Date
│   │   │
│   │   ├── # Event specific
│   │   ├── eventType?: 'PRACTICE' | 'GAME'
│   │   ├── startAt?: Date
│   │   ├── place?: string
│   │   ├── opponent?: string
│   │   ├── voteCloseAt?: Date
│   │   ├── voteClosed?: boolean
│   │   │
│   │   ├── # Game specific
│   │   ├── gameType?: 'LEAGUE' | 'PRACTICE'
│   │   ├── score?: { our: number; opp: number }
│   │   ├── recorders?: string[]  ← User IDs (admin 관리)
│   │   ├── recordersSnapshot?: Array<{userId, realName, position?, backNumber?}>
│   │   ├── recordingLocked?: boolean
│   │   ├── recordingLockedAt?: Date
│   │   ├── recordingLockedBy?: string
│   │   │
│   │   ├── # Poll specific
│   │   ├── choices?: Array<{id, label, votes: string[]}>
│   │   ├── multi?: boolean
│   │   ├── anonymous?: boolean
│   │   ├── closeAt?: Date
│   │   ├── closed?: boolean
│   │   │
│   │   ├── # Album specific
│   │   ├── mediaUrls?: string[]
│   │   ├── mediaType?: 'photo' | 'video'
│   │   ├── likes?: string[]  ← User IDs
│   │   │
│   │   ├── attendance/{docId}  ← Subcollection
│   │   │   ├── userId: string
│   │   │   ├── userName: string
│   │   │   ├── status: 'attending' | 'absent' | 'maybe' | 'none'
│   │   │   ├── updatedAt: Date
│   │   │   └── ...
│   │   │
│   │   ├── comments/{commentId}  ← Subcollection
│   │   │   ├── id: string
│   │   │   ├── postId: string (redundancy)
│   │   │   ├── content: string
│   │   │   ├── authorId: string  ← ✅ authorId (not author.id)
│   │   │   ├── authorName: string
│   │   │   ├── authorPhotoURL?: string
│   │   │   ├── createdAt: Date
│   │   │   ├── updatedAt: Date
│   │   │   └── deleted?: boolean
│   │   │
│   │   ├── record_lineup/{slotId}  ← Subcollection (Game Records)
│   │   │   ├── id: string
│   │   │   ├── gameId: string
│   │   │   ├── order: number (1-9)
│   │   │   ├── memberId: string
│   │   │   ├── memberName: string
│   │   │   ├── position: string
│   │   │   ├── note?: string
│   │   │   └── updatedAt: Date
│   │   │
│   │   ├── record_batting/{docId}
│   │   │   ├── id: string
│   │   │   ├── gameId: string
│   │   │   ├── playerId: string
│   │   │   ├── playerName: string
│   │   │   ├── ab: number (타수)
│   │   │   ├── h: number (안타)
│   │   │   ├── rbi: number (타점)
│   │   │   ├── r: number (득점)
│   │   │   ├── bb: number (볼넷)
│   │   │   ├── so: number (삼진)
│   │   │   ├── note?: string
│   │   │   ├── createdAt: Date
│   │   │   ├── updatedAt: Date
│   │   │   └── updatedBy?: string
│   │   │
│   │   └── record_pitching/{docId}
│   │       ├── id: string
│   │       ├── gameId: string
│   │       ├── playerId: string
│   │       ├── playerName: string
│   │       ├── ipOuts: number (이닝, 아웃카운트)
│   │       ├── pitches: number (투구 수)
│   │       ├── h: number (피안타)
│   │       ├── r: number (실점)
│   │       ├── er: number (자책)
│   │       ├── bb: number (볼넷)
│   │       ├── k: number (삼진)
│   │       ├── note?: string
│   │       ├── createdAt: Date
│   │       ├── updatedAt: Date
│   │       └── updatedBy?: string
│   │
│   ├── notices/{noticeId}
│   │   ├── id: string
│   │   ├── title: string
│   │   ├── content: string
│   │   ├── createdAt: Date
│   │   ├── updatedAt: Date
│   │   └── ...
│   │
│   ├── finance/{financeId}  ← 회비/회계 (추정)
│   │   ├── type: 'income' | 'expense'
│   │   ├── category: 'dues' | 'event' | 'equipment' | 'other'
│   │   ├── amount: number
│   │   ├── description: string
│   │   ├── date: Date
│   │   ├── createdBy: string
│   │   ├── createdByName: string
│   │   └── ...
│   │
│   └── (other subcollections)
│
└── notifications/{notificationId}
    ├── userId: string
    ├── type: NotificationType
    ├── title: string
    ├── message: string
    ├── read: boolean
    ├── createdAt: Date
    └── ...
```

---

## 📋 핵심 문서 스키마 (테이블 형식)

### 1. UserDoc (Global)
| 필드 | 타입 | 필수 | 설명 |
|-----|------|------|------|
| uid | string | ✅ | Firebase Auth UID |
| realName | string | ✅ | 실명 |
| nickname | string \| null | ❌ | 별명 |
| phone | string \| null | ❌ | 전화번호 |
| photoURL | string \| null | ❌ | 프로필 사진 |
| role | UserRole | ✅ | 'PRESIDENT' \| 'DIRECTOR' \| 'TREASURER' \| 'ADMIN' \| 'MEMBER' |
| position | string | ❌ | 포지션 |
| backNumber | string | ❌ | 등번호 |
| status | string | ✅ | 'pending' \| 'active' \| 'rejected' \| 'withdrawn' |
| createdAt | Date | ✅ | 생성 시간 |
| updatedAt | Date | ✅ | 수정 시간 |

### 2. Member (clubs/{clubId}/members/{memberId})
| 필드 | 타입 | 필수 | 설명 |
|-----|------|------|------|
| uid | string | ✅ | Member ID (= Firebase UID) |
| status | string | ✅ | 'pending' \| 'active' \| 'rejected' \| 'withdrawn' |
| role | UserRole | ✅ | 동일한 역할 정의 |
| realName | string | ✅ | 실명 |
| nickname | string \| null | ❌ | 별명 |
| position | string | ❌ | 포지션 |
| backNumber | string | ❌ | 등번호 |
| photoURL | string \| null | ❌ | 프로필 사진 |
| createdAt | Date | ✅ | 멤버 생성 시간 |
| updatedAt | Date | ✅ | 멤버 수정 시간 |

**주의**: users/{uid} 와 clubs/{clubId}/members/{uid} 두 곳 모두 존재

### 3. PostDoc (clubs/{clubId}/posts/{postId})
| 필드 | 타입 | 필수 | 설명 | 예시 |
|-----|------|------|------|------|
| id | string | ✅ | Post ID | "post-abc123" |
| type | PostType | ✅ | 'notice' \| 'free' \| 'event' \| 'meetup' \| 'poll' \| 'game' \| 'album' | "event" |
| title | string | ✅ | 제목 | "2025년 1월 경기" |
| content | string | ✅ | 본문 | "장소: 잠실야구장..." |
| **authorId** | string | ✅ | 작성자 ID (User UID) | "[USER-ID-HASH-1]" |
| authorName | string | ✅ | 작성자명 | "[MEMBER-NAME]" |
| authorPhotoURL | string \| null | ❌ | 작성자 사진 | "https://..." |
| createdAt | Date | ✅ | 생성 시간 | 2025-12-18 |
| updatedAt | Date | ✅ | 수정 시간 | 2025-12-18 |
| pinned | boolean | ❌ | 고정 여부 | false |
| **eventType** | string | ❌ | 'PRACTICE' \| 'GAME' | "GAME" |
| **startAt** | Date \| null | ❌ | 시작 시간 | 2025-01-05 14:00 |
| **place** | string \| null | ❌ | 장소 | "잠실야구장" |
| **opponent** | string \| null | ❌ | 상대팀 | "한나팀" |
| **gameType** | string | ❌ | 'LEAGUE' \| 'PRACTICE' | "LEAGUE" |
| **score** | {our, opp} | ❌ | 점수 | {our: 5, opp: 3} |
| **recorders** | string[] | ❌ | 기록원 ID 목록 | ["[USER-ID-HASH-1]", "[USER-ID-HASH-2]"] |
| **recordersSnapshot** | Array | ❌ | 기록원 스냅샷 (변경 감지 용) | [{userId, realName, position?, backNumber?}] |
| **recordingLocked** | boolean | ❌ | 기록 잠금 여부 | true |
| **recordingLockedAt** | Date | ❌ | 잠금 시간 | 2025-01-05 19:00 |
| **recordingLockedBy** | string | ❌ | 잠금 관리자 ID | "[USER-ID-HASH]" |
| likes | string[] | ❌ | 좋아요 User ID 배열 | ["[USER-ID-HASH]"] |

### 4. CommentDoc (clubs/{clubId}/posts/{postId}/comments/{commentId})
| 필드 | 타입 | 필수 | 설명 |
|-----|------|------|------|
| id | string | ✅ | Comment ID |
| postId | string | ✅ | 게시글 ID (redundancy) |
| content | string | ✅ | 댓글 내용 |
| **authorId** | string | ✅ | 작성자 ID (User UID) |
| authorName | string | ✅ | 작성자명 |
| authorPhotoURL | string \| null | ❌ | 작성자 사진 |
| createdAt | Date | ✅ | 생성 시간 |
| updatedAt | Date | ✅ | 수정 시간 |
| deleted | boolean | ❌ | 삭제 표시 |

### 5. Record 문서 (BatterRecordDoc, PitcherRecordDoc)

#### BatterRecordDoc (clubs/{clubId}/posts/{postId}/record_batting/{docId})
| 필드 | 타입 | 설명 | 단위 |
|-----|------|------|------|
| id | string | Document ID (= playerId) |  |
| gameId | string | 경기 ID |  |
| playerId | string | Player ID |  |
| playerName | string | 선수명 |  |
| ab | number | 타수 | 횟수 |
| h | number | 안타 | 횟수 |
| rbi | number | 타점 | 점수 |
| r | number | 득점 | 점수 |
| bb | number | 볼넷 | 횟수 |
| so | number | 삼진 | 횟수 |
| note | string | 비고 |  |
| createdAt | Date | 생성 시간 |  |
| updatedAt | Date | 수정 시간 |  |

#### PitcherRecordDoc (clubs/{clubId}/posts/{postId}/record_pitching/{docId})
| 필드 | 타입 | 설명 | 단위 |
|-----|------|------|------|
| id | string | Document ID (= playerId) |  |
| gameId | string | 경기 ID |  |
| playerId | string | Player ID |  |
| playerName | string | 선수명 |  |
| ipOuts | number | 이닝 (아웃카운트) | 1이닝=3 |
| pitches | number | 투구 수 | 횟수 |
| h | number | 피안타 | 횟수 |
| r | number | 실점 | 점수 |
| er | number | 자책 | 점수 |
| bb | number | 볼넷 | 횟수 |
| k | number | 삼진 | 횟수 |
| note | string | 비고 |  |
| createdAt | Date | 생성 시간 |  |
| updatedAt | Date | 수정 시간 |  |

---

## ✅ authorId vs author.id 혼용 여부 체크

### 코드 검증

#### (1) Types 정의 (src/lib/firebase/types.ts)
```typescript
// PostDoc, CommentDoc 정의
authorId: string;  ← ✅ authorId (필드명)
authorName: string;
```

**결론**: ✅ **authorId 사용** (author.id 미사용)

#### (2) Firestore Rules (firestore.rules, 라인 63~92)
```typescript
// Line 63: isPostAuthor
function isPostAuthor() {
  return resource.data.authorId == request.auth.uid;  ← ✅ authorId
}

// Line 108: comment delete
allow update, delete: if isActiveMember(clubId) && (
  resource.data.authorId == request.auth.uid || isAdminLike(clubId)  ← ✅ authorId
);
```

**결론**: ✅ **Rules도 authorId 사용**

#### (3) DataContext (src/app/contexts/DataContext.tsx)
**코드 스니펫** (라인 ~440):
```typescript
const newCommentData = {
  content,
  authorId: user.id,  ← ✅ authorId
  authorName: user.realName,
  authorPhotoURL: user.photoURL,
};
```

**결론**: ✅ **DataContext도 authorId 사용**

#### (4) CommentList 렌더링 (src/app/components/CommentList.tsx, 라인 ~50)
```typescript
const author = members.find(u => u.id === comment.author.id);  ← ❌ comment.author.id
```

**여기서 문제 발견!**

실제로는:
```typescript
comment.authorId  // ✅ 정의된 필드명
// vs
comment.author.id  // ❌ 중첩 객체 접근 (존재하지 않음)
```

### 결론: **부분적 혼용 발견** ⚠️

| 파일 | 필드명 | 상태 | 라인 |
|-----|--------|------|------|
| types.ts | authorId | ✅ 올바름 | 107 |
| firestore.rules | authorId | ✅ 올바름 | 63, 108 |
| DataContext.tsx | authorId | ✅ 올바름 | 440 |
| CommentList.tsx | comment.author.id | ❌ 오류 | 50 |

**영향**: CommentList에서 author 객체를 찾지 못해 "Unknown" 표시 가능

---

## 🔄 스키마 정합성 요약

| 검사 항목 | 상태 | 평가 |
|----------|------|------|
| **컬렉션 구조** | ✅ 일관됨 | clubs/{clubId} 중심 설계 |
| **필드명 일관성** | ⚠️ 부분 오류 | authorId vs author.id 혼용 |
| **타입 정의** | ✅ 완벽 | types.ts 모두 정의됨 |
| **Rules 일관성** | ✅ 일관됨 | authorId 기반 검증 |
| **Timestamp 처리** | ✅ 일관됨 | Date → Timestamp 변환 구현 |
| **Subcollection 구조** | ✅ 명확 | record_*, attendance, comments 명확 |

---

## 📌 스키마 수정 필요 사항

### Issue: CommentList.tsx의 author 필드 접근
**파일**: `src/app/components/CommentList.tsx` (라인 50)  
**현재**:
```typescript
const author = members.find(u => u.id === comment.author.id);  // ❌ author.id 미존재
```

**수정**:
```typescript
const author = members.find(u => u.id === comment.authorId);  // ✅ authorId 사용
```

**영향**: 댓글 작성자 이름이 제대로 표시될 수 있음 (Issue A 관련)

---

## ✅ 스키마 점검 체크리스트

- [x] 컬렉션 구조 명확화 (clubs/{clubId} 중심)
- [x] PostDoc 스키마 검증 (authorId 확인)
- [x] CommentDoc 스키마 검증 (authorId 확인, **혼용 발견**)
- [x] RecordDoc 스키마 검증 (BatterRecordDoc, PitcherRecordDoc)
- [x] Rules와 코드 정합성 확인
- [ ] 실제 Firestore Console에서 샘플 문서 확인 (미실행)
- [ ] author.id → authorId 혼용 수정 (09번 패치 플랜에 포함)
