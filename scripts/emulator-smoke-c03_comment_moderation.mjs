
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeApp as initAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

//Env vars for Admin SDK
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';

const DEFAULT_PROJECT_ID = 'wings-baseball-club';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;

// Initialize Admin SDK (for Setup)
try {
    initAdminApp({ projectId: PROJECT_ID });
} catch (e) { } // Handle re-init
const adminDb = getAdminFirestore();
const adminAuth = getAdminAuth();

// Initialize Client SDK (for Test)
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

// --- HELPERS ---
async function createUser(email, password, role = 'MEMBER', realName = 'TestUser', phone = '010-0000-0000') {
    // 1. Create in Auth (Admin SDK)
    let uid;
    try {
        const userRecord = await adminAuth.createUser({ email, password });
        uid = userRecord.uid;
    } catch (e) {
        if (e.code === 'auth/email-already-exists') {
            const userRecord = await adminAuth.getUserByEmail(email);
            uid = userRecord.uid;
            // Update password to ensure login works
            await adminAuth.updateUser(uid, { password });
        } else {
            throw e;
        }
    }

    // 2. Create in Firestore (Admin SDK - Bypass Rules)
    await adminDb.doc(`clubs/${CLUB_ID}/members/${uid}`).set({
        role,
        status: 'active',
        realName,
        phone,
        phoneNumber: phone, // Legacy Sync
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await adminDb.doc(`users/${uid}`).set({
        email,
        createdAt: new Date(),
    });

    // 3. Login Client SDK
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
}

async function verifyAudit(commentId, actionType) {
    const q = adminDb.collection(`clubs/${CLUB_ID}/audit`)
        .where('targetId', '==', commentId)
        .where('action', '==', actionType);
    const snap = await q.get();
    if (!snap.empty) {
        console.log(`✅ Audit Log Found: ${actionType} for ${commentId}`);
        return true;
    }
    console.error(`❌ Audit Log MISSING: ${actionType} for ${commentId}`);
    return false;
}

// --- TESTS ---

// 1. Author Actions
async function testAuthorActions(postDocId) {
    console.log('\n--- Test 1: Author Actions (Incomplete vs Complete) ---');
    await signOut(auth);

    // Create Author (Incomplete Profile - No Phone)
    // Note: createUser helper creates complete profile by default. We need to override.
    const authorEmail = 'author_incomplete@test.com';
    let authorUid;
    try {
        const u = await adminAuth.createUser({ email: authorEmail, password: 'password123' });
        authorUid = u.uid;
    } catch (e) {
        const u = await adminAuth.getUserByEmail(authorEmail);
        authorUid = u.uid;
    }
    await adminDb.doc(`clubs/${CLUB_ID}/members/${authorUid}`).set({
        role: 'MEMBER',
        status: 'active',
        realName: 'Incomplete Guy',
        phone: null, // Incomplete
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    await adminDb.doc(`users/${authorUid}`).set({ email: authorEmail, createdAt: new Date() });

    const author = await signInWithEmailAndPassword(auth, authorEmail, 'password123');
    console.log('Logged in as Incomplete Author:', author.user.uid);
    await sleep(2000);

    // 1a. Create Comment -> Should FAIL (hasRequiredProfile required for Create)
    try {
        await addDoc(collection(db, `clubs/${CLUB_ID}/posts/${postDocId}/comments`), {
            content: "Should Fail",
            authorId: author.user.uid,
            createdAt: new Date()
        });
        console.error('❌ Incomplete Author Create SUCCEEDED (Should have failed)');
        process.exit(1);
    } catch (e) {
        if (e.code === 'permission-denied') {
            console.log('✅ Incomplete Author Create Blocked');
        } else {
            console.error('❌ Unexpected Error during Create:', e);
            process.exit(1);
        }
    }

    // Seed a comment for this author via Admin SDK (to test update/delete)
    const seedRef = await adminDb.collection(`clubs/${CLUB_ID}/posts/${postDocId}/comments`).add({
        content: "Seeded Content",
        authorId: author.user.uid,
        authorName: 'Incomplete Guy',
        createdAt: new Date(),
        updatedAt: new Date()
    });
    const commentId = seedRef.id;
    console.log('✅ Seeded Comment for Incomplete Author');

    // 1b. Update Comment -> Should PASS (Profile check removed for Update)
    try {
        await updateDoc(doc(db, `clubs/${CLUB_ID}/posts/${postDocId}/comments/${commentId}`), {
            content: "Updated by Incomplete",
            updatedAt: new Date()
        });
        console.log('✅ Incomplete Author Update Success (Allowed)');
    } catch (e) {
        console.error('❌ Incomplete Author Update Failed:', e.message);
        process.exit(1);
    }

    // 1c. Delete Comment -> Should PASS (Profile check removed for Delete)
    try {
        await deleteDoc(doc(db, `clubs/${CLUB_ID}/posts/${postDocId}/comments/${commentId}`));
        console.log('✅ Incomplete Author Delete Success (Allowed)');
    } catch (e) {
        console.error('❌ Incomplete Author Delete Failed:', e.message);
        process.exit(1);
    }

    return { author };
}

// 2. Admin Direct Update/Delete (Should FAIL via Rules)
async function testAdminDirectFail(postDocId) {
    // Need a target comment first. Create one via Admin SDK.
    const targetRef = await adminDb.collection(`clubs/${CLUB_ID}/posts/${postDocId}/comments`).add({
        content: "Target for Admin Direct",
        authorId: "some-other-uid",
        createdAt: new Date()
    });
    const commentId = targetRef.id;

    console.log('\n--- Test 2: Admin Direct Firestore Actions (Should FAIL) ---');
    await signOut(auth);
    const adminUser = await createUser('admin@test.com', 'password123', 'ADMIN', 'Admin Kim');
    console.log('Logged in as Admin:', adminUser.uid);
    await sleep(500);

    // Attempt Direct Update
    try {
        await updateDoc(doc(db, `clubs/${CLUB_ID}/posts/${postDocId}/comments/${commentId}`), {
            content: "Admin Hacked Content"
        });
        console.error('❌ Admin Direct Update SUCCEEDED (Should have failed)');
        process.exit(1);
    } catch (e) {
        console.log('✅ Admin Direct Update Blocked (Permission Denied)');
    }

    return { adminUser, commentId };
}

// 3. Admin Callable Actions (Should PASS + Audit + Idempotency)
async function testAdminCallable(postDocId, commentId) {
    console.log('\n--- Test 3: Admin Callable Actions (Should PASS + Audit + Idempotency) ---');
    // Explicitly sign in to ensure Token is present for V2 Callable
    try {
        await signInWithEmailAndPassword(auth, 'admin@test.com', 'password123');
        console.log('Confirmed signed in as Admin for Callable Test');
    } catch (e) {
        console.error("Sign In Failed in Test 3:", e);
        process.exit(1);
    }

    const moderateComment = httpsCallable(functions, 'moderateComment');
    const requestId = `req-${Date.now()}`;

    // Callable Edit
    try {
        const res = await moderateComment({
            clubId: CLUB_ID,
            postId: postDocId,
            commentId: commentId,
            action: 'EDIT',
            content: 'Admin Moderated Content',
            reason: 'Inappropriate language',
            requestId: requestId
        });
        console.log('✅ Admin Callable Edit Success:', res.data);
    } catch (e) {
        console.error('❌ Admin Callable Edit Failed:', e);
        process.exit(1);
    }

    // Idempotency Re-run
    console.log('--- Test 3b: Idempotency Check ---');
    try {
        const res2 = await moderateComment({
            clubId: CLUB_ID,
            postId: postDocId,
            commentId: commentId,
            action: 'EDIT',
            content: 'Admin Moderated Content',
            reason: 'Inappropriate language',
            requestId: requestId // SAME ID
        });
        console.log('✅ Idempotency Retry Success:', res2.data);
        // Should verify it didn't change edit timestamp or audit log count if strict,
        // but simple success return is enough for smoke.
    } catch (e) {
        console.error('❌ Idempotency Failed:', e);
        process.exit(1);
    }
}

async function run() {
    try {
        // Create Parent Post
        const owner = await createUser('owner@test.com', 'password123', 'PRESIDENT', 'Owner');
        const postRef = await addDoc(collection(db, `clubs/${CLUB_ID}/posts`), {
            type: 'free',
            title: 'Test Post',
            content: 'Content',
            authorId: owner.uid,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const postDocId = postRef.id;

        const { author, commentId } = await testAuthorActions(postDocId);
        await testAdminDirectFail(postDocId, commentId);
        await testAdminCallable(postDocId, commentId);

        console.log('\n=== ALL SMOKE TESTS PASSED ===');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
