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
  updateComment as updateCommentInDb,
  deleteComment as deleteCommentInDb,
  getAttendances,
  updateAttendance as updateAttendanceInDb,
  getMembers,
  getUserNotifications,
  markNotificationAsRead as markNotificationAsReadInDb,
  markAllNotificationsAsRead as markAllNotificationsAsReadInDb,
} from '../../lib/firebase/firestore.service';
import { PostDoc, CommentDoc, AttendanceDoc, AttendanceStatus, PostType } from '../../lib/firebase/types';
import type { UserRole } from '../../lib/firebase/types';

// ATOM-08: Access Gate - default club ID (나중에 ClubContext와 통합 가능)
// const DEFAULT_CLUB_ID = 'default-club';

// Re-export types
export type { PostType, AttendanceStatus, UserRole };

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

  pushStatus?: 'SENT' | 'FAILED' | 'PENDING';
  pushError?: string;
  pushSentAt?: Date;
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
  nickname?: string | null;
  photoURL?: string | null;
  role: UserRole;
  position?: string | null;
  backNumber?: string | null;
  status: 'pending' | 'active' | 'rejected' | 'withdrawn';
  createdAt: Date;
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
  updateComment: (postId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  updateAttendance: (postId: string, userId: string, status: AttendanceStatus) => Promise<void>;
  getMyAttendance: (postId: string, userId: string) => AttendanceStatus;
  loadAttendances: (postId: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  refreshMembers: () => Promise<void>; // Added
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
      const { posts: postsData } = await getPosts(currentClubId);

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
          post.startAt = postDoc.startAt || undefined;
          post.place = postDoc.place || undefined;
          post.opponent = postDoc.opponent || undefined;
          post.voteCloseAt = postDoc.voteCloseAt || undefined;
          post.voteClosed = postDoc.voteClosed;
        }

        // Push specific (notice only)
        if (postDoc.pushStatus) {
          post.pushStatus = postDoc.pushStatus;
          post.pushError = postDoc.pushError;
          post.pushSentAt = postDoc.pushSentAt;
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

  // 멤버 로드 (exposed as refreshMembers)
  const refreshMembers = async () => {
    try {
      const membersData = await getMembers(currentClubId);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  // Keep loadMembers for internal useEffect usage if needed, or just use refreshMembers
  const loadMembers = refreshMembers;

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
    } else {
      // μATOM-0405: 로그아웃 시 상태 초기화
      // user가 null이면 모든 데이터 초기화
      setPosts([]);
      setComments({});
      setAttendances({});
      setAttendanceRecords([]);
      setMembers([]);
      setNotifications([]);
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
        authorPhotoURL: user.photoURL || undefined,
        pinned: postData.pinned,
      };

      // Event specific
      if (postData.eventType) {
        newPostData.eventType = postData.eventType;
        newPostData.startAt = postData.startAt ?? undefined;
        newPostData.place = postData.place || null;
        newPostData.opponent = postData.opponent || null;
        newPostData.voteCloseAt = postData.voteCloseAt ?? undefined;
        newPostData.voteClosed = false;
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
          photoURL: commentDoc.authorPhotoURL ?? undefined,
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
      // Note: addCommentInDb(clubId, postId, data)
      const commentDataForDb: Omit<CommentDoc, 'id' | 'createdAt' | 'updatedAt' | 'postId'> = {
        content,
        authorId: user.id,
        authorName: user.realName,
        authorPhotoURL: user.photoURL ?? undefined,
      };

      await addCommentInDb(currentClubId, postId, commentDataForDb);
      await loadComments(postId);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // 댓글 업데이트
  const updateComment = async (postId: string, commentId: string, content: string) => {
    if (!user) return;

    try {
      await updateCommentInDb(currentClubId, postId, commentId, { content });
      await loadComments(postId);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };

  // 댓글 삭제
  const deleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteCommentInDb(currentClubId, postId, commentId);
      await loadComments(postId);
    } catch (error) {
      console.error('Error deleting comment:', error);
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
        updateComment,
        deleteComment,
        updateAttendance,
        getMyAttendance,
        loadAttendances,
        loadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        refreshMembers,
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