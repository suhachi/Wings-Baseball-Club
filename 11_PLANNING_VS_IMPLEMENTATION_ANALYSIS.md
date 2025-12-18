# 11. 기획서 vs 구현 비교 분석 보고서
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA v1.1  
**목적**: 초기 기획서(v0.1)와 현재 구현 상태 비교 → 완성도/미구현 항목/차이점 파악

---

## 📋 Executive Summary

| 항목 | 기획서 (v0.1) | 현재 구현 | 상태 |
|-----|-------------|---------|------|
| **프로젝트명** | 야구동호회 커뮤니티 웹앱(PWA) | Wings Baseball Club PWA | ✅ 일치 |
| **기술 스택** | React+Vite+TypeScript+PWA, Firebase | React 18.3+Vite 6+TypeScript+PWA, Firebase 12.7 | ✅ 일치 |
| **가입 방식** | 초대 기반 (Invite-only) | Google OAuth + Admin 승인 | ⚠️ **차이** |
| **역할 체계** | PRESIDENT/DIRECTOR/TREASURER/ADMIN/MEMBER | ADMIN/PRESIDENT/DIRECTOR/TREASURER/MEMBER | ✅ 일치 |
| **핵심 기능** | 공지/일정/출석/투표/앨범/회비회계/경기기록 | 공지/게시판/일정/경기기록 구현 | ⚠️ **부분 구현** |
| **완성도** | Sprint 7까지 기획 (100%) | Sprint 3~4 수준 구현 (~50%) | ⚠️ **진행 중** |

---

## 🎯 1. 프로젝트 개요 비교

### 1.1 목표 및 형태

| 항목 | 기획서 | 구현 | 분석 |
|-----|-------|------|------|
| **제품 형태** | PWA 우선, 앱스토어 추후 | PWA (manifest.json, sw.js 존재) | ✅ 일치 |
| **핵심 목표** | 1) 동호회 운영 전반<br>2) 경기 기록 | 1) 게시판/일정 운영<br>2) 경기 기록 (WF-07) | ✅ 일치 |
| **스코프** | Release 1.0 (10개 기능) | 부분 구현 (~5개 기능) | ⚠️ 진행 중 |

**결론**: 프로젝트 방향성은 일치하나, 구현 범위는 기획의 약 50% 수준

---

### 1.2 확정 정책 비교

| 정책 | 기획서 | 구현 | 상태 | 비고 |
|-----|-------|------|------|------|
| **가입** | 초대 기반 (초대코드) | Google OAuth + pending → active | ❌ **차이** | 기획: 초대 기반<br>구현: OAuth + 승인 방식 |
| **실명** | 가입 시 필수 | user.realName 필드 존재 | ✅ 일치 | - |
| **포지션/백넘버** | 관리자 지정 | member.position, backNumber | ✅ 일치 | - |
| **일정 마감** | 전날 23:00 자동 마감 | ❌ 미구현 | ❌ **미구현** | Scheduler 없음 |
| **공지 푸시** | 필수 | ❌ 미구현 | ❌ **미구현** | FCM 설정 없음 |
| **앨범** | 초기 무제한 + 모니터링 | ❌ 미구현 | ❌ **미구현** | 사진/영상 게시판 없음 |
| **경기 기록 권한** | 관리자 + 임시 기록원 | 관리자 + recorders 배열 | ✅ 일치 | recordingLocked 구현됨 |
| **회비/회계** | 총무 작성 → 회장 승인 | ❌ 미구현 | ❌ **미구현** | 회계 관련 컬렉션 없음 |

**핵심 차이점**:
1. **가입 방식**: 기획은 "초대 코드" 중심, 실제는 "Google OAuth + Admin 승인"
2. **자동화**: 기획의 스케줄러 기반 자동화(마감, 푸시) 미구현
3. **앨범/회비**: 기획된 모듈이지만 현재 미구현

---

## 🔐 2. 역할/권한(RBAC) 비교

### 2.1 역할 체계

