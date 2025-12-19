# 93. Full Source Dump: tests/

**Generated**: 2025-12-19T07:20:34.683Z

## FILE: tests\e2e\E2E_CHECKLIST.md
```md
# E2E 체크리스트

## μATOM-0611~0616: 수동 E2E 체크리스트

각 시나리오는 수동으로 테스트하고 결과를 기록합니다.

---

## μATOM-0611: 로그인 → Access Gate → 홈 화면

**시나리오:**
1. 비로그인 상태에서 앱 접근
2. Google 로그인 수행
3. Access Gate 확인 (members/{uid} 존재 체크)
4. 홈 화면 표시 확인

**기대 화면/로그:**
- 비로그인: LoginPage 표시
- 로그인 후: "접근 권한 확인 중..." 로딩 화면
- Access Gate 통과: HomePage 표시
- Access Gate 실패: AccessDeniedPage 표시

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 에러 로그 확인
3. Network 탭에서 Firestore 요청 확인
4. Application 탭에서 Firebase Auth 상태 확인

**체크리스트:**
- [ ] 비로그인 시 LoginPage 표시
- [ ] Google 로그인 성공
- [ ] Access Gate 확인 중 로딩 화면 표시
- [ ] members/{uid} 존재 시 홈 화면 표시
- [ ] members/{uid} 없을 시 AccessDeniedPage 표시
- [ ] status !== 'active' 시 AccessDeniedPage 표시

**결과:** PASS / FAIL

---

## μATOM-0612: 게시판 탭 전환 및 게시글 목록 표시

**시나리오:**
1. 홈 화면에서 게시판 탭 클릭
2. 공지/자유/연습·시합 탭 전환
3. 각 탭별 게시글 목록 표시 확인

**기대 화면/로그:**
- 게시판 탭: BoardsPage 표시
- 공지 탭: type='notice' 게시글만 표시, pinned 우선 정렬
- 자유 탭: type='free' 게시글만 표시, 최신순 정렬
- 연습·시합 탭: type='event' 게시글만 표시, startAt 기준 정렬

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 Firestore 쿼리 로그 확인
3. Network 탭에서 Firestore read 요청 확인
4. React DevTools에서 DataContext 상태 확인

**체크리스트:**
- [ ] 게시판 탭 클릭 시 BoardsPage 표시
- [ ] 공지 탭: notice 게시글만 표시, pinned 우선
- [ ] 자유 탭: free 게시글만 표시, 최신순
- [ ] 연습·시합 탭: event 게시글만 표시, startAt 기준 정렬
- [ ] 빈 게시글 목록 시 EmptyState 표시

**결과:** PASS / FAIL

---

## μATOM-0613: 이벤트 상세 → 출석 투표

**시나리오:**
1. 연습·시합 탭에서 이벤트 게시글 클릭
2. 이벤트 상세 모달 표시 (메타 정보 확인)
3. 출석 투표 버튼 클릭 (참석/불참/미정)
4. 투표 결과 반영 확인

**기대 화면/로그:**
- 이벤트 상세: startAt, place, opponent, voteCloseAt 표시
- 출석 집계: 참석/불참/미정 카운트 표시
- 내 상태: 현재 투표 상태 표시
- 투표 버튼: 참석/불참/미정 3개 버튼
- 투표 후: 즉시 집계 반영

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 updateAttendance 호출 로그 확인
3. Network 탭에서 Firestore write 요청 확인
4. Firestore Rules 에러 확인

**체크리스트:**
- [ ] 이벤트 상세 모달 표시
- [ ] 메타 정보 표시 (startAt, place, opponent, voteCloseAt)
- [ ] 출석 집계 표시 (참석/불참/미정)
- [ ] 내 상태 표시
- [ ] 참석 버튼 클릭 시 상태 변경
- [ ] 불참 버튼 클릭 시 상태 변경
- [ ] 미정 버튼 클릭 시 상태 변경
- [ ] 투표 후 집계 즉시 반영

**결과:** PASS / FAIL

---

## μATOM-0614: 관리자 공지 작성 + 푸시 발송

**시나리오:**
1. 관리자 계정으로 로그인
2. 게시판 → 공지 탭 → 글쓰기 버튼 클릭
3. CreateNoticeModal에서 공지 작성
4. createNoticeWithPush callable 호출
5. 푸시 발송 상태 확인

**기대 화면/로그:**
- 관리자만 공지 작성 버튼 표시
- CreateNoticeModal 표시
- 공지 작성 후: 게시글 생성 + 푸시 발송
- 공지 상세: pushStatus 배지 표시 (SENT/FAILED)

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 createNoticeWithPush 호출 로그 확인
3. Network 탭에서 Functions 호출 확인
4. Functions 로그 확인 (firebase functions:log)

**체크리스트:**
- [ ] 관리자만 공지 작성 버튼 표시
- [ ] CreateNoticeModal 표시
- [ ] 공지 작성 성공
- [ ] createNoticeWithPush callable 호출 성공
- [ ] 푸시 발송 상태 기록 (pushStatus)
- [ ] 공지 상세에서 pushStatus 배지 표시
- [ ] 푸시 발송 실패 시 pushError 표시

**결과:** PASS / FAIL

---

## μATOM-0615: 관리자 이벤트 작성 + voteCloseAt 계산

**시나리오:**
1. 관리자 계정으로 로그인
2. 게시판 → 연습·시합 탭 → 글쓰기 버튼 클릭
3. CreatePostModal에서 이벤트 작성 (eventType, startAt, place 입력)
4. createEventPost callable 호출
5. voteCloseAt 계산 결과 확인

**기대 화면/로그:**
- 관리자만 이벤트 작성 버튼 표시
- CreatePostModal에서 이벤트 작성 UI 표시
- 이벤트 작성 후: 게시글 생성 + voteCloseAt 계산 (전날 23:00 KST)
- 이벤트 상세: voteCloseAt 표시

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 createEventPost 호출 로그 확인
3. Network 탭에서 Functions 호출 확인
4. Functions 로그에서 voteCloseAt 계산 값 확인

**체크리스트:**
- [ ] 관리자만 이벤트 작성 버튼 표시
- [ ] CreatePostModal에서 이벤트 작성 UI 표시
- [ ] 이벤트 작성 성공
- [ ] createEventPost callable 호출 성공
- [ ] voteCloseAt 계산 정확 (전날 23:00 KST)
- [ ] 이벤트 상세에서 voteCloseAt 표시
- [ ] voteClosed=false 초기화

**결과:** PASS / FAIL

---

## μATOM-0616: FCM 토큰 등록 + 푸시 수신

**시나리오:**
1. 로그인 후 내정보 페이지 접근
2. 알림 권한 요청
3. FCM 토큰 등록
4. 공지 작성 시 푸시 수신 확인

**기대 화면/로그:**
- 내정보 페이지: 푸시 알림 상태 표시
- 권한 요청: 브라우저 알림 권한 요청 다이얼로그
- 토큰 등록: registerFcmToken callable 호출 성공
- 푸시 수신: 브라우저 알림 표시

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 FCM 토큰 등록 로그 확인
3. Application 탭에서 Service Worker 상태 확인
4. Network 탭에서 registerFcmToken 호출 확인

**체크리스트:**
- [ ] 내정보 페이지에서 푸시 알림 상태 표시
- [ ] 알림 권한 요청 성공
- [ ] FCM 토큰 등록 성공
- [ ] 토큰 재등록 버튼 동작
- [ ] 공지 작성 시 푸시 수신
- [ ] Background 메시지 수신 (Service Worker)

**결과:** PASS / FAIL

---

## E2E 테스트 결과 요약

| 시나리오 | 결과 | 비고 |
|---------|------|------|
| μATOM-0611: 로그인 → Access Gate | - | - |
| μATOM-0612: 게시판 탭 전환 | - | - |
| μATOM-0613: 이벤트 상세 → 출석 투표 | - | - |
| μATOM-0614: 관리자 공지 작성 + 푸시 | - | - |
| μATOM-0615: 관리자 이벤트 작성 | - | - |
| μATOM-0616: FCM 토큰 등록 + 푸시 수신 | - | - |

**전체 결과:** PASS / FAIL



```

