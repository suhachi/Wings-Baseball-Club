import { CallableRequest } from 'firebase-functions/v2/https';
import { memberRef } from './paths';
import { Err } from './errors';

export type Role = 'PRESIDENT' | 'DIRECTOR' | 'TREASURER' | 'ADMIN' | 'MEMBER';

export function requireAuth(req: CallableRequest): string {
  if (!req.auth?.uid) throw Err.unauthenticated();
  return req.auth.uid;
}

export async function getMemberRole(clubId: string, uid: string): Promise<Role> {
  const snap = await memberRef(clubId, uid).get();
  if (!snap.exists) throw Err.permissionDenied('Not a club member');
  const r = snap.data()?.role as Role | undefined;
  if (!r) throw Err.internal('Member role missing');
  return r;
}

export async function requireRole(clubId: string, uid: string, roles: Role[]): Promise<Role> {
  const r = await getMemberRole(clubId, uid);
  if (!roles.includes(r)) {
    throw Err.permissionDenied('Insufficient role', { required: roles, actual: r });
  }
  return r;
}

export function isAdminLike(r: Role): boolean {
  return r === 'PRESIDENT' || r === 'DIRECTOR' || r === 'ADMIN';
}

export function isTreasury(r: Role): boolean {
  return r === 'PRESIDENT' || r === 'TREASURER';
}

/**
 * 멤버인지 확인 (권한 체크 없이 멤버 존재만 확인)
 * 
 * @param clubId 클럽 ID
 * @param uid 사용자 UID
 * @throws permission-denied if not a member
 */
export async function requireMember(clubId: string, uid: string): Promise<void> {
  const snap = await memberRef(clubId, uid).get();
  if (!snap.exists) {
    throw Err.permissionDenied('Not a club member');
  }
}