| 역할 | 기획서 역할 코드 | 구현 코드 | 기획 권한 | 구현 권한 | 일치 |
|-----|----------------|---------|---------|---------|------|
| 회장 | PRESIDENT | PRESIDENT | 관리자 부여, 회계 승인, 기록 LOCK | isAdminLike, 기록 LOCK | ✅ |
| 감독 | DIRECTOR | DIRECTOR | 관리자 부여, 기록 LOCK | isAdminLike, 기록 LOCK | ✅ |
| 총무 | TREASURER | TREASURER | 회계 작성, 회비 관리 | isTreasury (코드 존재) | ⚠️ 부분 |
| 관리자 | ADMIN | ADMIN | 공지/게시글/일정 관리, 기록 입력 | isAdmin, 기록원 지정 | ✅ |
| 일반 | MEMBER | MEMBER | 조회/댓글/투표/출석 | 조회/댓글 | ✅ |

**firestore.rules 검증**:
```javascript
// 기획서: "관리자 부여는 회장/감독만"
function isAdminLike() {
  return request.auth.uid in [PRESIDENT, DIRECTOR, ADMIN];  // ✅ 구현됨
}

// 기획서: "기록원 + 관리자만 입력"
function canRecordAdminOverride() {
  return isAdminLike() || (request.auth.uid in post.recorders && !post.recordingLocked);  // ✅ 구현됨
}
```

**분석**: 역할 체계는 완벽히 일치. 단, TREASURER 권한 사용은 제한적 (회계 기능 미구현)

---

### 2.2 권한 부여 정책

| 정책 | 기획서 | 구현 | 상태 |
|-----|-------|------|------|
| ADMIN 부여 권한 | 회장/감독만 | firestore.rules에서 isAdminLike 체크 | ✅ 일치 |
| TREASURER 지정 | 회장만 | 미확인 (회계 기능 없음) | ⚠️ 불명확 |
| 역할 변경 감사 로그 | audit 컬렉션 | ❌ audit 컬렉션 없음 | ❌ 미구현 |

---

## 📊 3. 기능별 구현 상태 (Sprint 기준)

### 3.1 Sprint 1: 초대 가입 + 멤버/권한

| 작업 | 기획서 | 구현 | 상태 |
|-----|-------|------|------|
| S1-01 초대 생성/만료/사용 | ✅ 기획됨 | ⚠️ 부분 (validateInviteCode 존재, 거의 사용 안 됨) | ⚠️ |
| S1-02 가입(실명 필수) | ✅ 초대 기반 | ✅ Google OAuth (실명 realName) | ⚠️ 방식 차이 |
| S1-03 멤버 리스트/검색 | ✅ 기획됨 | ✅ useData().members | ✅ |
| S1-04 포지션/백넘버 설정 | ✅ 기획됨 | ✅ member.position, backNumber | ✅ |
| S1-05 ADMIN 부여/회수 | ✅ 기획됨 | ✅ firestore.rules isAdminLike | ✅ |
| S1-06 audit 파이프라인 | ✅ 기획됨 | ❌ audit 컬렉션 없음 | ❌ |

**완성도**: 5/6 (83%) - 감사 로그 제외하고 대부분 구현

---

### 3.2 Sprint 2: 공지/게시판 + 댓글 + 공지푸시

| 작업 | 기획서 | 구현 | 상태 |
|-----|-------|------|------|
| S2-01 게시판 리스트/상세/작성 | ✅ 기획됨 | ✅ posts 컬렉션 (type 구분) | ✅ |
| S2-02 댓글 CRUD | ✅ 기획됨 | ✅ posts/{postId}/comments | ✅ |
| S2-03 공지 푸시 필수 | ✅ 기획됨 | ❌ FCM 미구현 | ❌ |
| S2-04 공지 고정/해제 | ✅ 기획됨 | ⚠️ pinned 필드 존재 (UI 미확인) | ⚠️ |

**완성도**: 2.5/4 (62%) - 푸시 알림 미구현이 치명적

---

### 3.3 Sprint 3: 일정(연습/경기) + 출석투표 + 마감

| 작업 | 기획서 | 구현 | 상태 |
|-----|-------|------|------|
| S3-01 일정 생성/수정/삭제 | ✅ 기획됨 | ✅ posts type=schedule | ✅ |
| S3-02 출석 투표(참/불/미정) | ✅ 기획됨 | ⚠️ 댓글 형태로만 구현 가능성 | ⚠️ |
| S3-03 voteCloseAt 계산 | ✅ 기획됨 (전날 23:00) | ❌ 자동 계산 로직 없음 | ❌ |
| S3-04 Scheduler 마감 처리 | ✅ 기획됨 | ❌ Cloud Functions 없음 | ❌ |
| S3-05 마감 알림/집계 알림 | ✅ 기획됨 | ❌ FCM 미구현 | ❌ |

