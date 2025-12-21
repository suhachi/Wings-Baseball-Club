import { functions } from './config';
import { httpsCallable } from 'firebase/functions';

interface ModerateCommentRequest {
    clubId: string;
    postId: string;
    commentId: string;
    action: 'EDIT' | 'DELETE';
    content?: string;
    reason?: string;
    requestId: string;
}

interface ModerateCommentResponse {
    success: boolean;
    action: 'EDIT' | 'DELETE';
    commentId: string;
}

export const adminEditComment = async (
    clubId: string,
    postId: string,
    commentId: string,
    content: string,
    reason?: string
): Promise<void> => {
    const moderateComment = httpsCallable<ModerateCommentRequest, ModerateCommentResponse>(
        functions,
        'moderateComment'
    );

    await moderateComment({
        clubId,
        postId,
        commentId,
        action: 'EDIT',
        content,
        reason,
        requestId: crypto.randomUUID(),
    });
};

export const adminDeleteComment = async (
    clubId: string,
    postId: string,
    commentId: string,
    reason?: string
): Promise<void> => {
    const moderateComment = httpsCallable<ModerateCommentRequest, ModerateCommentResponse>(
        functions,
        'moderateComment'
    );

    await moderateComment({
        clubId,
        postId,
        commentId,
        action: 'DELETE',
        reason,
        requestId: crypto.randomUUID(),
    });
};
