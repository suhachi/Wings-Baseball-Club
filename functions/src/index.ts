import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

// Export callables
export * from './callables/members';
export * from './callables/notices';
export * from './callables/tokens';
export * from './callables/events'; // μATOM-0531: createEventPost
export * from './callables/comments.moderation'; // C03-04: Comment Moderation

// Export scheduled functions
// Export scheduled functions
// Export triggers
export * from './triggers/comments.commentCount'; // C03-05: Comment Count Trigger