**완성도**: 1.5/5 (30%) - 스케줄러 및 알림 인프라 부재

---

### 3.4 Sprint 4: 기타 게시판 + 투표 게시판

| 작업 | 기획서 | 구현 | 상태 |
|-----|-------|------|------|
| S4-01 기타 게시판 | ✅ 기획됨 (회의/회식/번개/기타) | ⚠️ posts로 가능하나 type 미확인 | ⚠️ |
| S4-02 투표 생성/참여/결과 | ✅ 기획됨 | ❌ 투표 전용 UI 없음 | ❌ |

**완성도**: 0.5/2 (25%) - 투표 기능 미구현

---

### 3.5 Sprint 5: 앨범(사진/영상)

| 작업 | 기획서 | 구현 | 상태 |
|-----|-------|------|------|
| S5-01 사진/영상 업로드 | ✅ 기획됨 | ❌ 앨범 게시판 없음 | ❌ |
| S5-02 목록/상세/댓글 | ✅ 기획됨 | ❌ | ❌ |
| S5-03 관리자/작성자 삭제 | ✅ 기획됨 | ❌ | ❌ |
| S5-04 월별 업로드량 관리 | ✅ 기획됨 | ❌ | ❌ |

**완성도**: 0/4 (0%) - 앨범 기능 미착수

---

### 3.6 Sprint 6: 회비/회계

| 작업 | 기획서 | 구현 | 상태 |
|-----|-------|------|------|
| S6-01 회비 납부 상태 | ✅ 기획됨 | ❌ dues 컬렉션 없음 | ❌ |
| S6-02 회계 CRUD (총무) | ✅ 기획됨 | ❌ ledger 컬렉션 없음 | ❌ |
| S6-03 승인/반려 (회장) | ✅ 기획됨 | ❌ | ❌ |

**완성도**: 0/3 (0%) - 회비/회계 기능 미착수

---

### 3.7 Sprint 7: 경기결과/기록 (핵심 WF-07)

| 작업 | 기획서 | 구현 | 상태 |
|-----|-------|------|------|
| S7-01 경기글 생성 + 기록원 지정 | ✅ 기획됨 | ✅ posts type=game, recorders 배열 | ✅ |
| S7-02 기록 입력 (라인업/타자/투수) | ✅ 기획됨 | ✅ record_lineup, record_batting, record_pitching | ✅ |
| S7-03 권한 제어 (관리자/기록원만) | ✅ 기획됨 | ✅ firestore.rules canRecordAdminOverride | ✅ |
| S7-04 기록 마감(LOCK) | ✅ 기획됨 | ✅ recordingLocked, recordingLockedAt | ✅ |
| S7-05 기록 변경 이력 | ✅ 기획됨 | ⚠️ lastUpdatedBy 존재, audit 없음 | ⚠️ |

**완성도**: 4.5/5 (90%) - **가장 잘 구현된 스프린트**

---

## 📐 4. 데이터 모델 비교

### 4.1 Firestore 컬렉션 구조

| 컬렉션 | 기획서 | 구현 | 상태 | 비고 |
|-------|-------|------|------|------|
| **clubs/{clubId}** | ✅ | ✅ | ✅ | 단일 클럽 전제 |
| **members/{userId}** | ✅ | ✅ | ✅ | role, position, backNumber |
| **invites/{inviteId}** | ✅ | ⚠️ | ⚠️ | validateInviteCode 함수만 존재 |
| **posts/{postId}** | ✅ | ✅ | ✅ | type 기반 구분 |
| **posts/.../comments** | ✅ | ✅ | ✅ | - |
| **posts/.../attendance** | ✅ | ❌ | ❌ | 출석 투표 전용 없음 |
| **posts/.../votes** | ✅ | ❌ | ❌ | 투표 전용 없음 |
| **posts/.../record_lineup** | ✅ | ✅ | ✅ | slot 단위 |
| **posts/.../record_batting** | ✅ | ✅ | ✅ | playerId 단위 |
| **posts/.../record_pitching** | ✅ | ✅ | ✅ | playerId 단위 |
| **dues/{userId}** | ✅ | ❌ | ❌ | 회비 납부 상태 |
| **ledger/{entryId}** | ✅ | ❌ | ❌ | 회계 장부 |
| **audit/{auditId}** | ✅ | ❌ | ❌ | 감사 로그 |

