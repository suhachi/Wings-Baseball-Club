
/**
 * [OPTION S0] Manual Ops Script to Close Expired Votes
 * 
 * Usage: 
 * node scripts/ops-close-expired-votes.mjs --dry-run
 * node scripts/ops-close-expired-votes.mjs --apply
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

// T1: Standard Project ID
const DEFAULT_PROJECT_ID = 'wings-baseball-club';
const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
const CLUB_ID = 'WINGS';

// Initialize
if (process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({ projectId });
} else {
    console.log(`[Config] Using projectId: ${projectId}`);
    initializeApp({ projectId });
}

const db = getFirestore();

async function run() {
    const isDryRun = process.argv.includes('--dry-run');
    const isApply = process.argv.includes('--apply');
    if (!isDryRun && !isApply) {
        console.log('Usage: node script.js --dry-run OR --apply');
        process.exit(1);
    }

    console.log(`Starting Vote Auto-Close Ops (DryRun: ${isDryRun ? 'YES' : 'NO'})`);
    const postsRef = db.collection(`clubs/${CLUB_ID}/posts`);
    const now = new Date();

    // Query similar to Scheduler
    // Query type + time (Composite Index might be needed, or use broad query)
    // S0 Policy: Robust query avoiding complex index if possible, or expect index creation.
    // Querying 'event' + 'voteCloseAt' <= now.
    // Filtering 'voteClosed' in memory.
    const snapshot = await postsRef
        .where('type', '==', 'event')
        .where('voteCloseAt', '<=', now)
        .get();

    if (snapshot.empty) {
        console.log('No expired votes found.');
        return;
    }

    console.log(`Found ${snapshot.size} expired events.`);

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // T5: Idempotency Check
        if (data.voteClosed === true) {
            console.log(`[SKIP] ${doc.id} already closed.`);
            return;
        }

        console.log(`[TARGET] ${doc.id} (CloseAt: ${data.voteCloseAt?.toDate()?.toISOString()})`);

        if (!isDryRun) {
            batch.update(doc.ref, {
                voteClosed: true,
                voteClosedAt: FieldValue.serverTimestamp(),
                voteClosedBy: 'ops-script',
                updatedAt: FieldValue.serverTimestamp()
            });
        }
        count++;
    });

    if (count > 0) {
        if (!isDryRun) {
            await batch.commit();
            console.log(`[APPLY] Closed ${count} events.`);
        } else {
            console.log(`[DRY-RUN] Would close ${count} events.`);
        }
    }
}

run().catch(console.error);
