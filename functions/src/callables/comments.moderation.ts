import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { writeAudit } from '../shared/audit';

// Note: If db is not exported from index, use admin.firestore()
const firestore = admin.firestore();

interface ModerateCommentRequest {
    clubId: string;
    postId: string;
    commentId: string;
    action: 'EDIT' | 'DELETE';
    content?: string;      // required if EDIT
    reason?: string;       // optional, recommended
    requestId: string;      // required for idempotency
}

export const moderateComment = onCall<ModerateCommentRequest>({ region: 'asia-northeast3' }, async (request) => {
    // V2: request.data, request.auth
    const { data, auth } = request;

    // 1. Auth Check
    if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const uid = auth.uid;
    const { clubId, postId, commentId, action, content, reason, requestId } = data;

    if (!clubId || !postId || !commentId || !action || !requestId) {
        throw new HttpsError('invalid-argument', 'Missing required fields.');
    }

    if (action === 'EDIT' && !content?.trim()) {
        throw new HttpsError('invalid-argument', 'Content is required for EDIT.');
    }

    // 2. Role Check (Admin/President/Director/Treasurer)
    const memberSnap = await firestore.collection('clubs').doc(clubId).collection('members').doc(uid).get();
    if (!memberSnap.exists) {
        throw new HttpsError('permission-denied', 'Member profile not found.');
    }
    const memberData = memberSnap.data();
    const role = memberData?.role;

    // Align with isAdminLike
    if (!['PRESIDENT', 'VICE_PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN'].includes(role)) {
        throw new HttpsError('permission-denied', 'Insufficient permissions for moderation.');
    }

    // 3. Target Comment Check
    const commentRef = firestore
        .collection('clubs').doc(clubId)
        .collection('posts').doc(postId)
        .collection('comments').doc(commentId);

    const commentSnap = await commentRef.get();
    if (!commentSnap.exists) {
        throw new HttpsError('not-found', 'Comment not found.');
    }
    const beforeData = commentSnap.data();

    // 4. Exec Action
    try {
        if (action === 'EDIT') {
            const trimmedContent = content!.trim();
            await commentRef.update({
                content: trimmedContent,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                editedAt: admin.firestore.FieldValue.serverTimestamp(),
                editedBy: uid,
                editReason: reason || null,
                editedByRole: role
            });

            // Audit
            await writeAudit({
                clubId,
                actorUid: uid,
                action: 'COMMENT_EDIT',
                targetType: 'comment',
                targetId: commentId,
                before: beforeData,
                after: { ...beforeData, content: trimmedContent, editedBy: uid }, // approximation
                meta: { postId, commentId, reason, action, via: 'callable', requestId }
            });

        } else if (action === 'DELETE') {
            await commentRef.delete();

            // Audit
            await writeAudit({
                clubId,
                actorUid: uid,
                action: 'COMMENT_DELETE',
                targetType: 'comment',
                targetId: commentId,
                before: beforeData,
                after: null,
                meta: { postId, commentId, reason, action, via: 'callable', requestId }
            });
        }
    } catch (error) {
        console.error(`[moderateComment] Error:`, error);
        throw new HttpsError('internal', 'Moderation failed.');
    }

    return { success: true, action, commentId };
});
