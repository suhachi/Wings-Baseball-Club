import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

/**
 * 이벤트 게시글 생성 (callable)
 * 
 * μATOM-0534: 프론트 이벤트 작성 화면 + callable 호출
 */
export const createEventPostFn = httpsCallable<
  {
    clubId: string;
    eventType: 'PRACTICE' | 'GAME';
    title: string;
    content: string;
    startAt: string | number; // ISO string or timestamp
    place: string;
    opponent?: string;
    requestId: string;
  },
  {
    success: boolean;
    postId: string;
    voteCloseAt: string; // ISO string
  }
>(functions, 'createEventPost');

/**
 * 이벤트 게시글 생성
 * 
 * @param clubId 클럽 ID
 * @param eventType 이벤트 타입 (PRACTICE | GAME)
 * @param title 제목
 * @param content 내용
 * @param startAt 시작 일시 (Date 또는 ISO string)
 * @param place 장소
 * @param opponent 상대팀 (선택)
 * @returns 게시글 ID 및 투표 마감 시간
 */
export async function createEventPost(
  clubId: string,
  eventType: 'PRACTICE' | 'GAME',
  title: string,
  content: string,
  startAt: Date | string,
  place: string,
  opponent?: string
): Promise<{ postId: string; voteCloseAt: string }> {
  // UUID 생성 (requestId)
  const requestId = crypto.randomUUID();

  // startAt을 ISO string으로 변환
  const startAtISO = typeof startAt === 'string' ? startAt : startAt.toISOString();

  const result = await createEventPostFn({
    clubId,
    eventType,
    title,
    content,
    startAt: startAtISO,
    place,
    opponent,
    requestId,
  });

  return {
    postId: result.data.postId,
    voteCloseAt: result.data.voteCloseAt,
  };
}

