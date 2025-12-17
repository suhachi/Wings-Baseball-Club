// Firebase Firestore 데이터 타입 정의

export type UserRole = 'PRESIDENT' | 'DIRECTOR' | 'TREASURER' | 'ADMIN' | 'MEMBER';
export type PostType = 'notice' | 'free' | 'event' | 'meetup' | 'poll' | 'game' | 'album';
export type EventType = 'PRACTICE' | 'GAME';
export type GameType = 'LEAGUE' | 'PRACTICE';
export type AttendanceStatus = 'attending' | 'absent' | 'maybe' | 'none';
export type MediaType = 'photo' | 'video';
export type PushStatus = 'SENT' | 'FAILED' | 'PENDING';
export type NotificationType = 'notice' | 'comment' | 'like' | 'event' | 'mention' | 'system';

// User Document
export interface UserDoc {
  uid: string;
  realName: string;
  nickname?: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  position?: string;
  backNumber?: string;
  status: 'active' | 'inactive';
  invitedBy?: string;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invite Code Document
export interface InviteCodeDoc {
  code: string;
  role: UserRole;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  expiresAt?: Date;
  usedBy?: string;
  usedByName?: string;
  usedAt?: Date;
  isUsed: boolean;
  maxUses: number;
  currentUses: number;
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
  
  // Event specific
  eventType?: EventType;
  startAt?: Date;
  place?: string;
  opponent?: string;
  voteCloseAt?: Date;
  voteClosed?: boolean;
  
  // Poll specific
  choices?: Array<{ id: string; label: string; votes: string[] }>; // votes: userId[]
  multi?: boolean;
  anonymous?: boolean;
  closeAt?: Date;
  closed?: boolean;
  
  // Game specific
  gameType?: GameType;
  score?: { our: number; opp: number };
  recorders?: string[]; // userId[]
  recordingLocked?: boolean;
  recordingLockedAt?: Date;
  recordingLockedBy?: string;
  
  // Album specific
  mediaUrls?: string[];
  mediaType?: MediaType;
  
  // Push specific (notice only)
  pushStatus?: PushStatus;
  pushSentAt?: Date;
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

// Finance Document (회비/회계)
export interface FinanceDoc {
  id: string;
  type: 'income' | 'expense';
  category: 'dues' | 'event' | 'equipment' | 'other';
  amount: number;
  description: string;
  date: Date;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  
  // 회비 specific
  duesPaidBy?: string;
  duesPaidByName?: string;
  duesMonth?: string; // YYYY-MM
}

// Game Record Document (타자 기록)
export interface BatterRecordDoc {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  position: string;
  battingOrder: number;
  
  // 타석 결과
  atBats: string[]; // ['1B', 'K', 'GO', '2B', 'HR'] 등
  hits: number;
  runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Game Record Document (투수 기록)
export interface PitcherRecordDoc {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  
  // 투구 내용
  innings: number; // 이닝 수 (소수점: 1.1 = 1과 1/3이닝)
  pitches: number; // 투구 수
  hitsAllowed: number;
  runsAllowed: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  
  createdAt: Date;
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