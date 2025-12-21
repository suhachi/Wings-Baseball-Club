/**
 * Migration Script: Pending -> Active (M00-09)
 * 
 * Policy: Remove "Pending" state. All members should be "Active" upon signup.
 * Legacy pending members are batch updated to active.
 * 
 * Usage:
 * node scripts/migrate-pending-to-active.mjs
 * (Default DRY_RUN=true)
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default TRUE

// Initialize Admin
const app = initializeApp({ projectId: "wings-baseball-club" });
const db = getFirestore(app);

async function migrate() {
    console.log(`[MIGRATE] Pending -> Active (DRY_RUN=${DRY_RUN})`);

    // 1. Scan clubs/{clubId}/members
    const clubsSnap = await db.collection('clubs').get();
    for (const clubDoc of clubsSnap.docs) {
        const membersRef = clubDoc.ref.collection('members');
        const pendingSnap = await membersRef.where('status', '==', 'pending').get();

        console.log(`[CLUB: ${clubDoc.id}] Found ${pendingSnap.size} pending members.`);

        if (pendingSnap.empty) continue;

        const batch = db.batch();
        let count = 0;

        for (const doc of pendingSnap.docs) {
            const data = doc.data();
            console.log(` -> Candidate: ${doc.id} (${data.realName || 'NoName'})`);
            if (!DRY_RUN) {
                batch.update(doc.ref, { status: 'active', updatedAt: new Date() });
            }
            count++;
        }

        if (!DRY_RUN && count > 0) {
            await batch.commit();
            console.log(` -> Committed ${count} updates for club ${clubDoc.id}`);
        }
    }

    // 2. Scan global users (if status exists there)
    const usersSnap = await db.collection('users').where('status', '==', 'pending').get();
    console.log(`[GLOBAL] Found ${usersSnap.size} pending users.`);

    if (!usersSnap.empty) {
        const batch = db.batch();
        let count = 0;
        for (const doc of usersSnap.docs) {
            console.log(` -> Candidate User: ${doc.id}`);
            if (!DRY_RUN) {
                batch.update(doc.ref, { status: 'active', updatedAt: new Date() });
            }
            count++;
        }
        if (!DRY_RUN && count > 0) {
            await batch.commit();
            console.log(` -> Committed ${count} user updates.`);
        }
    }

    console.log("[DONE]");
}

migrate();
