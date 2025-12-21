
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeApp as initAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

//Env vars
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';

const DEFAULT_PROJECT_ID = 'wings-baseball-club';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;

// Admin SDK
try { initAdminApp({ projectId: PROJECT_ID }); } catch (e) { }
const adminDb = getAdminFirestore();
const adminAuth = getAdminAuth();

// Client SDK
const app = initializeApp({
    projectId: PROJECT_ID,
    apiKey: "test-api-key",
    authDomain: `${PROJECT_ID}.firebaseapp.com`
});
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'asia-northeast3');

connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);
connectFunctionsEmulator(functions, 'localhost', 5001);

const CLUB_ID = 'WINGS';

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function createUser(email, password, role = 'MEMBER') {
    if (role === 'MEMBER') {
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            console.log(`[ClientSDK] Created user ${email} (${cred.user.uid})`);

            await adminDb.doc(`clubs/${CLUB_ID}/members/${cred.user.uid}`).set({
                role, status: 'active', realName: 'TestUser', phone: '010-1234-5678', phoneNumber: '010-1234-5678', createdAt: new Date()
            }, { merge: true });
            await adminDb.doc(`users/${cred.user.uid}`).set({ email, createdAt: new Date() }, { merge: true });

            return cred;
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                return await signInWithEmailAndPassword(auth, email, password);
            }
            throw e;
        }
    }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        console.log(`[ClientSDK] Created Admin ${email} (${cred.user.uid})`);

        await adminDb.doc(`clubs/${CLUB_ID}/members/${cred.user.uid}`).set({
            role, status: 'active', realName: 'AdminUser', phone: '010-1111-2222', phoneNumber: '010-1111-2222', createdAt: new Date()
        }, { merge: true });

        return cred;
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const uid = cred.user.uid;
            await adminDb.doc(`clubs/${CLUB_ID}/members/${uid}`).update({ role: 'ADMIN' });
            return cred;
        }
        throw e;
    }
}

async function run() {
    try {
        console.log('--- Setup ---');
        const userCred = await createUser('countuser@test.com', 'password123', 'MEMBER');
        const userId = userCred.user.uid;

        const adminCred = await createUser('admincount@test.com', 'password123', 'ADMIN');
        const adminId = adminCred.user.uid;

        // Create Post via Admin
        const postRef = await adminDb.collection(`clubs/${CLUB_ID}/posts`).add({
            title: 'Count Test Post',
            content: 'Content',
            type: 'free',
            authorId: adminId,
            createdAt: new Date(),
            commentCount: 0
        });
        const postId = postRef.id;
        console.log('✅ Created Post:', postId);

        // 1. Client Create Comment -> Trigger +1
        console.log('\n--- Test 1: Client Comment Create -> Count +1 ---');
        await signInWithEmailAndPassword(auth, 'countuser@test.com', 'password123');
        const c1 = await addDoc(collection(db, `clubs/${CLUB_ID}/posts/${postId}/comments`), {
            content: "First Comment",
            authorId: userId,
            authorName: 'TestUser',
            createdAt: new Date()
        });
        console.log('Created Comment 1:', c1.id);

        await sleep(5000); // 5 sec wait
        let pSnap = await adminDb.doc(`clubs/${CLUB_ID}/posts/${postId}`).get();
        let count = pSnap.data().commentCount;
        if (count === 1) console.log('✅ Count is 1');
        else { console.error('❌ Count mismatch:', count); process.exit(1); }

        // 2. Client Delete Comment -> Trigger -1
        console.log('\n--- Test 2: Client Comment Delete -> Count -1 ---');
        await deleteDoc(doc(db, `clubs/${CLUB_ID}/posts/${postId}/comments/${c1.id}`));

        await sleep(5000);
        pSnap = await adminDb.doc(`clubs/${CLUB_ID}/posts/${postId}`).get();
        count = pSnap.data().commentCount;
        if (count === 0) console.log('✅ Count is 0');
        else { console.error('❌ Count mismatch:', count); process.exit(1); }

        // 3. Admin Callable Edit -> Idempotency Check
        console.log('\n--- Test 3: Admin Callable Idempotency ---');

        await adminDb.collection(`clubs/${CLUB_ID}/posts/${postId}/comments`).add({
            content: "To be moderated",
            authorId: userId,
            createdAt: new Date()
        });
        const commentsSnap = await adminDb.collection(`clubs/${CLUB_ID}/posts/${postId}/comments`).get();
        const targetCommentId = commentsSnap.docs[0].id;

        await signInWithEmailAndPassword(auth, 'admincount@test.com', 'password123');
        const moderateComment = httpsCallable(functions, 'moderateComment');
        const requestId = 'req-idem-test-01';

        // First Call
        await moderateComment({
            clubId: CLUB_ID, postId, commentId: targetCommentId,
            action: 'EDIT', content: 'Moderated Once', requestId
        });
        console.log('✅ First Call Success');

        await sleep(2000);
        const audits1 = await adminDb.collection(`clubs/${CLUB_ID}/audit`)
            .where('meta.requestId', '==', requestId).get();
        if (audits1.size !== 1) { console.error('❌ Audit count mismatch (1st):', audits1.size); process.exit(1); }

        // Second Call
        await moderateComment({
            clubId: CLUB_ID, postId, commentId: targetCommentId,
            action: 'EDIT', content: 'Moderated Twice', requestId
        });
        console.log('✅ Second Call Success (Idempotent Return)');

        await sleep(2000);
        const audits2 = await adminDb.collection(`clubs/${CLUB_ID}/audit`)
            .where('meta.requestId', '==', requestId).get();
        if (audits2.size === 1) console.log('✅ Idempotency Works');
        else { console.error('❌ Idempotency FAILED:', audits2.size); process.exit(1); }

        console.log('\n=== ALL TESTS PASSED ===');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
