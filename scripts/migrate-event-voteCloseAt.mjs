
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Shared time logic (21:00 KST)
function computeVoteCloseAtKST(startAtMillis) {
    const start = new Date(startAtMillis);
    const kstTime = start.getTime() + 9 * 60 * 60 * 1000;
    const kstDate = new Date(kstTime);
    const kstYear = kstDate.getUTCFullYear();
    const kstMonth = kstDate.getUTCMonth();
    const kstDay = kstDate.getUTCDate();
    // Target: Previous Day 21:00
    const prevDayKST = new Date(Date.UTC(kstYear, kstMonth, kstDay - 1, 21, 0, 0, 0));
    return prevDayKST.getTime() - 9 * 60 * 60 * 1000;
}

// T1: Standard Project ID
const DEFAULT_PROJECT_ID = 'wings-baseball-club';
const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
const CLUB_ID = 'WINGS';

// Initialize
if (process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({ projectId });
} else {
    // In production, we trust ADC or explicit config if needed. 
    // Logging projectId for safety.
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

    console.log(`Starting migration (DryRun: ${isDryRun ? 'YES' : 'NO'})`);
    console.log(`Policy: Overwrite voteCloseAt for FUTURE events to 21:00 KST.`);

    const postsRef = db.collection(`clubs/${CLUB_ID}/posts`);
    // Ideally query future events, but 'startAt' is in the doc.
    // Query all events and filter in memory for simplicity (unless huge dataset)
    const snapshot = await postsRef.where('type', '==', 'event').get();

    console.log(`Found ${snapshot.size} event posts.`);
    let updateCount = 0;

    // Use batch (limit 500)
    let batch = db.batch();
    let batchSize = 0;

    const nowValid = new Date();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.startAt) {
            console.log(`[SKIP] ${doc.id}: No startAt`);
            continue;
        }

        const startAtDate = data.startAt.toDate();
        // Skip past events
        if (startAtDate <= nowValid) {
            console.log(`[SKIP] ${doc.id}: Past Event (${startAtDate.toISOString()})`);
            continue;
        }

        const startAtMillis = startAtDate.getTime();
        const newCloseAtMillis = computeVoteCloseAtKST(startAtMillis);
        const newCloseAt = new Date(newCloseAtMillis);

        // Check if update needed (different time)
        // Note: Firestore Timestamp precision compared to JS Date might diff slightly, ignore ms diffs if needed
        // But policy says OVERWRITE to ensure 21:00 KST.

        // Safety check: is existing closeAt same?
        if (data.voteCloseAt) {
            const currentCloseAt = data.voteCloseAt.toDate();
            if (Math.abs(currentCloseAt.getTime() - newCloseAtMillis) < 1000) {
                console.log(`[SKIP] ${doc.id}: Already correct (${newCloseAt.toISOString()})`);
                continue;
            }
        }

        console.log(`[TARGET] ${doc.id}: start=${startAtDate.toISOString()} -> newClose=${newCloseAt.toISOString()}`);

        if (!isDryRun) {
            // T4: Explicit Timestamp write
            batch.update(doc.ref, { voteCloseAt: Timestamp.fromMillis(newCloseAtMillis) });
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
            console.log(`[APPLY] Updated ${updateCount} docs.`);
        } else {
            console.log(`[DRY-RUN] Would update ${updateCount} docs.`);
        }
    } else {
        console.log('No docs to update.');
    }
}

run().catch(console.error);
