"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reqString = reqString;
exports.optString = optString;
exports.reqArray = reqArray;
exports.reqNumber = reqNumber;
exports.optNumber = optNumber;
exports.reqBoolean = reqBoolean;
exports.optBoolean = optBoolean;
exports.reqTimestamp = reqTimestamp;
exports.optTimestamp = optTimestamp;
exports.reqDate = reqDate;
exports.optDate = optDate;
const errors_1 = require("./errors");
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
function reqString(v, field, min = 1, max = 2000) {
    if (typeof v !== 'string')
        throw errors_1.Err.invalidArgument(`${field} must be a string`);
    const s = v.trim();
    if (s.length < min)
        throw errors_1.Err.invalidArgument(`${field} is required (min ${min} chars)`);
    if (s.length > max)
        throw errors_1.Err.invalidArgument(`${field} is too long (max ${max} chars)`);
    return s;
}
/**
 * 선택 문자열 검증 (null/undefined 허용)
 *
 * @example
 * const nickname = optString(data.nickname, 'nickname', 30);
 */
function optString(v, field, max = 2000) {
    if (v == null)
        return undefined;
    if (typeof v !== 'string')
        throw errors_1.Err.invalidArgument(`${field} must be a string`);
    const s = v.trim();
    if (!s)
        return undefined;
    if (s.length > max)
        throw errors_1.Err.invalidArgument(`${field} is too long (max ${max} chars)`);
    return s;
}
/**
 * 필수 배열 검증
 *
 * @example
 * const recorderIds = reqArray<string>(data.recorderUserIds, 'recorderUserIds', 10);
 */
function reqArray(v, field, maxLen = 50) {
    if (!Array.isArray(v))
        throw errors_1.Err.invalidArgument(`${field} must be an array`);
    if (v.length > maxLen)
        throw errors_1.Err.invalidArgument(`${field} too many items (max ${maxLen})`);
    return v;
}
/**
 * 필수 숫자 검증
 *
 * @example
 * const amount = reqNumber(data.amount, 'amount', 0, 1000000000);
 */
function reqNumber(v, field, min, max) {
    if (typeof v !== 'number' || !Number.isFinite(v)) {
        throw errors_1.Err.invalidArgument(`${field} must be a number`);
    }
    if (min !== undefined && v < min) {
        throw errors_1.Err.invalidArgument(`${field} must be >= ${min}`);
    }
    if (max !== undefined && v > max) {
        throw errors_1.Err.invalidArgument(`${field} must be <= ${max}`);
    }
    return v;
}
/**
 * 선택 숫자 검증 (null/undefined 허용)
 *
 * @example
 * const maxUses = optNumber(data.maxUses, 'maxUses', 1, 9999);
 */
function optNumber(v, field, min, max) {
    if (v == null)
        return undefined;
    return reqNumber(v, field, min, max);
}
/**
 * 필수 불리언 검증
 *
 * @example
 * const pinned = reqBoolean(data.pinned, 'pinned');
 */
function reqBoolean(v, field) {
    if (typeof v !== 'boolean')
        throw errors_1.Err.invalidArgument(`${field} must be a boolean`);
    return v;
}
/**
 * 선택 불리언 검증 (null/undefined 허용, 기본값 반환)
 *
 * @example
 * const anonymous = optBoolean(data.anonymous, 'anonymous', false);
 */
function optBoolean(v, field, defaultValue = false) {
    if (v == null)
        return defaultValue;
    if (typeof v !== 'boolean')
        throw errors_1.Err.invalidArgument(`${field} must be a boolean`);
    return v;
}
/**
 * 타임스탬프(밀리초) 검증 및 정규화
 *
 * @example
 * const startAtMillis = reqTimestamp(data.startAtMillis, 'startAtMillis');
 */
function reqTimestamp(v, field) {
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
function optTimestamp(v, field) {
    if (v == null)
        return undefined;
    return reqTimestamp(v, field);
}
/**
 * 날짜 문자열 검증 (ISO 8601 형식 또는 타임스탬프)
 * Date 객체로 변환하여 반환
 *
 * @example
 * const startDate = reqDate(data.startDate, 'startDate');
 */
function reqDate(v, field) {
    if (v instanceof Date) {
        if (isNaN(v.getTime()))
            throw errors_1.Err.invalidArgument(`${field} is not a valid date`);
        return v;
    }
    if (typeof v === 'string') {
        const date = new Date(v);
        if (isNaN(date.getTime()))
            throw errors_1.Err.invalidArgument(`${field} is not a valid date string`);
        return date;
    }
    if (typeof v === 'number') {
        const date = new Date(reqTimestamp(v, field));
        if (isNaN(date.getTime()))
            throw errors_1.Err.invalidArgument(`${field} is not a valid timestamp`);
        return date;
    }
    throw errors_1.Err.invalidArgument(`${field} must be a Date, timestamp (number), or date string`);
}
/**
 * 선택 날짜 검증
 *
 * @example
 * const expiresAt = optDate(data.expiresAt, 'expiresAt');
 */
function optDate(v, field) {
    if (v == null)
        return undefined;
    return reqDate(v, field);
}
