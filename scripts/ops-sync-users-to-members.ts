
/**
 * Ops Script: Sync Global Users to Club Members (WINGS)
 * 
 * Purpose:
 *  Finds users in global `users` collection who are missing from `clubs/WINGS/members`.
 *  Creates the missing member document to make them visible in the Admin Dashboard.
 * 
 * Usage:
 *  npx ts-node scripts/ops-sync-users-to-members.ts --dry-run
 *  npx ts-node scripts/ops-sync-users-to-members.ts --apply
 */

import admin from 'firebase-admin';

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

if (!DRY_RUN && !APPLY) {
    console.error('❌ Specify --dry-run or --apply');
    process.exit(1);
}

// Initialize Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'wings-baseball-club'
    });
}

const db = admin.firestore();
const CLUB_ID = 'WINGS';

async function syncUsersToMembers() {
    console.log(`Starting User->Member Sync for Club: [${CLUB_ID}]`);
    console.log(`Mode: ${DRY_RUN ? '🧪 DRY-RUN' : '🚀 APPLY'}`);

    // 1. Get all global users
    const usersSnap = await db.collection('users').get();
    console.log(`📦 Global Users found: ${usersSnap.size}`);

    const stats = {
        scanned: usersSnap.size,
        missing: 0,
        synced: 0,
        skippedExisting: 0
    };

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();

        // 2. Check if member exists
        const memberRef = db.collection('clubs').doc(CLUB_ID).collection('members').doc(uid);
        const memberSnap = await memberRef.get();

        if (memberSnap.exists) {
            stats.skippedExisting++;
            continue;
        }

        // 3. Prepare Member Data
        stats.missing++;
        const now = admin.firestore.FieldValue.serverTimestamp();

        // Default payload for new member
        const memberPayload = {
            uid: uid,
            email: userData.email || '',
            realName: userData.realName || userData.displayName || 'Unknown',
            nickname: userData.nickname || userData.displayName || 'Unknown',
            phone: userData.phone || '',
            photoURL: userData.photoURL || null,
            role: 'MEMBER',      // Default Role
            status: 'active',    // Default Status (Active per policy)
            clubId: CLUB_ID,
            backNumber: userData.backNumber || null, // Best effort copy
            createdAt: userData.createdAt || now,    // Preserve signup time if possible
            updatedAt: now
        };

        console.log(`[MISSING] ${uid} (${memberPayload.realName}) -> Creating Member...`);

        if (APPLY) {
            await memberRef.set(memberPayload);
            stats.synced++;
        }
    }

    console.log('---------------------------------------------------');
    console.log(`🏁 Sync finished.`);
    console.log(`📊 Stats:`, stats);
}

syncUsersToMembers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('🔥 Error', err);
        process.exit(1);
    });
