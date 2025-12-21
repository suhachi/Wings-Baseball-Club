"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateComment = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const audit_1 = require("../shared/audit");
// Note: If db is not exported from index, use admin.firestore()
const firestore = admin.firestore();
exports.moderateComment = (0, https_1.onCall)({ region: 'asia-northeast3' }, async (request) => {
    // V2: request.data, request.auth
    const { data, auth } = request;
    // 1. Auth Check
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const uid = auth.uid;
    const { clubId, postId, commentId, action, content, reason, requestId } = data;
    if (!clubId || !postId || !commentId || !action || !requestId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields.');
    }
    if (action === 'EDIT' && !content?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Content is required for EDIT.');
    }
    // 2. Role Check (Admin/President/Director/Treasurer)
    const memberSnap = await firestore.collection('clubs').doc(clubId).collection('members').doc(uid).get();
    if (!memberSnap.exists) {
        throw new https_1.HttpsError('permission-denied', 'Member profile not found.');
    }
    const memberData = memberSnap.data();
    const role = memberData?.role;
    // Align with isAdminLike
    if (!['PRESIDENT', 'VICE_PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN'].includes(role)) {
        throw new https_1.HttpsError('permission-denied', 'Insufficient permissions for moderation.');
    }
    // 3. Target Comment Check
    const commentRef = firestore
        .collection('clubs').doc(clubId)
        .collection('posts').doc(postId)
        .collection('comments').doc(commentId);
    const commentSnap = await commentRef.get();
    if (!commentSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Comment not found.');
    }
    const beforeData = commentSnap.data();
    // 4. Exec Action
    try {
        if (action === 'EDIT') {
            const trimmedContent = content.trim();
            await commentRef.update({
                content: trimmedContent,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                editedAt: admin.firestore.FieldValue.serverTimestamp(),
                editedBy: uid,
                editReason: reason || null,
                editedByRole: role
            });
            // Audit
            await (0, audit_1.writeAudit)({
                clubId,
                actorUid: uid,
                action: 'COMMENT_EDIT',
                targetType: 'comment',
                targetId: commentId,
                before: beforeData,
                after: { ...beforeData, content: trimmedContent, editedBy: uid }, // approximation
                meta: { postId, commentId, reason, action, via: 'callable', requestId }
            });
        }
        else if (action === 'DELETE') {
            await commentRef.delete();
            // Audit
            await (0, audit_1.writeAudit)({
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
    }
    catch (error) {
        console.error(`[moderateComment] Error:`, error);
        throw new https_1.HttpsError('internal', 'Moderation failed.');
    }
    return { success: true, action, commentId };
});