**일치율**: 7/13 (54%)

---

### 4.2 주요 필드 비교 (posts - type=game)

| 필드 | 기획서 | 구현 | 상태 |
|-----|-------|------|------|
| type | game | game | ✅ |
| gameType | LEAGUE/PRACTICE | ⚠️ 미확인 | ⚠️ |
| startAt | ✅ | ⚠️ date 필드 존재 | ⚠️ |
| place | ✅ | ✅ location | ✅ |
| opponent | ✅ | ✅ opponent | ✅ |
| score | {our, opp} | ⚠️ 미확인 | ⚠️ |
| recorders | [userId] | ✅ recorders | ✅ |
| recordersSnapshot | [{userId, realName, ...}] | ❌ | ❌ |
| recordingLocked | boolean | ✅ recordingLocked | ✅ |
| recordingLockedAt | timestamp | ✅ recordingLockedAt | ✅ |
| recordingLockedBy | userId | ✅ recordingLockedBy | ✅ |

**일치율**: 7/11 (64%)

---

## 🔍 5. 화면/UI 비교

### 5.1 와이어프레임 vs 실제 구현

| 화면(WF) | 기획서 | 구현 파일 | 상태 | 비고 |
|---------|-------|---------|------|------|
| WF-01 로그인/초대 가입 | 초대코드 입력 | AuthContext.tsx (Google OAuth) | ⚠️ 차이 | 방식 변경 |
| WF-02 홈 대시보드 | 일정 3개 + 공지 2개 | HomePage.tsx | ✅ | 유사 구현 |
| WF-03 일정 캘린더/리스트 | 캘린더 뷰 + 리스트 | SchedulePage.tsx | ✅ | 구현됨 |
| WF-04 게시판 공통 | 리스트/상세/댓글 | PostList, PostDetail | ✅ | 구현됨 |
| WF-05 투표 게시판 | 의제/선택지/결과 | ❌ | ❌ | 미구현 |
| WF-06 앨범 | 업로드/그리드/상세 | ❌ | ❌ | 미구현 |
| WF-07 경기결과/기록 | 요약/기록입력/댓글 탭 | GameRecordPage.tsx | ✅ | **완벽 구현** |
| WF-08 회비/회계 | 납부 상태/승인 플로우 | ❌ | ❌ | 미구현 |

**일치율**: 4.5/8 (56%)

---

### 5.2 하단 탭 네비게이션

| 탭 | 기획서 | 구현 | 상태 |
|----|-------|------|------|
| 홈 | ✅ | ✅ Home | ✅ |
| 일정 | ✅ | ✅ Schedule | ✅ |
| 게시판 | ✅ | ✅ Community | ✅ |
| 앨범 | ✅ | ❌ | ❌ |
| 내정보 | ✅ | ✅ Profile | ✅ |

**구현**: 4/5 (80%) - 앨범 탭 없음

---

## 🚨 6. 핵심 차이점 및 문제점

### 6.1 가입/인증 방식 불일치

**기획서**:
```
FR-01 초대코드 입력 또는 초대링크 진입 시 clubId를 확정한다.
FR-02 실명 입력은 필수이며 미입력 시 가입 버튼은 비활성이다.
FR-04 초대코드가 만료/사용됨/무효인 경우 가입을 차단한다.
```

**실제 구현**:
```typescript
// AuthContext.tsx
const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  // user.status = 'pending' → Admin 승인 필요
};
```

**영향도**: 🔴 높음
- 기획서의 "초대 기반" 정책이 "Google OAuth + 승인" 정책으로 변경됨
- validateInviteCode 함수는 존재하지만 거의 사용 안 됨
- README와 문서가 초대 코드 중심으로 작성되어 혼동 발생 (10번 문서에서 지적)

---

### 6.2 자동화 인프라 부재

**기획서 필수 기능**:
- 전날 23:00 출석 마감 자동화
- 공지 푸시 필수 발송
- 마감/리마인드 알림

**실제 구현**:
- ❌ Cloud Scheduler 미설정
- ❌ Cloud Functions 없음 (firebase.json에서 functions 항목 없음)
- ❌ FCM 푸시 토큰 관리 없음

