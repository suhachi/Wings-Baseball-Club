// Firebase Firestore 데이터 타입 정의

export type UserRole = 'PRESIDENT' | 'DIRECTOR' | 'TREASURER' | 'ADMIN' | 'MEMBER';
export type PostType = 'notice' | 'free' | 'event';
export type EventType = 'PRACTICE' | 'GAME';
export type AttendanceStatus = 'attending' | 'absent' | 'maybe' | 'none';
export type PushStatus = 'SENT' | 'FAILED' | 'PENDING';
export type NotificationType = 'notice' | 'comment' | 'like' | 'event' | 'mention' | 'system';

// User Document
export interface UserDoc {
  uid: string;
  email: string; // [v2.0] Essential
  realName: string; // [v2.0] Essential
  phone: string; // [v2.0] Essential
  nickname?: string | null;
  photoURL?: string | null;
  role: UserRole;
  position?: string;
  backNumber?: number | null;
  status: 'pending' | 'active' | 'rejected' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
}



// Post Document
export interface PostDoc {
  id: string;
  type: PostType;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
  commentCount?: number;

  // Event specific
  eventType?: EventType;
  startAt?: Date | null;
  place?: string | null;
  opponent?: string | null;
  voteCloseAt?: Date;
  voteClosed?: boolean;


  // Push specific (notice only)
  pushStatus?: PushStatus;
  pushSentAt?: Date;
  pushError?: string;
}

// Comment Document
export interface CommentDoc {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
}

// Attendance Document
export interface AttendanceDoc {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  status: AttendanceStatus;
  updatedAt: Date;
}


// Notification Document (알림)
export interface NotificationDoc {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

// Activity Log Document
export interface ActivityLogDoc {
  id: string;
  userId: string;
  userName: string;
  type: 'post' | 'comment' | 'attendance' | 'vote';
  action: string;
  target?: string;
  createdAt: Date;
}