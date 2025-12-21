import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Assumes GOOGLE_APPLICATION_CREDENTIALS or pre-configured environment)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();
const CLUB_ID = 'WINGS'; // Target Club

async function provisionMembers() {
    console.log(`Starting provisionMembers script for club: ${CLUB_ID}`);

    try {
        const listUsersResult = await auth.listUsers(1000);
        const users = listUsersResult.users;
        console.log(`Found ${users.length} users in Auth.`);

        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const user of users) {
            const uid = user.uid;
            const memberRef = db.collection('clubs').doc(CLUB_ID).collection('members').doc(uid);
            const memberSnap = await memberRef.get();

            if (!memberSnap.exists) {
                console.log(`[PROVISION] Creating member for ${user.email} (${uid})`);

                // Fetch global profile if needed (optional, here we rely on Auth info)
                try {
                    await memberRef.set({
                        uid,
                        email: user.email || '',
                        realName: user.displayName || 'Unknown',
                        nickname: user.displayName || 'Unknown',
                        phone: '', // Can't get phone from Auth easily unless provided, set empty
                        photoURL: user.photoURL || null,
                        role: 'MEMBER',
                        status: 'active', // Auto-active
                        clubId: CLUB_ID,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    createdCount++;
                } catch (err) {
                    console.error(`Error creating member for ${uid}:`, err);
                    errorCount++;
                }
            } else {
                // Optional: If status is 'pending', force update to 'active'?
                // Policy A03 says: "status !== 'active'면 기존대로 denied" in checkMemberAccess.
                // But A06 says "기존 계정 복구". If user is pending, should we activate?
                // Let's activate pending users too for this "Reset".
                const data = memberSnap.data();
                if (data?.status === 'pending') {
                    console.log(`[ACTIVATE] Activating pending user ${user.email} (${uid})`);
                    await memberRef.update({
                        status: 'active',
                        role: data.role || 'MEMBER', // Ensure role
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    createdCount++;
                } else {
                    skippedCount++;
                }
            }
        }

        console.log(`\nProvisioning Complete.`);
        console.log(`Created/Activated: ${createdCount}`);
        console.log(`Skipped (Already Active): ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Error listing users:', error);
    }
}

provisionMembers();
