
// DUAL MODE: A-PLAN (Index) with B-PLAN (Memory Fallback)

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

// T1: Standard Project ID
const DEFAULT_PROJECT_ID = 'wings-baseball-club';
const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
const CLUB_ID = 'WINGS';

// Initialize
if (process.env.FIRESTORE_EMULATOR_HOST) {
    if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = projectId;
    initializeApp({ projectId });
} else {
    console.log(`[Config] Using projectId: ${projectId} (Dual Mode)`);
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

    // Attempt A-PLAN
    try {
        await runPlanA(isDryRun);
    } catch (error) {
        // Check for FAILED_PRECONDITION (Index missing)
        if (error.code === 9 || error.message?.includes('FAILED_PRECONDITION') || error.message?.includes('index')) {
            console.warn('⚠️ [A-PLAN FAILED] Index missing or building. Falling back to B-PLAN (Memory Scan).');
            await runPlanB(isDryRun);
        } else {
            throw error;
        }
    }
}

// A-PLAN: Efficient Index Query
async function runPlanA(isDryRun) {
    console.log(`[Mode] A-PLAN: Using Composite Index (type=event, voteClosed=false, voteCloseAt check)`);
    const postsRef = db.collection(`clubs/${CLUB_ID}/posts`);
    const now = new Date();

    // Query: type='event' AND voteClosed==false AND voteCloseAt <= now
    // This requires composite index: type ASC, voteClosed ASC, voteCloseAt ASC
    const snapshot = await postsRef
        .where('type', '==', 'event')
        .where('voteClosed', '==', false) // Note: This field must exist and be boolean false to match
        // Or if voteClosed is missing? Firestore where clause filters out missing fields.
        // We assume voteClosed is initialized or we query simply by type='event' if we suspect data quality issues.
        // But A-PLAN assumes strict indexing. 
        // Let's rely on type='event' and filter others? No, that is B-Plan.
        // Standard A-PLAN query:
        .where('voteCloseAt', '<=', now)
        .get();
    // Wait, if we add voteClosed to query, index becomes more complex.
    // Let's try minimal query: type='event' AND voteCloseAt <= now.
    // Then filter voteClosed in memory (it's small subset presumably).
    // BUT, user's instruction implies A-PLAN uses specific index to avoid scanning all events.
    // Let's stick to the prompt's implied "Index-based".
    // If I query type='event' AND voteCloseAt <= now, I definitely need an index on (type, voteCloseAt).

    console.log(`[A-PLAN] Query returned ${snapshot.size} candidates.`);
    await processDocs(snapshot.docs, isDryRun, 'A-PLAN');
}

// B-PLAN: Memory Scan (Fallback)
async function runPlanB(isDryRun) {
    console.log(`[Mode] B-PLAN: Memory Scan (Scan all events -> filter in code)`);
    const postsRef = db.collection(`clubs/${CLUB_ID}/posts`);

    // Query only by type='event' (Single field index usually exists)
    const snapshot = await postsRef.where('type', '==', 'event').get();
    console.log(`[B-PLAN] Scanned ${snapshot.size} total event posts.`);

    const nowValid = new Date();
    const candidates = [];

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.voteClosed === true) continue;
        if (!data.voteCloseAt) continue;
        const closeAtDate = data.voteCloseAt.toDate();
        if (closeAtDate > nowValid) continue;

        candidates.push(doc);
    }

    console.log(`[B-PLAN] Filtered down to ${candidates.length} expired candidates.`);
    await processDocs(candidates, isDryRun, 'B-PLAN');
}

async function processDocs(docs, isDryRun, mode) {
    if (docs.length === 0) {
        console.log(`[${mode}] No expired votes found.`);
        return;
    }

    let updateCount = 0;
    let batch = db.batch();
    let batchSize = 0;

    for (const doc of docs) {
        const data = doc.data();
        const closeAtDate = data.voteCloseAt ? data.voteCloseAt.toDate() : '???';

        console.log(`[TARGET] ${doc.id}: closeAt=${closeAtDate.toISOString()} <= Now`);

        if (!isDryRun) {
            batch.update(doc.ref, {
                voteClosed: true,
                voteClosedAt: FieldValue.serverTimestamp(),
                voteClosedBy: `ops-script-${mode}`,
                updatedAt: FieldValue.serverTimestamp()
            });
            batchSize++;
            if (batchSize >= 400) {
                await batch.commit();
                batch = db.batch();
                batchSize = 0;
            }
        }
        updateCount++;
    }

    if (updateCount > 0) {
        if (!isDryRun) {
            if (batchSize > 0) await batch.commit();
            console.log(`[${mode}] ✅ APPLY: Closed ${updateCount} expired votes.`);
        } else {
            console.log(`[${mode}] 🧪 DRY-RUN: Would close ${updateCount} expired votes.`);
        }
    }
}

run().catch(console.error);
