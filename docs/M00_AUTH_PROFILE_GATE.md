# M00: Authentication & Profile Gating

## Overview
This document outlines the authentication and profile gating policies implemented in the Wings Baseball Club application. The goal is to enforce a "SOFT" gate where users with incomplete profiles can view content but are restricted from interactive actions.

## 1. Authentication
- **Primary Method**: Email/Password.
- **Secondary Method**: Google Login (Legacy support, hidden under a text link).
- **Session**: Managed via Firebase Auth and `AuthContext`.
- **Legacy Support**: Users without a root `/users/{uid}` document will fallback to `/clubs/{clubId}/members/{uid}` for profile information.

## 2. Profile Gating Policy (SOFT)
- **Gate Condition**: User must have `realName` AND `phone` (or `phoneNumber` for legacy).
- **Scope**:
    - **Read Access**: Allowed for all "active" members (including those with incomplete profiles).
    - **Write Access**: BLOCKED for incomplete profiles.
        - Create/Edit/Delete Posts
        - Create/Edit/Delete Comments
        - Voting (Attendance)
- **User Interface**:
    - "Profile Incomplete" banner on MyPage.
    - Toast error message when attempting restricted actions, prompting user to complete profile.
- **Server Enforcement**:
    - `firestore.rules` enforces `hasRequiredProfile(clubId)` check on all write operations to `posts`, `comments`, and `attendance`.

## 3. Data Schema
- **User/Member Fields**:
    - `realName`: String (Required)
    - `phone`: String (Required, normalized from `phoneNumber`)
    - `status`: 'active' | 'pending' | 'denied' (Default: 'active')
    - `role`: 'MEMBER' | 'ADMIN' | ... (Default: 'MEMBER')

## 4. Migration
- **Pending Users**: All existing 'pending' users will be auto-migrated to 'active'.
- **Phone Number**: logic supports both `phone` and `phoneNumber` until full migration.

## 5. Verification
- Use `scripts/emulator-smoke-m00_gate.mjs` to verify:
    1.  Incomplete profile user cannot write post/comment.
    2.  Complete profile user can write.
    3.  Legacy Google user login flow.
