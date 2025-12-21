import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * [C03-05] Comment Count Trigger
 * 
 * Maintains `commentCount` on the parent Post document.
 * - onCreate: +1
 * - onDelete: -1 (min 0)
 * Uses transaction to ensure concurrency safety.
 */
export const onCommentCreate = functions.firestore
    .document('clubs/{clubId}/posts/{postId}/comments/{commentId}')
    .onCreate(async (_snap, context) => {
        const { clubId, postId } = context.params;
        const postRef = db.doc(`clubs/${clubId}/posts/${postId}`);

        return db.runTransaction(async (t) => {
            const postSnap = await t.get(postRef);
            if (!postSnap.exists) {
                console.log(`[commentCount] Post ${postId} does not exist. Skipping decrement.`);
                return;
            }
            const currentCount = postSnap.data()?.commentCount || 0;
            t.update(postRef, { commentCount: currentCount + 1 });
        });
    });

export const onCommentDelete = functions.firestore
    .document('clubs/{clubId}/posts/{postId}/comments/{commentId}')
    .onDelete(async (_snap, context) => {
        const { clubId, postId } = context.params;
        const postRef = db.doc(`clubs/${clubId}/posts/${postId}`);

        return db.runTransaction(async (t) => {
            const postSnap = await t.get(postRef);
            if (!postSnap.exists) {
                console.log(`[commentCount] Post ${postId} does not exist. Skipping decrement.`);
                return;
            }
            const currentCount = postSnap.data()?.commentCount || 0;
            const newCount = Math.max(0, currentCount - 1);
            t.update(postRef, { commentCount: newCount });
        });
    });
