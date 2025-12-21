/**
 * 1-time Migration Script
 * backNumber: string | undefined  → number | null
 *
 * Usage:
 *  npx ts-node scripts/migrate-backNumber-to-number.ts --dry-run
 *  npx ts-node scripts/migrate-backNumber-to-number.ts --apply
 */

import admin from 'firebase-admin';

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

if (!DRY_RUN && !APPLY) {
    console.error('❌ 반드시 --dry-run 또는 --apply 중 하나를 지정하세요');
    process.exit(1);
}

// Initialize Admin
// Note: If running locally with emulator, ensure FIRESTORE_EMULATOR_HOST is set or use local credentials.
// If running against production, ensure GOOGLE_APPLICATION_CREDENTIALS is set or you are logged in via gcloud.
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'wings-baseball-club' // Explicitly set for safety if not inferred
    });
}

const db = admin.firestore();
const CLUB_ID = 'WINGS';

function normalizeBackNumber(value: any): number | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return null;
        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

async function migrateMembers() {
    const projectId = admin.app().options.projectId || process.env.GCLOUD_PROJECT || 'unknown-project';
    console.log(`Starting BackNumber Migration on Project: [${projectId}]`);
    console.log(`Mode: ${DRY_RUN ? '🧪 DRY-RUN' : '🚀 APPLY'}`);

    const snapshot = await db
        .collection('clubs')
        .doc(CLUB_ID)
        .collection('members')
        .get();

    console.log(`📦 Scanned members docs: ${snapshot.size}`);

    const stats = {
        scanned: snapshot.size,
        targeted: 0,
        updatedMembers: 0,
        updatedUsers: 0,
        skippedAlreadyClean: 0
    };

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const before = data.backNumber;

        // C. Target Logic
        // Skip if already number or null (Clean)
        if (before === null || typeof before === 'number') {
            stats.skippedAlreadyClean++;
            continue;
        }

        // If undefined -> treat as null
        // If string -> normalize
        const after = normalizeBackNumber(before);

        stats.targeted++;
        console.log(`[${doc.id}] Change: ${JSON.stringify(before)} -> ${after}`);

        if (APPLY) {
            // 1. Update Member
            await doc.ref.set(
                {
                    backNumber: after,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
            stats.updatedMembers++;

            // 2. Sync User (Only if exists to prevent orphans)
            const userRef = db.collection('users').doc(doc.id);
            const userSnap = await userRef.get();
            if (userSnap.exists) {
                await userRef.set(
                    {
                        backNumber: after,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
                stats.updatedUsers++;
            } else {
                console.log(`   └─ Skip Global User Sync (Doc not found)`);
            }
        }
    }

    console.log('---------------------------------------------------');
    console.log(`🏁 Migration finished.`);
    console.log(`📊 Stats:`, stats);
}

migrateMembers()
    .then(() => {
        console.log('🏁 Migration finished');
        process.exit(0);
    })
    .catch((err) => {
        console.error('🔥 Migration error', err);
        process.exit(1);
    });
