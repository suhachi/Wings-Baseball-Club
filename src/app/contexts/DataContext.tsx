import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useClub } from './ClubContext';
import {
  getPosts,
  createPost as createPostInDb,
  updatePost as updatePostInDb,
  deletePost as deletePostInDb,
  getComments,
  addComment as addCommentInDb,
  deleteComment as deleteCommentInDb,
  getAttendances,
  updateAttendance as updateAttendanceInDb,
  getUserAttendance,
  getMembers,
  getUserNotifications,
  markNotificationAsRead as markNotificationAsReadInDb,
  markAllNotificationsAsRead as markAllNotificationsAsReadInDb,
} from '../../lib/firebase/firestore.service';
import type { PostDoc, CommentDoc, AttendanceDoc, AttendanceStatus, PostType, NotificationDoc } from '../../lib/firebase/types';

// Re-export types
export type { PostType, AttendanceStatus };

export interface Post {
  id: string;
  type: PostType;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    photoURL?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
  commentCount?: number;

  // Event specific
  eventType?: 'PRACTICE' | 'GAME';
  startAt?: Date;
  place?: string;
  opponent?: string;
  voteCloseAt?: Date;
  voteClosed?: boolean;
  attendanceSummary?: {
    attending: number;
    absent: number;
    maybe: number;
  };

  // Poll specific
  choices?: Array<{ id: string; label: string; count: number }>;
  multi?: boolean;
  anonymous?: boolean;
  closeAt?: Date;
  closed?: boolean;

  // Game specific
  gameType?: 'LEAGUE' | 'PRACTICE';
  score?: { our: number; opp: number };
  recorders?: string[];
  recordingLocked?: boolean;
  recordingLockedAt?: Date;
  recordingLockedBy?: string;

  // Album specific
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';