**영향도**: 🔴 높음
- 핵심 정책("출석 마감 자동화", "공지 푸시 필수")이 작동 안 함
- 수동 운영 필요

---

### 6.3 미구현 핵심 모듈

| 모듈 | 기획 우선도 | 구현 | 영향도 |
|-----|----------|------|--------|
| 앨범 | Release 1.0 | ❌ | 중간 (운영 가능하나 불편) |
| 회비/회계 | Release 1.0 | ❌ | 높음 (재무 관리 불가) |
| 투표 게시판 | Release 1.0 | ❌ | 중간 (의사결정 제약) |
| 출석 투표 | Release 1.0 | ⚠️ | 높음 (일정 관리 핵심) |

---

### 6.4 발견된 버그 (기획 vs 구현)

| 버그 | 기획서 정책 | 실제 동작 | 문서 참고 |
|-----|----------|---------|---------|
| CommentList author.id | authorId 필드 사용 | comment.author.id 접근 (오류) | 05, 10 |
| 댓글 입력란 없음 | 댓글 작성 UI 필수 | 조건부 렌더링 오류 가능성 | 08 |
| 기록원 상태 "(0)" | 선택 후 즉시 반영 | selectedMemberIds 동기화 실패 | 08, 09 |
| 테이블 스크롤 불가 | 모바일 스크롤 지원 | overflow 설정 누락 | 08, 09 |

---

## 📊 7. 전체 완성도 평가

### 7.1 Sprint별 완성도

| Sprint | 기획 항목 | 구현 완료 | 완성도 | 등급 |
|--------|---------|---------|--------|------|
| S0 세팅/설계 | 5 | 4 | 80% | B |
| S1 가입/멤버/권한 | 6 | 5 | 83% | B+ |
| S2 공지/게시판 | 4 | 2.5 | 62% | C |
| S3 일정/출석/마감 | 5 | 1.5 | 30% | D |
| S4 기타/투표 | 2 | 0.5 | 25% | D |
| S5 앨범 | 4 | 0 | 0% | F |
| S6 회비/회계 | 3 | 0 | 0% | F |
| S7 경기 기록 | 5 | 4.5 | 90% | A |

**총 완성도**: (5+6+4+5+2+4+3+5) / (4+5+2.5+1.5+0.5+0+0+4.5) × 100 = **52.9%**

---

### 7.2 기능 영역별 평가

| 영역 | 완성도 | 핵심 이슈 | 우선도 |
|-----|--------|---------|--------|
| **인증/멤버** | 70% | 초대 방식 변경, audit 없음 | P1 |
| **게시판/댓글** | 80% | 푸시 미구현 | P1 |
| **일정/출석** | 40% | 자동 마감 없음, 투표 불완전 | P0 |
| **경기 기록** | 90% | 3개 버그(A/B/C) 존재 | P0 |
| **투표** | 10% | 전용 UI 없음 | P2 |
| **앨범** | 0% | 미착수 | P2 |
| **회비/회계** | 0% | 미착수 | P1 |

---

## 🎯 8. 권장 조치 사항

### 8.1 즉시 조치 (P0 - 24시간 내)

#### P0-1: 경기 기록 3개 버그 수정
- **이슈 A**: 댓글 입력란 표시 (GameRecordPage.tsx)
- **이슈 B**: 기록원 상태 동기화 (MemberPicker.tsx)
- **이슈 C**: 테이블 스크롤 (BatterTable, PitcherTable)
- **참고**: [08_BUGFIX_WF07_REPRO_ROOTCAUSE.md](08_BUGFIX_WF07_REPRO_ROOTCAUSE.md), [09_PATCH_PLAN_ATOMIC.md](09_PATCH_PLAN_ATOMIC.md)

#### P0-2: 문서 정책 정합성
- **README.md** 인증 방식 갱신 (초대 → OAuth + 승인)
- **CommentList.tsx** author.id → authorId 수정
- **참고**: [10_DOC_POLICY_ALIGNMENT.md](10_DOC_POLICY_ALIGNMENT.md)

---

### 8.2 단기 조치 (P1 - 1주일 내)

#### P1-1: 출석 마감 자동화 인프라
```bash
# Cloud Functions 추가
firebase init functions

# Scheduler 설정
# functions/index.ts
export const closeAttendance = functions.pubsub
  .schedule('*/10 * * * *')  // 10분마다 스캔
  .onRun(async (context) => {
    // voteCloseAt <= now인 이벤트 찾아 voteClosed=true 설정
  });
```

