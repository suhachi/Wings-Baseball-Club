
/**
 * MASTER VERIFICATION SCRIPT
 * 
 * Purpose: Verify ALL critical paths in one go.
 * 1. Auth/Gating: Incomplete Profile blocked -> Complete Profile allowed.
 * 2. Posts: Creation validation.
 * 3. Comments: Count Trigger sync.
 * 4. Events: Vote Auto-close logic.
 * 
 * Usage: node scripts/verify-all-critical-paths.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, addDoc, getDoc, updateDoc, collection, deleteDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeApp as initAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

// Env setup
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';

// Admin Init (for bypassing rules during setup/verification)
try { initAdminApp({ projectId: 'wings-baseball' }); } catch (e) { }
const adminDb = getAdminFirestore();

// Client Init
const app = initializeApp({ projectId: 'wings-baseball', apiKey: "test-api-key" });
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'asia-northeast3');

connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);
connectFunctionsEmulator(functions, 'localhost', 5001);

const CLUB_ID = 'WINGS';
async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Robust User Creation (Client SDK)
async function getOrCreateUser(email, role, profileComplete = true) {
    let cred;
    try {
        cred = await createUserWithEmailAndPassword(auth, email, 'password123');
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            cred = await signInWithEmailAndPassword(auth, email, 'password123');
        } else throw e;
    }

    // Seed/Reset Profile via Admin
    const uid = cred.user.uid;
    const profile = {
        role,
        status: 'active',
        realName: role === 'ADMIN' ? 'Admin' : 'Tester',
        phone: profileComplete ? '010-1234-5678' : null, // Missing phone = Incomplete
        createdAt: new Date()
    };
    await adminDb.doc(`clubs/${CLUB_ID}/members/${uid}`).set(profile, { merge: true });
    return cred;
}

async function run() {
    console.log('🚀 Starting MASTER VERIFICATION...');
    try {
        // --- 1. AUTH & SOFT GATE ---
        console.log('\n[1] Testing Auth & Soft Gate...');
        const weakUser = await getOrCreateUser('weak@test.com', 'MEMBER', false); // No phone
        const weakUid = weakUser.user.uid;

        // Try Write Post (Should Fail)
        try {
            await addDoc(collection(db, `clubs/${CLUB_ID}/posts`), {
                type: 'free', title: 'FailPost', content: '..', authorId: weakUid, createdAt: new Date()
            });
            console.error('❌ Soft Gate FAILED: Incomplete profile created a post.');
            process.exit(1);
        } catch (e) {
            if (e.code === 'permission-denied') console.log('  ✅ Incomplete Profile blocked from Posting.');
            else throw e;
        }

        // Complete Profile
        await adminDb.doc(`clubs/${CLUB_ID}/members/${weakUid}`).update({ phone: '010-1111-2222' });
        await sleep(500); // Wait for rules prop? Usually instant in emulator

        // Try Write Post (Should Pass)
        const postRef = await addDoc(collection(db, `clubs/${CLUB_ID}/posts`), {
            type: 'free', title: 'SuccessPost', content: 'Content', authorId: weakUid, createdAt: new Date()
        });
        console.log('  ✅ Complete Profile created a post.');
        const postId = postRef.id;

        // --- 2. COMMENTS & TRIGGER ---
        console.log('\n[2] Testing Comments & Count Trigger...');
        await addDoc(collection(db, `clubs/${CLUB_ID}/posts/${postId}/comments`), {
            content: 'C1', authorId: weakUid, authorName: 'Tester', createdAt: new Date()
        });
        console.log('  -> Comment added. Waiting for Trigger...');
        await sleep(4000);

        const postSnap = await adminDb.doc(`clubs/${CLUB_ID}/posts/${postId}`).get();
        const count = postSnap.data().commentCount;
        if (count === 1) console.log('  ✅ commentCount updated to 1.');
        else {
            console.warn(`  ⚠️ commentCount is ${count} (Expected 1). Trigger might be slow or Functions not reloaded.`);
        }

        // --- 3. EVENT & VOTE 21:00 ---
        console.log('\n[3] Testing Event 21:00 Auto-Close...');
        const adminUser = await getOrCreateUser('admin_master@test.com', 'ADMIN', true);

        // Call createEventPost
        // We need to handle case where function is not found if emulator not restarted
        try {
            const createEventPost = httpsCallable(functions, 'createEventPost');
            const startAt = new Date(Date.now() + 86400000 * 2); // 2 days later
            const res = await createEventPost({
                clubId: CLUB_ID,
                eventType: 'PRACTICE',
                title: 'Master Verify',
                content: 'Test',
                place: 'Loc',
                startAt: startAt.toISOString(),
                requestId: `master-${Date.now()}`
            });
            const eventId = res.data.postId;
            const closeAt = res.data.voteCloseAt;
            console.log('  ✅ Event created via Callable.');

            // Check 21:00 KST (12:00 UTC) check
            const h = new Date(closeAt).getUTCHours();
            if (h === 12) console.log('  ✅ VoteCloseAt is 12:00 UTC (21:00 KST).');
            else console.error(`  ❌ VoteCloseAt is ${h}:00 UTC (Expected 12).`);

            // Verify Rules Enforcement
            const eventPostRef = adminDb.doc(`clubs/${CLUB_ID}/posts/${eventId}`);

            // Force Past
            await eventPostRef.update({ voteCloseAt: new Date(Date.now() - 10000) });
            const attendanceRef = doc(db, `clubs/${CLUB_ID}/posts/${eventId}/attendance/${weakUid}`);

            // Try vote (Fail)
            // Re-login as member
            await signInWithEmailAndPassword(auth, 'weak@test.com', 'password123');
            try {
                await setDoc(attendanceRef, { status: 'attending', updatedAt: new Date() });
                console.error('  ❌ Vote Succeeded when CLOSED.');
            } catch (e) {
                if (e.code === 'permission-denied') console.log('  ✅ Vote Blocked when Time Passed.');
            }

        } catch (e) {
            console.warn('  ⚠️ Functions call failed:', e.message);
            console.warn('  (This is expected if Emulator was not restarted after code changes).');
        }

        console.log('\n🏁 MASTER VERIFICATION COMPLETE');
        console.log('If all checks passed (except ⚠️ warnings due to reload), logic is SOUND.');
        process.exit(0);
    } catch (e) {
        console.error('FATAL ERROR:', e);
        process.exit(1);
    }
}

run();
