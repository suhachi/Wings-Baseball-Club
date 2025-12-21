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
const TEST_CLUB_ID = 'WINGS';
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
  /**
   * μATOM-0610: Member document missing -> Read Fail
   * 
   * 케이스: 로그인했지만 멤버 문서가 없는 사용자가 posts를 읽으려고 시도
   * 기대: 실패 (PERMISSION_DENIED)
   */
  test('μATOM-0610: Member doc missing -> Read Fail', async () => {
    const db = getFirestoreForUser(TEST_USER_NON_MEMBER);
    const postRef = doc(db, `clubs/${TEST_CLUB_ID}/posts/${TEST_POST_ID}`);

    await assertFails(getDoc(postRef));
  });

  /**
   * μATOM-0611: Member document exists (active) -> Read Success
   * 
   * 케이스: Active 멤버가 posts를 읽으려고 시도
   * 기대: 성공
   */
  test('μATOM-0611: Member doc exists (active) -> Read Success', async () => {
    const db = getFirestoreForUser(TEST_USER_ACTIVE);
    const postRef = doc(db, `clubs/${TEST_CLUB_ID}/posts/${TEST_POST_ID}`);

    await assertSucceeds(getDoc(postRef));
  });

  /**
   * μATOM-0615: Member Creation Rule
   * 
   * 케이스 1: 본인의 멤버 문서를 생성 (role=MEMBER, status=active)
   * 기대: 성공
   * 
   * 케이스 2: 본인의 멤버 문서를 생성하되 role=PRESIDENT
   * 기대: 실패
   */
  test('μATOM-0615: Member Creation Rule', async () => {
    const db = getFirestoreForUser('new-user');
    const memberRef = doc(db, `clubs/${TEST_CLUB_ID}/members/new-user`);

    // Case 1: Valid Creation
    await assertSucceeds(
      setDoc(memberRef, {
        uid: 'new-user',
        realName: 'New User',
        role: 'MEMBER',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    // Case 2: Invalid Role
    const dbHacker = getFirestoreForUser('hacker-user');
    const memberRefHacker = doc(dbHacker, `clubs/${TEST_CLUB_ID}/members/hacker-user`);

    await assertFails(
      setDoc(memberRefHacker, {
        uid: 'hacker-user',
        realName: 'Hacker',
        role: 'PRESIDENT', // Invalid
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  });
});


