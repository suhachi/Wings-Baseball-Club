"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteAutoClose = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
/**
 * [OPTION S1] Vote Auto Close Scheduler
 *
 * Runs every 10 minutes.
 * Scans for events where:
 * 1. clubId = 'WINGS' (Fixed)
 * 2. type = 'event'
 * 3. voteClosed != true
 * 4. voteCloseAt <= now
 *
 * Updates them to voteClosed = true.
 */
exports.voteAutoClose = (0, scheduler_1.onSchedule)({
    schedule: 'every 10 minutes',
    region: 'asia-northeast3',
    timeZone: 'Asia/Seoul',
    memory: '256MiB',
}, async (event) => {
    console.log('⏰ [Scheduler] voteAutoClose started.');
    // Fixed Club ID
    const CLUB_ID = 'WINGS';
    const now = new Date();
    const postsRef = db.collection(`clubs/${CLUB_ID}/posts`);
    // Query: events that are NOT closed, and close time passed
    // Note: != true handles both false and undefined/null
    const snapshot = await postsRef
        .where('type', '==', 'event')
        .where('voteClosed', '!=', true)
        .where('voteCloseAt', '<=', now)
        .limit(200) // Batch limit
        .get();
    if (snapshot.empty) {
        console.log('✅ [Scheduler] No expired votes found.');
        return;
    }
    console.log(`🔍 [Scheduler] Found ${snapshot.size} expired events to close.`);
    const batch = db.batch();
    let count = 0;
    snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
            voteClosed: true,
            voteClosedAt: firestore_1.FieldValue.serverTimestamp(),
            voteClosedBy: 'scheduler', // System Action
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
        count++;
    });
    await batch.commit();
    console.log(`✅ [Scheduler] Successfully closed ${count} events.`);
});
