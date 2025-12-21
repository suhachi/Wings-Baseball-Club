/**
 * Migration Script: phoneNumber -> phone (M00-09)
 * 
 * Policy: Standardize on `phone`.
 * Action: Copy `phoneNumber` to `phone` if `phone` is missing. Do NOT delete `phoneNumber`.
 * 
 * Usage:
 * node scripts/migrate-phoneNumber-to-phone.mjs
 * (Default DRY_RUN=true)
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default TRUE

const app = initializeApp({ projectId: "wings-baseball-club" });
const db = getFirestore(app);

async function migrate() {
    console.log(`[MIGRATE] phoneNumber -> phone (DRY_RUN=${DRY_RUN})`);

    // 1. Scan clubs/{clubId}/members
    const clubsSnap = await db.collection('clubs').get();
    for (const clubDoc of clubsSnap.docs) {
        const membersRef = clubDoc.ref.collection('members');
        // Find docs where phone is null or missing? Firestore doesn't support "missing" query easily.
        // We scan all or use a heuristic. Since users might be small, scanning all or scanning where phoneNumber exists is okay.
        // Let's scan where phoneNumber != null.
        const snap = await membersRef.orderBy('phoneNumber').get();

        console.log(`[CLUB: ${clubDoc.id}] Scanned ${snap.size} members with phoneNumber.`);

        const batch = db.batch();
        let count = 0;

        for (const doc of snap.docs) {
            const data = doc.data();
            if (!data.phone && data.phoneNumber) {
                console.log(` -> Patching: ${doc.id} (${data.realName})`);
                if (!DRY_RUN) {
                    batch.update(doc.ref, { phone: data.phoneNumber });
                }
                count++;
            }
        }

        if (!DRY_RUN && count > 0) {
            await batch.commit();
            console.log(` -> Committed ${count} updates for club ${clubDoc.id}`);
        } else {
            console.log(` -> No updates needed (or DRY_RUN).`);
        }
    }

    console.log("[DONE]");
}

migrate();
