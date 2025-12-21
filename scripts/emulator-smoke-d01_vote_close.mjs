
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeApp as initAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';

try { initAdminApp({ projectId: 'wings-baseball' }); } catch (e) { }
const adminDb = getAdminFirestore();
// const adminAuth = getAdminAuth(); // Not used to avoid mismatch

const app = initializeApp({ projectId: 'wings-baseball', apiKey: "test-api-key" });
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'asia-northeast3');

connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);
connectFunctionsEmulator(functions, 'localhost', 5001);

const CLUB_ID = 'default-club';

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function createUser(email, password, role = 'MEMBER') {
    try {
        // Try creating via Client SDK
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        console.log(`[ClientSDK] Created ${role} user: ${email}`);

        // Seed Profile via Admin SDK (bypass rules)
        await adminDb.doc(`clubs/${CLUB_ID}/members/${cred.user.uid}`).set({
            role, status: 'active', realName: role === 'ADMIN' ? 'AdminUser' : 'TestUser',
            phone: '010-1234-5678', createdAt: new Date()
        }, { merge: true });

        return cred;
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            console.log(`[ClientSDK] User exists, logging in: ${email}`);
            const cred = await signInWithEmailAndPassword(auth, email, password);
            // Verify/Update role
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
        const adminCred = await createUser('admin_vote@test.com', 'password123', 'ADMIN');
        // Member for voting
        const memberCred = await createUser('voter@test.com', 'password123', 'MEMBER');
        const memberUid = memberCred.user.uid;

        // Login as Member first to have auth context
        await signInWithEmailAndPassword(auth, 'voter@test.com', 'password123');

        // 1. Create Event via Callable (Admin context needed)
        await signInWithEmailAndPassword(auth, 'admin_vote@test.com', 'password123');
        const createEventPost = httpsCallable(functions, 'createEventPost');

        console.log('Creating Event...');
        const res = await createEventPost({
            clubId: CLUB_ID,
            eventType: 'PRACTICE',
            title: 'Vote Test Event',
            content: 'Please vote',
            place: 'Ground A',
            startAt: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days later
            requestId: `req-vote-${Date.now()}`
        });
        const postId = res.data.postId;
        console.log('✅ Event Created:', postId);

        // 2. Prepare Vote Ref
        // Re-login as Voter
        await signInWithEmailAndPassword(auth, 'voter@test.com', 'password123');
        const attendanceRef = doc(db, `clubs/${CLUB_ID}/posts/${postId}/attendance/${memberUid}`);

        // 3. Test A: Force PAST voteCloseAt -> Write should FAIL
        console.log('\n--- Test A: Past voteCloseAt (Should DENY) ---');
        await adminDb.doc(`clubs/${CLUB_ID}/posts/${postId}`).update({
            voteCloseAt: new Date(Date.now() - 3600000) // 1 hour ago
        });

        // Try to SET attendance (client)
        try {
            const { setDoc } = await import('firebase/firestore');
            await setDoc(attendanceRef, {
                status: 'attending', userName: 'TestUser', updatedAt: new Date()
            });
            console.error('❌ Write Succeeded (Should FAIL)');
            process.exit(1);
        } catch (e) {
            if (e.code === 'permission-denied') {
                console.log('✅ Write Denied (Time Closed)');
            } else {
                console.error('❌ Unexpected Error:', e);
                process.exit(1);
            }
        }

        // 4. Test B: Force FUTURE voteCloseAt -> Write should PASS
        console.log('\n--- Test B: Future voteCloseAt (Should ALLOW) ---');
        await adminDb.doc(`clubs/${CLUB_ID}/posts/${postId}`).update({
            voteCloseAt: new Date(Date.now() + 3600000) // 1 hour future
        });

        try {
            const { setDoc } = await import('firebase/firestore');
            await setDoc(attendanceRef, {
                status: 'attending', userName: 'TestUser', updatedAt: new Date()
            });
            console.log('✅ Write Succeeded (Time Open)');
        } catch (e) {
            console.error('❌ Write Failed (Should PASS):', e);
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
