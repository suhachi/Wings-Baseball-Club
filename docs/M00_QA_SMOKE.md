
# M00: Authentication & Profile Soft Gate QA Guide (Revised)

**Gate Policy**: `SOFT`
- **Read**: Allowed for all **Club Members** (including incomplete profile). non-members blocked.
- **Act (Write/Vote)**: Blocked if profile is incomplete (missing realName/phone).
- **Login**: Email/Password (Primary) + Google Link (Secondary/Legacy).

## 1. Manual Verification Checklist

### Login UX
- [ ] Login Page shows Email/Password form as primary.
- [ ] Google Login is a text link ("기존 구글 계정으로 로그인").
- [ ] No "Pending Approval" banners visible.

### Profile Gate (Soft)
1. **Pre-condition**: Log in as a user with missing `phone` (delete from Firestore if needed).
2. **Read Access**:
   - [ ] Can view Board lists (Notice, Free, Event).
   - [ ] Can view Post Details.
3. **Write Blocking**:
   - [ ] Click "Create Post" FAB -> Toast Error ("프로필 입력이 필요합니다").
   - [ ] Post Detail -> Comment Input is disabled/hidden with message.
   - [ ] Post Detail -> Vote Buttons (Attending/Absent) -> Toast Error.
4. **Recovery**:
   - [ ] MyPage -> Shows "Profile Incomplete" banner.
   - [ ] Click "Edit/Input" -> Add Phone -> Save.
   - [ ] Retry Action (Create Post) -> Success.

## 2. Automated Smoke Test

Run the following script to verify the Soft Gate logic against Firestore Rules and Callables.

```bash
# Ensure Emulators are running (Auth, Firestore, Functions)
npm run emulators:start

# Run Smoke Test
node scripts/emulator-smoke-m00_gate.mjs
```

### Expected Output
- **Test A (Incomplete Profile)**:
  - Create Free Post: **DENIED (PASS)**
  - Create Comment: **DENIED (PASS)**
  - Vote Attendance: **DENIED (PASS)**
- **Test B (Complete Profile)**:
  - Create Free Post: **ALLOWED (PASS)**
  - Create Comment: **ALLOWED (PASS)**
  - Vote Attendance: **ALLOWED (PASS)**
- **Test C (Role/RBAC)**:
  - Treasurer Create Notice (Callable): **ALLOWED (PASS)**
