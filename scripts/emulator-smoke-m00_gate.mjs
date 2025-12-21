/**
 * M00 Gate Smoke Test (Expanded)
 * 
 * Scenarios:
 * A) Incomplete Profile -> Write Blocked (Free Post, Comment, Vote)
 * B) Complete Profile -> Write Allowed (Free Post, Comment, Vote)
 * C) RBAC Check (Treasurer Notice / Rule checks)
 */
// Force Admin SDK to use Emulators
// T1: Standard Project ID
const DEFAULT_PROJECT_ID = 'wings-baseball-club';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;

// Force Admin SDK to use Emulators
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = "localhost:5001";

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth'; // Removed unused signIn
import { getFirestore, connectFirestoreEmulator, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import http from 'http';

const EMULATOR_CONFIG = {
    auth: 'http://localhost:9099',
    firestore: { host: 'localhost', port: 8080 },
    functions: { host: 'localhost', port: 5001 },
    ui: { host: 'localhost', port: 4000 }
};

const CLUB_ID = 'WINGS';
const PASSWORD = 'password123';

const firebaseConfig = {
    apiKey: "fake-api-key",
    projectId: PROJECT_ID,
    authDomain: `${PROJECT_ID}.firebaseapp.com`,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'asia-northeast3');

connectAuthEmulator(auth, EMULATOR_CONFIG.auth);
connectFirestoreEmulator(db, EMULATOR_CONFIG.firestore.host, EMULATOR_CONFIG.firestore.port);
connectFunctionsEmulator(functions, EMULATOR_CONFIG.functions.host, EMULATOR_CONFIG.functions.port);

// Initialize Admin for Seeding
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

const adminApp = initAdmin({ projectId: PROJECT_ID }, 'admin_gate_expanded');
const adminDb = getAdminFirestore(adminApp);

// T6: Wait for Emulator Readiness
async function waitForEmulatorReady() {
    console.log("[Setup] Waiting for emulators to be ready...");
    const maxRetries = 60;

    for (let i = 0; i < maxRetries; i++) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(`http://localhost:4000/`, (res) => {
                    if (res.statusCode === 200) resolve();
                    else reject(new Error(`Status ${res.statusCode}`));
                });
                req.on('error', reject);
                req.end();
            });
            console.log("[Setup] Emulator UI is reachable. Starting tests.");
            return;
        } catch (e) {
            if (i === maxRetries - 1) {
                console.error("[Setup] FAIL: Emulators not ready after 60s.");
                process.exit(1);
            }
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

async function setProfile(uid, data) {
    await adminDb.doc(`clubs/${CLUB_ID}/members/${uid}`).set({
        ...data,
        status: 'active',
        role: data.role || 'MEMBER', // Default Member
        updatedAt: new Date()
    }, { merge: true });
}

async function run() {
    console.log("=== EXPANDED M00 SMOKE TEST ===");
    await waitForEmulatorReady();

    try {
        const email = `gate_ex_${Date.now()}@test.com`;

        // 1. Create User
        const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD);
        const uid = cred.user.uid;
        console.log(`[SETUP] Created user ${uid}`);

        // Set initial profile: Incomplete
        await setProfile(uid, { realName: 'Tester', phone: null, phoneNumber: null });

        // --- TEST A: Incomplete Profile (Writes Blocked) ---
        console.log("\n[TEST A] Incomplete Profile...");

        // A-1. Free Post
        try {
            await setDoc(doc(collection(db, `clubs/${CLUB_ID}/posts`)), {
                type: 'free',
                title: 'Fail Post',
                content: ' body',
                authorId: uid,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.error("❌ FAIL: Written Post with incomplete profile!");
            process.exit(1);
        } catch (e) {
            if (e.code === 'permission-denied') console.log("✅ PASS: Blocked Post.");
            else throw e;
        }

        // A-2. Comment (Need a valid post first - Admin creates one)
        const postRef = adminDb.collection(`clubs/${CLUB_ID}/posts`).doc('test_post_gate');
        await postRef.set({ title: 'Test', type: 'free', content: '...', authorId: 'sys', createdAt: new Date() });

        try {
            await addDoc(collection(db, `clubs/${CLUB_ID}/posts/test_post_gate/comments`), {
                content: 'Fail Comment',
                authorId: uid,
                createdAt: new Date()
            });
            console.error("❌ FAIL: Written Comment with incomplete profile!");
            process.exit(1);
        } catch (e) {
            if (e.code === 'permission-denied') console.log("✅ PASS: Blocked Comment.");
            else throw e;
        }

        // A-3. Attendance Vote (Need a voting post)
        try {
            await setDoc(doc(db, `clubs/${CLUB_ID}/posts/test_post_gate/attendance/${uid}`), {
                status: 'attending'
            });
            console.error("❌ FAIL: Voted with incomplete profile!");
            process.exit(1);
        } catch (e) {
            if (e.code === 'permission-denied') console.log("✅ PASS: Blocked Vote.");
            else throw e;
        }

        // --- TEST B: Complete Profile (Writes Allowed) ---
        console.log("\n[TEST B] Complete Profile...");
        await setProfile(uid, { realName: 'Tester', phone: '010-1234-5678' });

        // Wait for propagation
        await new Promise(r => setTimeout(r, 1000));

        // B-1. Free Post
        try {
            await setDoc(doc(collection(db, `clubs/${CLUB_ID}/posts`)), {
                type: 'free',
                title: 'Success Post',
                content: ' body',
                authorId: uid,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log("✅ PASS: Written Post.");
        } catch (e) {
            console.error("❌ FAIL: Post Write Failed", e);
            process.exit(1);
        }

        // B-2. Comment
        try {
            await addDoc(collection(db, `clubs/${CLUB_ID}/posts/test_post_gate/comments`), {
                content: 'Success Comment',
                authorId: uid,
                createdAt: new Date()
            });
            console.log("✅ PASS: Written Comment.");
        } catch (e) {
            console.error("❌ FAIL: Comment Write Failed", e);
            process.exit(1);
        }

        // B-3. Vote
        try {
            // Need post to be 'vote closed' false (default is null/false). 
            // Rules check: isVoteOpen() -> post.voteClosed != true.
            // Admin post setup didn't set voteClosed, so ok.
            await setDoc(doc(db, `clubs/${CLUB_ID}/posts/test_post_gate/attendance/${uid}`), {
                status: 'attending'
            });
            console.log("✅ PASS: Voted.");
        } catch (e) {
            console.error("❌ FAIL: Vote Failed", e);
            process.exit(1);
        }

        // --- TEST C: RBAC (Treasurer Capabilities) ---
        console.log("\n[TEST C] RBAC: Treasurer Notice Create...");
        const treasurerEmail = `treasurer_ex_${Date.now()}@test.com`;
        const tCred = await createUserWithEmailAndPassword(auth, treasurerEmail, PASSWORD);

        // Set as Treasurer (and complete profile, although RBAC is upstream check usually, Rules for Callable writes are server-side)
        // Note: Callables bypass Rules! But Functions code checks 'isAdmin' / 'isTreasurer'.
        // Functions implementation uses `permissions.ts` or custom logic?
        // Step 0.5 verified RBAC. Here we verify "Callable Success with Valid Role".
        // Also ensure Profile Gate applies? 
        // Functions `createType` typically does NOT check `hasRequiredProfile` unless explicitly added.
        // Prompt M00-06/07 says "Firestore Rules Alignment" and "UI Permission Guards".
        // Callables Logic might NOT have been updated to check Profile. 
        // However, admins usually maintain profile.
        // Let's just verify Treasurer CAN create notice.

        await setProfile(tCred.user.uid, {
            role: 'TREASURER',
            realName: 'Money Manager',
            phone: '010-9999-9999'
        });

        // Switch Auth
        // await auth.signOut();
        // await signInWithEmailAndPassword(auth, treasurerEmail, PASSWORD); // Already signed in via create? No, create returns cred and signs in.

        // But we need to define which user is 'active' for Functions calls.
        // Client SDK `getFunctions` uses `auth` instance. 
        // We need to re-create auth or sign out/in.
        // But parallel users in same app instance is tricky.
        // Let's just recreate app context or simple sign out/in.
        await auth.updateCurrentUser(tCred.user);

        const createNotice = httpsCallable(functions, 'createNoticeWithPush');
        try {
            const result = await createNotice({
                clubId: CLUB_ID,
                title: 'Official Notice',
                content: 'Approved',
                requestId: `req_t_${Date.now()}`
            });
            console.log("✅ PASS: Treasurer created Notice. ID:", result.data.id);
        } catch (e) {
            console.error("❌ FAIL: Treasurer Notice Failed", e);
            process.exit(1);
        }

        console.log("\n=== ALL PASSED ===");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
