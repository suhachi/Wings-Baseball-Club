import { Err } from './errors';

/**
 * 입력 검증 유틸리티
 * 
 * 모든 callable 함수의 입력값 검증에 사용
 */

/**
 * 필수 문자열 검증
 * 
 * @example
 * const title = reqString(data.title, 'title', 2, 100);
 */
export function reqString(v: unknown, field: string, min = 1, max = 2000): string {
  if (typeof v !== 'string') throw Err.invalidArgument(`${field} must be a string`);
  const s = v.trim();
  if (s.length < min) throw Err.invalidArgument(`${field} is required (min ${min} chars)`);
  if (s.length > max) throw Err.invalidArgument(`${field} is too long (max ${max} chars)`);
  return s;
}

/**
 * 선택 문자열 검증 (null/undefined 허용)
 * 
 * @example
 * const nickname = optString(data.nickname, 'nickname', 30);
 */
export function optString(v: unknown, field: string, max = 2000): string | undefined {
  if (v == null) return undefined;
  if (typeof v !== 'string') throw Err.invalidArgument(`${field} must be a string`);
  const s = v.trim();
  if (!s) return undefined;
  if (s.length > max) throw Err.invalidArgument(`${field} is too long (max ${max} chars)`);
  return s;
}

/**
 * 필수 배열 검증
 * 
 * @example
 * const recorderIds = reqArray<string>(data.recorderUserIds, 'recorderUserIds', 10);
 */
export function reqArray<T>(v: unknown, field: string, maxLen = 50): T[] {
  if (!Array.isArray(v)) throw Err.invalidArgument(`${field} must be an array`);
  if (v.length > maxLen) throw Err.invalidArgument(`${field} too many items (max ${maxLen})`);
  return v as T[];
}

/**
 * 필수 숫자 검증
 * 
 * @example
 * const amount = reqNumber(data.amount, 'amount', 0, 1000000000);
 */
export function reqNumber(v: unknown, field: string, min?: number, max?: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw Err.invalidArgument(`${field} must be a number`);
  }
  if (min !== undefined && v < min) {
    throw Err.invalidArgument(`${field} must be >= ${min}`);
  }
  if (max !== undefined && v > max) {
    throw Err.invalidArgument(`${field} must be <= ${max}`);
  }
  return v;
}

/**
 * 선택 숫자 검증 (null/undefined 허용)
 * 
 * @example
 * const maxUses = optNumber(data.maxUses, 'maxUses', 1, 9999);
 */
export function optNumber(v: unknown, field: string, min?: number, max?: number): number | undefined {
  if (v == null) return undefined;
  return reqNumber(v, field, min, max);
}

/**
 * 필수 불리언 검증
 * 
 * @example
 * const pinned = reqBoolean(data.pinned, 'pinned');
 */
export function reqBoolean(v: unknown, field: string): boolean {
  if (typeof v !== 'boolean') throw Err.invalidArgument(`${field} must be a boolean`);
  return v;
}

/**
 * 선택 불리언 검증 (null/undefined 허용, 기본값 반환)
 * 
 * @example
 * const anonymous = optBoolean(data.anonymous, 'anonymous', false);
 */
export function optBoolean(v: unknown, field: string, defaultValue = false): boolean {
  if (v == null) return defaultValue;
  if (typeof v !== 'boolean') throw Err.invalidArgument(`${field} must be a boolean`);
  return v;
}

/**
 * 타임스탬프(밀리초) 검증 및 정규화
 * 
 * @example
 * const startAtMillis = reqTimestamp(data.startAtMillis, 'startAtMillis');
 */
export function reqTimestamp(v: unknown, field: string): number {
  const num = reqNumber(v, field, 0);
  // 타임스탬프는 일반적으로 1970-01-01 이후의 값 (음수 불가)
  // 2100년 이후의 미래 타임스탬프도 제한하지 않음 (유효성 범위는 호출자가 결정)
  return Math.floor(num); // 소수점 제거
}

/**
 * 선택 타임스탬프(밀리초) 검증
 * 
 * @example
 * const expiresAt = optTimestamp(data.expiresAt, 'expiresAt');
 */
export function optTimestamp(v: unknown, field: string): number | undefined {
  if (v == null) return undefined;
  return reqTimestamp(v, field);
}

/**
 * 날짜 문자열 검증 (ISO 8601 형식 또는 타임스탬프)
 * Date 객체로 변환하여 반환
 * 
 * @example
 * const startDate = reqDate(data.startDate, 'startDate');
 */
export function reqDate(v: unknown, field: string): Date {
  if (v instanceof Date) {
    if (isNaN(v.getTime())) throw Err.invalidArgument(`${field} is not a valid date`);
    return v;
  }
  if (typeof v === 'string') {
    const date = new Date(v);
    if (isNaN(date.getTime())) throw Err.invalidArgument(`${field} is not a valid date string`);
    return date;
  }
  if (typeof v === 'number') {
    const date = new Date(reqTimestamp(v, field));
    if (isNaN(date.getTime())) throw Err.invalidArgument(`${field} is not a valid timestamp`);
    return date;
  }
  throw Err.invalidArgument(`${field} must be a Date, timestamp (number), or date string`);
}

/**
 * 선택 날짜 검증
 * 
 * @example
 * const expiresAt = optDate(data.expiresAt, 'expiresAt');
 */
export function optDate(v: unknown, field: string): Date | undefined {
  if (v == null) return undefined;
  return reqDate(v, field);
}