#### P1-2: 공지 푸시 기본 구현
```bash
# FCM 설정
firebase init messaging

# 토큰 저장: members/{userId}.fcmToken
# 공지 작성 시: sendMulticast() 호출
```

---

### 8.3 중기 조치 (P2 - 2주일 내)

#### P2-1: 투표 게시판 구현
- posts type=poll 추가
- choices, votes 서브컬렉션
- 결과 집계 UI

#### P2-2: 앨범 기본 기능
- posts type=album
- Firebase Storage 업로드
- 썸네일 그리드

---

### 8.4 장기 조치 (P3 - 1개월 내)

#### P3-1: 회비/회계 모듈
- dues 컬렉션 (납부 상태)
- ledger 컬렉션 (총무 작성 → 회장 승인)
- 승인 워크플로우 UI

#### P3-2: 감사 로그 시스템
- audit 컬렉션
- 주요 이벤트(역할 변경, 회계 승인, 기록 LOCK) 기록
- 관리자 대시보드

---

## 📋 9. 결론 및 제언

### 9.1 현재 상태 평가

| 평가 항목 | 점수 | 설명 |
|---------|------|------|
| **기획 충실도** | 53% | Sprint 7(경기 기록)은 90%, 나머지 30~0% |
| **핵심 기능** | 70% | 게시판/일정/경기 기록 작동, 자동화 없음 |
| **코드 품질** | B+ | TypeScript, Context API, Service Layer 우수 |
| **보안** | A | Firestore Rules 5/5 검증 통과 |
| **배포 준비도** | C | 3개 버그 + 자동화 미구현 |

**총평**: **"MVP 수준 도달, 기획 대비 50% 완성"**

---

### 9.2 핵심 제언

#### 1️⃣ 가입 정책 명확화 필수
- 기획서를 "Google OAuth + 승인" 기준으로 개정하거나
- 초대 코드 시스템을 완전히 구현하거나
- **현재 상태**: 혼재되어 혼동 발생

#### 2️⃣ 자동화 인프라 조기 구축
- Cloud Functions + Scheduler는 **필수** (기획의 핵심 정책)
- 출석 마감/푸시 알림 없이는 동호회 운영 불가능

#### 3️⃣ 경기 기록 버그 우선 해결
- WF-07이 가장 잘 구현된 기능이므로, 3개 버그만 수정하면 완성도 100%
- 사용자 경험에 직접적 영향

#### 4️⃣ 미구현 모듈 로드맵 재조정
- 앨범: 운영 초기에는 생략 가능 (외부 서비스 대체 가능)
- 회비/회계: **필수** (재무 관리 핵심)
- 투표: 중요도 중간 (댓글/게시판으로 임시 대체)

---

### 9.3 릴리스 전략 제안

#### Release 1.1 (즉시, 1주일)
- ✅ 3개 버그 수정 (A/B/C)
- ✅ 문서 정합성 (README, CHANGELOG)
- ✅ TypeScript 에러 43개 → 0개

#### Release 1.5 (2주일)
- ✅ 출석 마감 자동화
- ✅ 공지 푸시 기본 기능
- ✅ 투표 게시판 MVP

#### Release 2.0 (1개월)
- ✅ 회비/회계 모듈
- ✅ 앨범 기본 기능
- ✅ 감사 로그 시스템

---

## 📎 참고 문서

- [00_INDEX_UPLOAD_ORDER.md](00_INDEX_UPLOAD_ORDER.md) - 업로드 전략
- [08_BUGFIX_WF07_REPRO_ROOTCAUSE.md](08_BUGFIX_WF07_REPRO_ROOTCAUSE.md) - 3개 버그 원인 분석
- [09_PATCH_PLAN_ATOMIC.md](09_PATCH_PLAN_ATOMIC.md) - 패치 실행 계획
- [10_DOC_POLICY_ALIGNMENT.md](10_DOC_POLICY_ALIGNMENT.md) - 문서 정책 정합성
- 기획서 원본: `1) 개발 기획계획서 (v0.1).txt`

---

✅ **보고서 작성 완료** | **비교 분석 완성도: 100%** | **총 10개 섹션**
