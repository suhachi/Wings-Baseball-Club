"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.getMemberRole = getMemberRole;
exports.requireRole = requireRole;
exports.isAdminLike = isAdminLike;
exports.isTreasury = isTreasury;
exports.requireMember = requireMember;
const paths_1 = require("./paths");
const errors_1 = require("./errors");
function requireAuth(req) {
    if (!req.auth?.uid)
        throw errors_1.Err.unauthenticated();
    return req.auth.uid;
}
async function getMemberRole(clubId, uid) {
    const snap = await (0, paths_1.memberRef)(clubId, uid).get();
    if (!snap.exists)
        throw errors_1.Err.permissionDenied('Not a club member');
    const r = snap.data()?.role;
    if (!r)
        throw errors_1.Err.internal('Member role missing');
    return r;
}
async function requireRole(clubId, uid, roles) {
    const r = await getMemberRole(clubId, uid);
    if (!roles.includes(r)) {
        throw errors_1.Err.permissionDenied('Insufficient role', { required: roles, actual: r });
    }
    return r;
}
function isAdminLike(r) {
    return r === 'PRESIDENT' || r === 'DIRECTOR' || r === 'ADMIN';
}
function isTreasury(r) {
    return r === 'PRESIDENT' || r === 'TREASURER';
}
/**
 * 멤버인지 확인 (권한 체크 없이 멤버 존재만 확인)
 *
 * @param clubId 클럽 ID
 * @param uid 사용자 UID
 * @throws permission-denied if not a member
 */
async function requireMember(clubId, uid) {
    const snap = await (0, paths_1.memberRef)(clubId, uid).get();
    if (!snap.exists) {
        throw errors_1.Err.permissionDenied('Not a club member');
    }
}
