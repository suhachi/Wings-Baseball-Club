import type { UserRole } from '../../lib/firebase/types';
import { isAdminRole } from './auth/roles';

/**
 * [ATOMIC] UI Permission Guard Unification
 * Single Source of Truth for Role-Based Access Control in Client UI.
 */

// Helper to check profile completion (Sync with AuthContext logic if possible, or dry)
export const hasRequiredProfile = (realName?: string, phone?: string): boolean => {
    return !!(realName && phone);
};

export const canManageNotices = (role?: UserRole): boolean => {
    if (!role) return false;
    return isAdminRole(role);
};

export const canManageEvents = (role?: UserRole): boolean => {
    if (!role) return false;
    return isAdminRole(role);
};

export const canManageMembers = (role?: UserRole): boolean => {
    if (!role) return false;
    // Policy: TREASURER excluded from Member Management
    return isAdminRole(role);
};

export const canManageFinance = (role?: UserRole): boolean => {
    if (!role) return false;
    return isAdminRole(role); // Or TREASURER only? Keeping consistent with Firestore Rules
};

export const canManageGameRecords = (role?: UserRole): boolean => {
    if (!role) return false;
    return isAdminRole(role); // TBD: Director main
};

// ==========================================
// Granular Post Permissions (Step C00-01)
// ==========================================

export const canWritePost = (type: string, role?: UserRole, status?: string, isProfileComplete?: boolean): boolean => {
    if (!role || status !== 'active') return false;

    // [M00-06] Profile Completion Check (GateMode SOFT)
    if (!isProfileComplete) return false;

    // notice/event/poll: Admin-like only
    if (['notice', 'event', 'poll'].includes(type)) {
        return isAdminRole(role);
    }

    // free: Any active member
    if (type === 'free') {
        return true;
    }

    return false;
};

export const canEditPost = (type: string, role?: UserRole, postAuthorUid?: string, userUid?: string): boolean => {
    // Edit allows if you are author, even if profile incomplete?
    // Policy: "Post/Comment ... require hasRequiredProfile". M00-08 says write/update/delete.
    // So update also requires profile.
    // But self-profile update is exempt.
    // Let's assume edit post requires profile too.
    if (!role || !userUid) return false;
    const isAuthor = postAuthorUid === userUid;
    const isAdminLike = isAdminRole(role);

    // notice/event/poll: Admin-like only
    if (['notice', 'event', 'poll'].includes(type)) {
        return isAdminLike;
    }

    // free: Author OR Admin-like
    if (type === 'free') {
        return isAuthor || isAdminLike;
    }

    return false;
};

export const canDeletePost = (type: string, role?: UserRole, postAuthorUid?: string, userUid?: string): boolean => {
    return canEditPost(type, role, postAuthorUid, userUid);
};

// ==========================================
// Granular Comment Permissions
// ==========================================

export const canWriteComment = (status?: string, isProfileComplete?: boolean): boolean => {
    // Any authenticated active member with completed profile
    return status === 'active' && !!isProfileComplete;
};

export const canEditComment = (role?: UserRole, commentAuthorUid?: string, userUid?: string): boolean => {
    if (!role || !userUid || !commentAuthorUid) return false;
    const isAuthor = commentAuthorUid === userUid;
    const isAdminLike = isAdminRole(role);

    return isAuthor || isAdminLike;
};

export const canDeleteComment = (role?: UserRole, commentAuthorUid?: string, userUid?: string): boolean => {
    return canEditComment(role, commentAuthorUid, userUid);
};

export const canVote = (status?: string, isProfileComplete?: boolean): boolean => {
    // [M00-06] Vote Gating
    return status === 'active' && !!isProfileComplete;
};