  // Push specific
  pushStatus?: 'SENT' | 'FAILED' | 'PENDING';
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: {
    id: string;
    name: string;
    photoURL?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  postId: string;
  userId: string;
  status: AttendanceStatus;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  status: AttendanceStatus;
  updatedAt: Date;
}

export interface Member {
  id: string;
  realName: string;
  nickname?: string;
  photoURL?: string;
  role: string;
  position?: string;
  backNumber?: string;
  status: 'active' | 'inactive';
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

interface DataContextType {
  posts: Post[];
  comments: Record<string, Comment[]>;
  attendances: Record<string, Attendance[]>;
  attendanceRecords: AttendanceRecord[];
  members: Member[];
  notifications: Notification[];
  loading: boolean;
  refreshPosts: () => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author'>) => Promise<void>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateAttendance: (postId: string, userId: string, status: AttendanceStatus) => Promise<void>;
  getMyAttendance: (postId: string, userId: string) => AttendanceStatus;
  loadAttendances: (postId: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentClubId } = useClub();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [attendances, setAttendances] = useState<Record<string, Attendance[]>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // 게시글 로드
  const refreshPosts = async () => {
    try {
      setLoading(true);
      const postsData = await getPosts(currentClubId);

      // Firebase PostDoc을 Post로 변환
      const transformedPosts: Post[] = postsData.map((postDoc) => {
        const post: Post = {
          id: postDoc.id,
          type: postDoc.type,
          title: postDoc.title,
          content: postDoc.content,
          author: {
            id: postDoc.authorId,
            name: postDoc.authorName,
            photoURL: postDoc.authorPhotoURL,
          },
          createdAt: postDoc.createdAt,
          updatedAt: postDoc.updatedAt,
          pinned: postDoc.pinned,
          commentCount: 0, // 나중에 계산
        };

        // Event specific
        if (postDoc.eventType) {
          post.eventType = postDoc.eventType;
          post.startAt = postDoc.startAt;
          post.place = postDoc.place;
          post.opponent = postDoc.opponent;
          post.voteCloseAt = postDoc.voteCloseAt;
          post.voteClosed = postDoc.voteClosed;
        }

        // Poll specific
        if (postDoc.choices) {
          post.choices = postDoc.choices.map((choice) => ({
            id: choice.id,
            label: choice.label,
            count: choice.votes?.length || 0,
          }));
          post.multi = postDoc.multi;
          post.anonymous = postDoc.anonymous;
          post.closeAt = postDoc.closeAt;
          post.closed = postDoc.closed;
        }

        // Game specific
        if (postDoc.gameType) {
          post.gameType = postDoc.gameType;
          post.score = postDoc.score;
          post.recorders = postDoc.recorders;
          post.recordingLocked = postDoc.recordingLocked;
          post.recordingLockedAt = postDoc.recordingLockedAt;
          post.recordingLockedBy = postDoc.recordingLockedBy;
        }

        // Album specific
        if (postDoc.mediaUrls && postDoc.mediaUrls.length > 0) {
          post.mediaUrl = postDoc.mediaUrls[0];
          post.mediaType = postDoc.mediaType;
        }

        // Push specific
        if (postDoc.pushStatus) {
          post.pushStatus = postDoc.pushStatus;
        }

        return post;
      });

      setPosts(transformedPosts);

      // 각 게시글의 출석 현황 로드 (이벤트 타입만)
      for (const post of transformedPosts) {
        if (post.type === 'event') {
          await loadAttendances(post.id);
        }
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // 멤버 로드
  const loadMembers = async () => {
    try {
      const membersData = await getMembers(currentClubId);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  // 알림 로드
  const loadNotifications = async () => {
    if (!user) return;

    try {
      const notificationsData = await getUserNotifications(user.id);
      const transformedNotifications: Notification[] = notificationsData.map((notificationDoc) => ({
        id: notificationDoc.id,
        type: notificationDoc.type,
        title: notificationDoc.title,
        message: notificationDoc.message,
        link: notificationDoc.link,
        read: notificationDoc.read,
        createdAt: notificationDoc.createdAt,
      }));

      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (user) {
      refreshPosts();
      loadMembers();
      loadNotifications();
    }
  }, [user]);

  // 게시글 추가
  const addPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author'>) => {
    if (!user) return;

    try {
      const newPostData: Omit<PostDoc, 'id' | 'createdAt' | 'updatedAt'> = {
        type: postData.type,
        title: postData.title,
        content: postData.content,
        authorId: user.id,
        authorName: user.realName,
        authorPhotoURL: user.photoURL,
        pinned: postData.pinned,
      };

      // Event specific
      if (postData.eventType) {
        newPostData.eventType = postData.eventType;
        newPostData.startAt = postData.startAt || null;
        newPostData.place = postData.place || null;
        newPostData.opponent = postData.opponent || null;
        newPostData.voteCloseAt = postData.voteCloseAt || null;
        newPostData.voteClosed = false;
      }

      // Poll specific
      if (postData.choices) {
        newPostData.choices = postData.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          votes: [],
        }));
        newPostData.multi = postData.multi;
        newPostData.anonymous = postData.anonymous;
        newPostData.closeAt = postData.closeAt;
        newPostData.closed = false;
      }

      // Game specific
      if (postData.gameType) {
        newPostData.gameType = postData.gameType;
        newPostData.score = postData.score;
        newPostData.recorders = [];
        newPostData.recordingLocked = false;
      }

      await createPostInDb(currentClubId, newPostData);
      await refreshPosts();
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  };

  // 게시글 업데이트
  const updatePost = async (id: string, updates: Partial<Post>) => {
    try {
      await updatePostInDb(currentClubId, id, updates as Partial<PostDoc>);
      await refreshPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  // 게시글 삭제
  const deletePost = async (id: string) => {
    try {
      await deletePostInDb(currentClubId, id);
      await refreshPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  // 댓글 로드
  const loadComments = async (postId: string) => {
    try {
      const commentsData = await getComments(currentClubId, postId);
      const transformedComments: Comment[] = commentsData.map((commentDoc) => ({
        id: commentDoc.id,
        postId: commentDoc.postId,
        content: commentDoc.content,
        author: {
          id: commentDoc.authorId,
          name: commentDoc.authorName,
          photoURL: commentDoc.authorPhotoURL,
        },
        createdAt: commentDoc.createdAt,
        updatedAt: commentDoc.updatedAt,
      }));

      setComments((prev) => ({
        ...prev,
        [postId]: transformedComments,
      }));

      // 댓글 수 업데이트
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, commentCount: transformedComments.length } : post
        )
      );
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // 댓글 추가
  const addComment = async (postId: string, content: string) => {
    if (!user) return;

    try {
      const commentData: Omit<CommentDoc, 'id' | 'createdAt' | 'updatedAt'> = {
        postId,
        content,
        authorId: user.id,
        authorName: user.realName,
        authorPhotoURL: user.photoURL,
      };

      // Note: addCommentInDb(clubId, postId, data)
      const commentDataForDb: Omit<CommentDoc, 'id' | 'createdAt' | 'updatedAt' | 'postId'> = {
        content,
        authorId: user.id,
        authorName: user.realName,
        authorPhotoURL: user.photoURL,
      };

      await addCommentInDb(currentClubId, postId, commentDataForDb);
      await loadComments(postId);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // 출석 현황 로드
  const loadAttendances = async (postId: string) => {
    try {
      const attendancesData = await getAttendances(currentClubId, postId);
      const transformedAttendances: Attendance[] = attendancesData.map((attendanceDoc) => ({
        postId: attendanceDoc.postId,
        userId: attendanceDoc.userId,
        status: attendanceDoc.status,
        updatedAt: attendanceDoc.updatedAt,
      }));

      setAttendances((prev) => ({
        ...prev,
        [postId]: transformedAttendances,
      }));

      // 출석 기록 업데이트 (플랫 배열)
      const transformedRecords: AttendanceRecord[] = attendancesData.map((attendanceDoc) => ({
        id: attendanceDoc.id,
        postId: attendanceDoc.postId,
        userId: attendanceDoc.userId,
        userName: attendanceDoc.userName,
        status: attendanceDoc.status,
        updatedAt: attendanceDoc.updatedAt,
      }));

      setAttendanceRecords((prev) => {
        // 기존 기록에서 같은 postId의 기록을 제거하고 새로운 기록을 추가
        const filtered = prev.filter((record) => record.postId !== postId);
        return [...filtered, ...transformedRecords];
      });

      // 출석 요약 계산
      const summary = {
        attending: transformedAttendances.filter((a) => a.status === 'attending').length,
        absent: transformedAttendances.filter((a) => a.status === 'absent').length,
        maybe: transformedAttendances.filter((a) => a.status === 'maybe').length,
      };

      // 게시글 업데이트
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, attendanceSummary: summary } : post
        )
      );
    } catch (error) {
      console.error('Error loading attendances:', error);
    }
  };

  // 출석 업데이트
  const updateAttendance = async (postId: string, userId: string, status: AttendanceStatus) => {
    if (!user) return;

    try {
      const attendanceData: Omit<AttendanceDoc, 'id' | 'updatedAt'> = {
        postId,
        userId,
        userName: user.realName,
        status,
      };

      // Note: updateAttendanceInDb(clubId, postId, userId, data)
      const attendanceDataForDb: Omit<AttendanceDoc, 'id' | 'updatedAt' | 'postId' | 'userId'> = {
        userName: user.realName,
        status,
      };

      await updateAttendanceInDb(currentClubId, postId, userId, attendanceDataForDb);
      await loadAttendances(postId);
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  };

  // 내 출석 상태 가져오기
  const getMyAttendance = (postId: string, userId: string): AttendanceStatus => {
    const postAttendances = attendances[postId] || [];
    const myAttendance = postAttendances.find((a) => a.userId === userId);
    return myAttendance?.status || 'none';
  };

  // 알림 읽음 표시
  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await markNotificationAsReadInDb(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  // 모든 알림 읽음 표시
  const markAllNotificationsAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsReadInDb(user.id);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider
      value={{
        posts,
        comments,
        attendances,
        attendanceRecords,
        members,
        notifications,
        loading,
        refreshPosts,
        addPost,
        updatePost,
        deletePost,
        loadComments,
        addComment,
        updateAttendance,
        getMyAttendance,
        loadAttendances,
        loadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};