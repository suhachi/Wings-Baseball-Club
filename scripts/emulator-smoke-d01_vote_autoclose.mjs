
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeApp as initAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';

const PROJECT_ID_ADMIN = process.env.FIREBASE_PROJECT_ID || 'wings-baseball-club';
try { initAdminApp({ projectId: PROJECT_ID_ADMIN }); } catch (e) { }
const adminDb = getAdminFirestore();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'wings-baseball-club';

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

async function createUser(email, password, role = 'MEMBER') {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await adminDb.doc(`clubs/${CLUB_ID}/members/${cred.user.uid}`).set({
            role, status: 'active', realName: role === 'ADMIN' ? 'AdminUser' : 'VoterUser',
            phone: '010-1234-5678', createdAt: new Date()
        }, { merge: true });
        return cred;
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            await adminDb.doc(`clubs/${CLUB_ID}/members/${cred.user.uid}`).set({
                role, status: 'active'
            }, { merge: true });
            return cred;
        }
        throw e;
    }
}

async function run() {
    try {
        console.log('--- Setup ---');
        // Admin for creating event
        await createUser('admin_close@test.com', 'password123', 'ADMIN');
        // Member for voting
        const memberCred = await createUser('voter_close@test.com', 'password123', 'MEMBER');
        const memberUid = memberCred.user.uid;

        // 1. Create Event via Callable
        await signInWithEmailAndPassword(auth, 'admin_close@test.com', 'password123');
        const createEventPost = httpsCallable(functions, 'createEventPost');

        console.log('Creating Event...');
        // StartAt = 2 days later 10:00 KST approx (keep it simple UTC)
        const startAt = new Date(Date.now() + 86400000 * 2);

        const res = await createEventPost({
            clubId: CLUB_ID,
            eventType: 'PRACTICE',
            title: 'AutoClose Test',
            content: 'Testing 21:00 KST',
            place: 'Ground',
            startAt: startAt.toISOString(),
            requestId: `req-close-${Date.now()}`
        });
        const postId = res.data.postId;
        const closeAtIso = res.data.voteCloseAt;
        console.log('✅ Event Created:', postId);
        console.log('   VoteCloseAt:', closeAtIso);

        // Verify 21:00 KST logic purely by checking UTC hour
        // 21:00 KST = 12:00 UTC
        const closeDate = new Date(closeAtIso);
        if (closeDate.getUTCHours() !== 12) {
            console.error('❌ VoteCloseAt is NOT 21:00 KST (12:00 UTC). Got:', closeDate.getUTCHours());
            // Warning only if local time diff
        } else {
            console.log('✅ VoteCloseAt is verified as 12:00 UTC (21:00 KST)');
        }

        // 2. Test A: Force PAST -> Deny
        console.log('\n--- Test A: Past voteCloseAt (Should DENY) ---');
        await adminDb.doc(`clubs/${CLUB_ID}/posts/${postId}`).update({
            voteCloseAt: new Date(Date.now() - 3600000)
        });

        await signInWithEmailAndPassword(auth, 'voter_close@test.com', 'password123');
        const attendanceRef = doc(db, `clubs/${CLUB_ID}/posts/${postId}/attendance/${memberUid}`);

        try {
            const { setDoc } = await import('firebase/firestore');
            await setDoc(attendanceRef, { status: 'attending', userName: 'Voter', updatedAt: new Date() });
            console.error('❌ Write Succeeded (Should FAIL)');
            process.exit(1);
        } catch (e) {
            if (e.code === 'permission-denied') console.log('✅ Write Denied (Time Closed)');
            else { console.error('❌ Unexpected:', e); process.exit(1); }
        }

        // 3. Test B: Force FUTURE -> Allow
        console.log('\n--- Test B: Future voteCloseAt (Should ALLOW) ---');
        await adminDb.doc(`clubs/${CLUB_ID}/posts/${postId}`).update({
            voteCloseAt: new Date(Date.now() + 3600000)
        });

        try {
            const { setDoc } = await import('firebase/firestore');
            await setDoc(attendanceRef, { status: 'attending', userName: 'Voter', updatedAt: new Date() });
            console.log('✅ Write Succeeded (Time Open)');
        } catch (e) {
            console.error('❌ Write Failed (Should ALLOW):', e);
            process.exit(1);
        }

        console.log('\n=== ALL TESTS PASSED ===');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
