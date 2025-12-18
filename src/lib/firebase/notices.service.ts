import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

/**
 * 공지 작성 및 푸시 발송 (callable)
 * 
 * ATOM-17: createNoticeWithPush 클라이언트 호출
 */
export const createNoticeWithPushFn = httpsCallable<
  {
    clubId: string;
    title: string;
    content: string;
    pinned?: boolean;
    requestId: string;
  },
  {
    success: boolean;
    postId: string;
    pushStatus: 'SENT' | 'FAILED';
    pushResult: {
      sent: number;
      failed: number;
    } | null;
  }
>(functions, 'createNoticeWithPush');

/**
 * 공지 작성 및 푸시 발송
 * 
 * @param clubId 클럽 ID
 * @param title 제목
 * @param content 내용
 * @param pinned 고정 여부
 * @returns 게시글 ID 및 푸시 상태
 */
export async function createNoticeWithPush(
  clubId: string,
  title: string,
  content: string,
  pinned: boolean = false
): Promise<{ postId: string; pushStatus: 'SENT' | 'FAILED'; pushResult: { sent: number; failed: number } | null }> {
  // UUID 생성 (requestId)
  const requestId = crypto.randomUUID();

  const result = await createNoticeWithPushFn({
    clubId,
    title,
    content,
    pinned,
    requestId,
  });

  return {
    postId: result.data.postId,
    pushStatus: result.data.pushStatus,
    pushResult: result.data.pushResult,
  };
}

