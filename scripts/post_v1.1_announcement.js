/**
 * post_v1.1_announcement.js
 * 
 * Wings Baseball Club v1.1 업데이트 내역을 공지사항으로 등록하는 스크립트입니다.
 * 
 * [실행 방법]
 * 1. 서비스 계정 키 파일(serviceAccountKey.json)을 루트 디렉토리에 위치시킵니다.
 *    (Firebase Console > 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성)
 * 2. 실행: node scripts/post_v1.1_announcement.js
 *    (Emulator 사용 시: export FIRESTORE_EMULATOR_HOST="localhost:8080" && node scripts/post_v1.1_announcement.js)
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 설정
const CLUB_ID = 'default-club'; // 실제 운영 중인 Club ID로 변경 필요
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../serviceAccountKey.json');

// v1.1 공지 내용
const NOTICE_TITLE = '📢 Wings Baseball Club v1.1 업데이트 안내';
const NOTICE_CONTENT = `
안녕하세요, Wings Baseball Club 회원 여러분!
커뮤니티 앱이 v1.1로 새롭게 업데이트되었습니다.

📌 **주요 변경 사항**

1️⃣ **메뉴 간소화 및 최적화**
   - **홈**: 내 활동 요약과 주요 일정을 한눈에 확인
   - **게시판**: 공지사항, 자유게시판, 이벤트(경기/모임) 3개 탭으로 통합
   - **마이페이지**: 내 프로필 및 설정 관리

2️⃣ **불필요한 기능 제거 (Lightweight)**
   - 앱 속도 향상을 위해 앨범, 회비 관리, 기록실 등 사용률이 낮은 기능은 제거되었습니다.
   - 핵심 커뮤니티 기능에 집중하여 더욱 빠르고 쾌적합니다.

3️⃣ **스마트 투표 시스템**
   - 경기 일정(Event) 생성 시 투표 마감 시간이 자동으로 설정됩니다.
   - **마감 기준**: 경기 시작일 **전날 23:00** 자동 마감
   - 마감 후에는 참석 여부를 변경할 수 없습니다.

4️⃣ **보안 강화**
   - 정회원(Active)만 게시글을 열람할 수 있는 보안 등급이 적용되었습니다.

새로워진 Wings 앱과 함께 즐거운 야구 생활 되시길 바랍니다!
감사합니다.

- Wings 운영진 드림
`;

async function main() {
    // 1. Initialize
    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        const serviceAccount = require(SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Initialized with Service Account');
    } else {
        // Emulator 모드나 환경 변수 인증 시도
        console.warn('⚠️ serviceAccountKey.json not found. Assuming Emulator or Default Auth.');
        admin.initializeApp({
            projectId: 'wings-baseball-club' // 실제 프로젝트 ID 확인 필요
        });
    }

    const db = admin.firestore();

    // 2. Prepare Data
    const newPostRef = db.collection('clubs').doc(CLUB_ID).collection('posts').doc();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const postData = {
        id: newPostRef.id,
        type: 'notice',
        title: NOTICE_TITLE,
        content: NOTICE_CONTENT,
        authorId: 'admin-bot', // 또는 실제 관리자 UID
        authorName: 'Wings 운영알림',
        createdAt: now,
        updatedAt: now,
        commentCount: 0,
        viewCount: 0,
        isPinned: true, // 상단 고정
        images: []
    };

    // 3. Write to Firestore
    try {
        await newPostRef.set(postData);
        console.log('🎉 Successfully posted v1.1 Announcement!');
        console.log(`Document ID: ${newPostRef.id}`);
        console.log(`Path: clubs/${CLUB_ID}/posts/${newPostRef.id}`);
    } catch (error) {
        console.error('❌ Failed to post notice:', error);
        process.exit(1);
    }
}

main();
