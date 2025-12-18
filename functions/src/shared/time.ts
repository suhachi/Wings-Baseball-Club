/**
 * 시간 계산 유틸리티
 * 
 * PRD v1.0 정책: 출석 투표 마감은 "시작일 전날 23:00" (KST 기준)
 */

/**
 * 투표 마감 시간 계산 (KST 기준: 시작일 전날 23:00)
 * 
 * 정책: 일정 시작일 전날 23:00 KST에 출석 투표 마감
 * 
 * @param startAtMillis 시작일 타임스탬프 (밀리초, UTC)
 * @returns voteCloseAt 타임스탬프 (밀리초, UTC)
 * 
 * @example
 * const startAt = Date.parse('2025-12-20T10:00:00+09:00'); // 2025년 12월 20일 10:00 KST
 * const voteCloseAt = computeVoteCloseAtKST(startAt);
 * // 결과: 2025년 12월 19일 23:00 KST (UTC로 변환된 타임스탬프)
 */
export function computeVoteCloseAtKST(startAtMillis: number): number {
  // 정책: 시작일 전날 23:00 (KST 고정)
  // 
  // 로직:
  // 1. UTC 타임스탬프를 KST로 변환하여 날짜 추출
  // 2. 시작일의 전날을 계산 (KST 기준)
  // 3. 전날 23:00 KST를 UTC 타임스탬프로 변환하여 반환
  //
  // KST = UTC + 9시간
  // KST 00:00 = UTC 15:00 (전날)
  // KST 23:00 = UTC 14:00 (같은 날)

  const start = new Date(startAtMillis);
  
  // KST 시간으로 변환 (UTC + 9시간)
  const kstTime = start.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstTime);
  
  // KST 기준 연도/월/일 추출
  const kstYear = kstDate.getUTCFullYear();
  const kstMonth = kstDate.getUTCMonth();
  const kstDay = kstDate.getUTCDate();
  
  // 전날 계산 (KST 기준)
  const prevDayKST = new Date(Date.UTC(kstYear, kstMonth, kstDay - 1, 23, 0, 0, 0));
  
  // UTC로 변환 (KST - 9시간)
  return prevDayKST.getTime() - 9 * 60 * 60 * 1000;
}