## FILE: tests\rules\firestore.rules.test.ts
```ts
/**
 * Firestore Rules 테스트
 * 
 * μATOM-0601: Emulator Rules 테스트 환경 구성
 * μATOM-0602~0609: Rules 최소 8케이스 테스트
 * 
 * 실행 방법:
 * 1. Firebase Emulator 시작: firebase emulators:start --only firestore,auth
 * 2. 테스트 실행: npm run test:rules (또는 직접 실행)
 * 
 * 의존성:
 * - @firebase/rules-unit-testing
 * - firebase-admin (테스트 데이터 설정용)
 */

import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { getFirestore, setDoc, doc, getDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// 테스트 환경 초기화
let testEnv: any;
let adminDb: admin.firestore.Firestore;

// 테스트 데이터
const TEST_CLUB_ID = 'default-club';
const TEST_USER_ACTIVE = 'test-user-active';
const TEST_USER_INACTIVE = 'test-user-inactive';
const TEST_USER_NON_MEMBER = 'test-user-non-member';
const TEST_USER_ADMIN = 'test-user-admin';
const TEST_POST_ID = 'test-post-id';
const TEST_COMMENT_ID = 'test-comment-id';

beforeAll(async () => {
  // μATOM-0601: Emulator Rules 테스트 환경 구성
  const rulesPath = path.join(__dirname, '../../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: 'wings-baseball-club-test',
    firestore: {
      rules: rulesContent,
      host: 'localhost',
      port: 8080,
    },
    hub: {
      host: 'localhost',
      port: 4400,
    },
  });

  // Admin SDK 초기화 (테스트 데이터 설정용)
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'wings-baseball-club-test',
      credential: admin.credential.applicationDefault(),
    });
  }
  adminDb = admin.firestore();
  // Emulator 사용 설정
  adminDb.settings({
    host: 'localhost:8080',
    ssl: false,
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

// 테스트 데이터 설정 헬퍼
async function setupTestData() {
  // Active 멤버
  await adminDb.collection('clubs').doc(TEST_CLUB_ID).collection('members').doc(TEST_USER_ACTIVE).set({
    uid: TEST_USER_ACTIVE,
    realName: 'Active User',
    role: 'MEMBER',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Inactive 멤버
  await adminDb.collection('clubs').doc(TEST_CLUB_ID).collection('members').doc(TEST_USER_INACTIVE).set({
    uid: TEST_USER_INACTIVE,
    realName: 'Inactive User',
    role: 'MEMBER',
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Admin 멤버
  await adminDb.collection('clubs').doc(TEST_CLUB_ID).collection('members').doc(TEST_USER_ADMIN).set({
    uid: TEST_USER_ADMIN,
    realName: 'Admin User',
    role: 'ADMIN',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Free 게시글 (작성자: TEST_USER_ACTIVE)
  await adminDb.collection('clubs').doc(TEST_CLUB_ID).collection('posts').doc(TEST_POST_ID).set({
    type: 'free',
    title: 'Test Post',
    content: 'Test Content',
    authorId: TEST_USER_ACTIVE,
    authorName: 'Active User',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Event 게시글 (voteClosed=false)
  await adminDb.collection('clubs').doc(TEST_CLUB_ID).collection('posts').doc('test-event-open').set({
    type: 'event',
    title: 'Test Event',
    content: 'Test Event Content',
    authorId: TEST_USER_ADMIN,
    authorName: 'Admin User',
    eventType: 'PRACTICE',
    startAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000)), // 내일
    voteCloseAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 3600000)), // 1시간 후
    voteClosed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Event 게시글 (voteClosed=true)
  await adminDb.collection('clubs').doc(TEST_CLUB_ID).collection('posts').doc('test-event-closed').set({
    type: 'event',
    title: 'Test Event Closed',
    content: 'Test Event Content',
    authorId: TEST_USER_ADMIN,
    authorName: 'Admin User',
    eventType: 'PRACTICE',
    startAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000)), // 어제
    voteCloseAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1시간 전
    voteClosed: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 댓글 (작성자: TEST_USER_ACTIVE)
  await adminDb.collection('clubs').doc(TEST_CLUB_ID).collection('posts').doc(TEST_POST_ID).collection('comments').doc(TEST_COMMENT_ID).set({
    postId: TEST_POST_ID,
    content: 'Test Comment',
    authorId: TEST_USER_ACTIVE,
    authorName: 'Active User',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// 테스트 사용자 인증 헬퍼
function getFirestoreForUser(uid: string) {
  return testEnv.authenticatedContext(uid, {}).firestore();
}

function getFirestoreForUnauthenticated() {
  return testEnv.unauthenticatedContext().firestore();
}

describe('Firestore Rules Tests', () => {
  beforeEach(async () => {
    await setupTestData();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  /**
   * μATOM-0602: 비멤버 read 차단
   * 
   * 케이스: 비멤버가 posts를 읽으려고 시도
   * 기대: 실패 (PERMISSION_DENIED)
   */
  test('μATOM-0602: 비멤버 read 차단', async () => {
    const db = getFirestoreForUnauthenticated();
    const postRef = doc(db, `clubs/${TEST_CLUB_ID}/posts/${TEST_POST_ID}`);

    await assertFails(getDoc(postRef));
  });

  /**
   * μATOM-0603: inactive 차단
   * 
   * 케이스: inactive 멤버가 posts를 읽으려고 시도
   * 기대: 실패 (PERMISSION_DENIED)
   */
  test('μATOM-0603: inactive 차단', async () => {
    const db = getFirestoreForUser(TEST_USER_INACTIVE);
    const postRef = doc(db, `clubs/${TEST_CLUB_ID}/posts/${TEST_POST_ID}`);

    await assertFails(getDoc(postRef));
  });

  /**
   * μATOM-0604: notice 클라 write 차단
   * 
   * 케이스: active 멤버가 notice 타입 게시글을 생성하려고 시도
   * 기대: 실패 (PERMISSION_DENIED)
   */
  test('μATOM-0604: notice 클라 write 차단', async () => {
    const db = getFirestoreForUser(TEST_USER_ACTIVE);
    const postsCol = collection(db, `clubs/${TEST_CLUB_ID}/posts`);

    await assertFails(
      addDoc(postsCol, {
        type: 'notice',
        title: 'Test Notice',
        content: 'Test Content',
        authorId: TEST_USER_ACTIVE,
        authorName: 'Active User',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  });

  /**
   * μATOM-0605: event 클라 write 차단
   * 
   * 케이스: active 멤버가 event 타입 게시글을 생성하려고 시도
   * 기대: 실패 (PERMISSION_DENIED)
   */
  test('μATOM-0605: event 클라 write 차단', async () => {
    const db = getFirestoreForUser(TEST_USER_ACTIVE);
    const postsCol = collection(db, `clubs/${TEST_CLUB_ID}/posts`);

    await assertFails(
      addDoc(postsCol, {
        type: 'event',
        title: 'Test Event',
        content: 'Test Content',
        authorId: TEST_USER_ACTIVE,
        authorName: 'Active User',
        eventType: 'PRACTICE',
        startAt: new Date(),
        voteClosed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  });

  /**
   * μATOM-0606: free 작성자만 update/delete
   * 
   * 케이스 1: 작성자가 아닌 사용자가 free 게시글을 수정하려고 시도
   * 기대: 실패 (PERMISSION_DENIED)
   * 
   * 케이스 2: 작성자가 free 게시글을 수정하려고 시도
   * 기대: 성공
   */
  test('μATOM-0606: free 작성자만 update/delete', async () => {
    const dbOther = getFirestoreForUser(TEST_USER_INACTIVE);
    const postRefOther = doc(dbOther, `clubs/${TEST_CLUB_ID}/posts/${TEST_POST_ID}`);

    // 작성자가 아닌 사용자는 수정 불가
    await assertFails(
      updateDoc(postRefOther, {
        title: 'Modified Title',
        updatedAt: new Date(),
      })
    );

    // 작성자는 수정 가능
    const dbAuthor = getFirestoreForUser(TEST_USER_ACTIVE);
    const postRefAuthor = doc(dbAuthor, `clubs/${TEST_CLUB_ID}/posts/${TEST_POST_ID}`);

    await assertSucceeds(
      updateDoc(postRefAuthor, {
        title: 'Modified Title',
        updatedAt: new Date(),
      })
    );
  });

  /**
   * μATOM-0607: comments 작성자만 update/delete
   * 
   * 케이스 1: 작성자가 아닌 사용자가 댓글을 수정하려고 시도
   * 기대: 실패 (PERMISSION_DENIED)
   * 
   * 케이스 2: 작성자가 댓글을 수정하려고 시도
   * 기대: 성공
   */
  test('μATOM-0607: comments 작성자만 update/delete', async () => {
    const dbOther = getFirestoreForUser(TEST_USER_INACTIVE);
    const commentRefOther = doc(dbOther, `clubs/${TEST_CLUB_ID}/posts/${TEST_POST_ID}/comments/${TEST_COMMENT_ID}`);

    // 작성자가 아닌 사용자는 수정 불가
    await assertFails(
      updateDoc(commentRefOther, {
        content: 'Modified Comment',
        updatedAt: new Date(),
      })
    );

    // 작성자는 수정 가능
    const dbAuthor = getFirestoreForUser(TEST_USER_ACTIVE);
    const commentRefAuthor = doc(dbAuthor, `clubs/${TEST_CLUB_ID}/posts/${TEST_POST_ID}/comments/${TEST_COMMENT_ID}`);

    await assertSucceeds(
      updateDoc(commentRefAuthor, {
        content: 'Modified Comment',
        updatedAt: new Date(),
      })
    );
  });

  /**
   * μATOM-0608: attendance 본인만 write
   * 
   * 케이스 1: 다른 사용자의 attendance를 수정하려고 시도
   * 기대: 실패 (PERMISSION_DENIED)
   * 
   * 케이스 2: 본인의 attendance를 수정하려고 시도
   * 기대: 성공
   */
  test('μATOM-0608: attendance 본인만 write', async () => {
    const dbOther = getFirestoreForUser(TEST_USER_INACTIVE);
    const attendanceRefOther = doc(dbOther, `clubs/${TEST_CLUB_ID}/posts/test-event-open/attendance/${TEST_USER_ACTIVE}`);

    // 다른 사용자의 attendance는 수정 불가
    await assertFails(
      setDoc(attendanceRefOther, {
        status: 'attending',
        updatedAt: new Date(),
      })
    );

    // 본인의 attendance는 수정 가능
    const dbSelf = getFirestoreForUser(TEST_USER_ACTIVE);
    const attendanceRefSelf = doc(dbSelf, `clubs/${TEST_CLUB_ID}/posts/test-event-open/attendance/${TEST_USER_ACTIVE}`);

    await assertSucceeds(
      setDoc(attendanceRefSelf, {
        status: 'attending',
        updatedAt: new Date(),
      })
    );
  });

  /**
   * μATOM-0609: voteClosed 이후 attendance write 차단
   * 
   * 케이스: voteClosed=true인 이벤트의 attendance를 수정하려고 시도
   * 기대: 실패 (PERMISSION_DENIED)
   */
  test('μATOM-0609: voteClosed 이후 attendance write 차단', async () => {
    const db = getFirestoreForUser(TEST_USER_ACTIVE);
    const attendanceRef = doc(db, `clubs/${TEST_CLUB_ID}/posts/test-event-closed/attendance/${TEST_USER_ACTIVE}`);

    // voteClosed=true인 이벤트는 attendance 수정 불가
    await assertFails(
      setDoc(attendanceRef, {
        status: 'attending',
        updatedAt: new Date(),
      })
    );
  });
});


```

## FILE: tests\setup.ts
```ts
/**
 * Jest 테스트 설정
 * 
 * μATOM-0601: Emulator Rules 테스트 환경 구성
 */

// Firebase Admin 초기화는 각 테스트 파일에서 수행
// 여기서는 전역 설정만 수행

export {};



```

