# 🎯 WINGS BASEBALL CLUB 구현 체크리스트

## ✅ Phase 1: Firebase 설치 및 설정 (완료)
- [x] Firebase 패키지 설치
- [x] Firebase 설정 파일 생성 (`/src/lib/firebase/config.ts`)
- [x] TypeScript 타입 정의 (`/src/lib/firebase/types.ts`)
- [x] 환경 변수 예제 파일 생성 (`.env.example`)
- [x] Firebase 설정 가이드 문서 작성 (`/README_FIREBASE_SETUP.md`)

**다음 단계:** Firebase Console에서 프로젝트 생성 및 `.env` 파일 설정 필요

---

## ✅ Phase 2: 인증 시스템 (완료)
- [x] Firebase Auth 서비스 함수 구현 (`/src/lib/firebase/auth.service.ts`)
  - [x] 초대 코드 기반 가입 (`redeemInviteCode`)
  - [x] 사용자 정보 가져오기 (`getCurrentUserData`)
  - [x] 사용자 정보 업데이트 (`updateUserData`)
  - [x] 로그아웃 (`logout`)
  - [x] 인증 상태 감지 (`onAuthStateChange`)
  - [x] 초대 코드 생성 (`createInviteCode`)
  - [x] 역할별 권한 확인 함수들
- [x] AuthContext Firebase 연동 (`/src/app/contexts/AuthContext.tsx`)
  - [x] 실시간 인증 상태 감지
  - [x] 로그인/로그아웃 처리
  - [x] 사용자 정보 업데이트
  - [x] 권한 확인 함수들

**테스트 필요:**
- [ ] 초대 코드로 첫 회원 가입
- [ ] 로그인/로그아웃
- [ ] 사용자 정보 업데이트

---

## ✅ Phase 3: 데이터 시스템 (완료)
- [x] Firestore 서비스 함수 구현 (`/src/lib/firebase/firestore.service.ts`)
  - [x] 게시글 CRUD
  - [x] 댓글 CRUD
  - [x] 출석 관리
  - [x] 회원 목록
  - [x] 회비/회계 관리
  - [x] 경기 기록 관리
  - [x] 알림 관리
- [x] DataContext Firebase 연동 (`/src/app/contexts/DataContext.tsx`)
  - [x] 실시간 데이터 로드
  - [x] 게시글 관리
  - [x] 댓글 관리
  - [x] 출석 관리
- [x] Storage 서비스 함수 구현 (`/src/lib/firebase/storage.service.ts`)
  - [x] 프로필 사진 업로드
  - [x] 앨범 미디어 업로드
  - [x] 게시글 첨부파일 업로드
  - [x] 파일 삭제
  - [x] 파일 유효성 검사
- [x] App.tsx 로딩 상태 처리

**테스트 필요:**
- [ ] 게시글 생성/수정/삭제
- [ ] 댓글 추가/삭제
- [ ] 출석 투표
- [ ] 파일 업로드

---

## ⚠️ Phase 4: 일정 및 출석 시스템 (부분 완료)
- [x] 일정 생성 (이벤트 타입 게시글)
- [x] 출석 투표 기능
- [x] 출석 현황 집계
- [ ] ⚠️ **자동 마감 (전날 23:00) - Cloud Functions 필요**
- [ ] ⚠️ **출석 리마인더 알림 - Cloud Functions 필요**

**구현 필요:**
- Cloud Functions 프로젝트 설정
- `scheduledVoteClose` Function (Cron: 0 23 * * *)
- `scheduleReminder` Function (이벤트 1일 전 20:00)

---

## ⚠️ Phase 5: 게시판 시스템 (부분 완료)
- [x] 공지사항 게시글
- [x] 자유게시판
- [x] 투표 기능 (기본 구조)
- [x] 댓글 기능
- [ ] ⚠️ **공지 푸시 알림 - Cloud Functions 필요**
- [ ] 투표 결과 집계 UI 개선
- [ ] 게시글 상세 페이지
- [ ] 게시글 작성/수정 페이지

**다음 단계:**
- 게시글 작성 페이지 구현
- 게시글 상세 페이지 구현
- 투표 UI 개선

---

## ❌ Phase 6: 경기 기록 시스템 (미완료)
- [x] 경기 기록 데이터 구조
- [ ] ❌ **경기 기록원 지정 UI**
- [ ] ❌ **라인업 설정 페이지**
- [ ] ❌ **타자 기록 입력 페이지**
- [ ] ❌ **투수 기록 입력 페이지**
- [ ] ❌ **기록 잠금 기능**
- [ ] ❌ **경기 결과 요약 페이지**

**구현 필요:**
1. `/src/app/pages/GameRecordPage.tsx` 생성
2. 라인업 설정 컴포넌트
3. 타자 기록 입력 폼
4. 투수 기록 입력 폼
5. 기록 잠금 권한 확인

---

## ❌ Phase 7: 앨범 시스템 (미완료)
- [x] 앨범 UI (목 데이터)
- [x] Firebase Storage 연동 준비
- [ ] ❌ **실제 사진/동영상 업로드 기능**
- [ ] ❌ **미디어 썸네일 생성**
- [ ] ❌ **미디어 삭제 기능**
- [ ] ❌ **미디어 좋아요/댓글**

**구현 필요:**
1. AlbumPage에 업로드 기능 추가
2. 파일 선택 및 업로드 UI
3. 업로드 진행률 표시
4. 실제 Storage에서 데이터 로드

---

## ❌ Phase 8: 회비/회계 시스템 (미완료)
- [x] 회비/회계 데이터 구조
- [ ] ❌ **회비 납부 현황 페이지**
- [ ] ❌ **수입/지출 내역 페이지**
- [ ] ❌ **회계 보고서 페이지**
- [ ] ❌ **회비 등록/수정 기능**
- [ ] ❌ **권한 관리 (총무/회장만)**

**구현 필요:**
1. `/src/app/pages/FinancePage.tsx` 생성
2. 회비 납부 현황 테이블
3. 수입/지출 내역 리스트
4. 회비 등록 폼
5. 총무 권한 확인

---

## ⚠️ Phase 9: 마이페이지 (부분 완료)
- [x] 프로필 표시
- [x] 역할 표시
- [x] 통계 표시 (목 데이터)
- [ ] ⚠️ **프로필 사진 업로드**
- [ ] ⚠️ **프로필 정보 수정**
- [ ] ⚠️ **실제 통계 계산**
- [ ] ❌ **내 활동 내역**
- [ ] ❌ **알림 설정**

**구현 필요:**
1. 프로필 수정 페이지
2. 사진 업로드 기능
3. 실제 출석/게시글/댓글 통계 계산
4. 내 활동 내역 페이지

---

## ❌ Phase 10: 관리자 기능 (미완료)
- [ ] ❌ **멤버 관리 페이지**
  - [ ] 멤버 목록
  - [ ] 역할 변경
  - [ ] 포지션/등번호 설정
  - [ ] 멤버 활성화/비활성화
- [ ] ❌ **초대 코드 관리**
  - [ ] 초대 코드 생성
  - [ ] 초대 코드 목록
  - [ ] 사용 내역 확인
- [ ] ❌ **공지 관리**
  - [ ] 공지 고정/해제
  - [ ] 푸시 알림 발송
- [ ] ❌ **일정 관리**
  - [ ] 일정 생성/수정/삭제
  - [ ] 경기 기록원 지정

**구현 필요:**
1. `/src/app/pages/AdminPage.tsx` 생성
2. 멤버 관리 탭
3. 초대 코드 관리 탭
4. 각종 관리 기능

---

## ❌ Phase 11: Cloud Functions (미완료)

### 필수 Functions
- [ ] ❌ **scheduledVoteClose** - 출석 투표 자동 마감
  ```javascript
  // 매일 23:00에 실행
  // 다음날 이벤트의 voteCloseAt이 지났으면 voteClosed = true
  ```

- [ ] ❌ **sendNoticePush** - 공지 푸시 알림
  ```javascript
  // 공지사항 생성 시 트리거
  // 모든 활성 회원에게 푸시 알림
  ```

- [ ] ❌ **scheduleReminder** - 일정 리마인더
  ```javascript
  // 이벤트 1일 전 20:00에 실행
  // 출석 미응답 회원에게 알림
  ```

### 선택 Functions
- [ ] ❌ **onUserCreate** - 회원 가입 웰컴 알림
- [ ] ❌ **onCommentCreate** - 댓글 알림
- [ ] ❌ **generateThumbnail** - 동영상 썸네일 생성
- [ ] ❌ **cleanupOldData** - 오래된 데이터 정리

**구현 필요:**
1. Firebase Functions 프로젝트 설정
2. `/functions` 디렉토리 생성
3. 각 Function 구현
4. 배포

---

## ❌ Phase 12: PWA 기능 강화 (미완료)
- [x] manifest.json 기본 설정
- [x] service worker 기본 설정
- [ ] ❌ **오프라인 지원**
- [ ] ❌ **푸시 알림 설정**
- [ ] ❌ **앱 설치 프롬프트**
- [ ] ❌ **백그라운드 동기화**

**구현 필요:**
1. Service Worker 캐싱 전략
2. FCM(Firebase Cloud Messaging) 설정
3. 푸시 알림 권한 요청
4. 알림 핸들러

---

## 📝 추가 구현 필요 페이지

### 1. 게시글 작성 페이지 (`/src/app/pages/CreatePostPage.tsx`)
- [ ] 게시글 타입 선택
- [ ] 제목/내용 입력
- [ ] 이벤트 정보 입력 (일시, 장소, 상대팀)
- [ ] 투표 선택지 입력
- [ ] 파일 첨부

### 2. 게시글 상세 페이지 (`/src/app/pages/PostDetailPage.tsx`)
- [ ] 게시글 내용 표시
- [ ] 댓글 목록
- [ ] 댓글 작성
- [ ] 출석 투표 (이벤트)
- [ ] 투표하기 (투표)
- [ ] 수정/삭제 버튼

### 3. 경기 기록 페이지 (`/src/app/pages/GameRecordPage.tsx`)
- [ ] 라인업 설정
- [ ] 타자 기록 입력
- [ ] 투수 기록 입력
- [ ] 경기 결과 요약

### 4. 회비/회계 페이지 (`/src/app/pages/FinancePage.tsx`)
- [ ] 회비 납부 현황
- [ ] 수입/지출 내역
- [ ] 월별 보고서
- [ ] 회비 등록

### 5. 관리자 페이지 (`/src/app/pages/AdminPage.tsx`)
- [ ] 멤버 관리
- [ ] 초대 코드 관리
- [ ] 권한 관리

### 6. 알림 페이지 (`/src/app/pages/NotificationPage.tsx`)
- [ ] 알림 목록
- [ ] 읽음/안읽음 표시
- [ ] 알림 클릭 시 해당 페이지로 이동

### 7. 설정 페이지 (`/src/app/pages/SettingsPage.tsx`)
- [ ] 프로필 수정
- [ ] 알림 설정
- [ ] 다크 모드 토글
- [ ] 앱 정보

---

## 🔧 필요한 추가 컴포넌트

### UI 컴포넌트
- [ ] `PostCard.tsx` - 게시글 카드 (재사용 가능하도록 분리)
- [ ] `CommentList.tsx` - 댓글 목록
- [ ] `AttendanceVote.tsx` - 출석 투표 컴포넌트
- [ ] `PollVote.tsx` - 투표 컴포넌트
- [ ] `FileUploader.tsx` - 파일 업로드 컴포넌트
- [ ] `ImageGallery.tsx` - 이미지 갤러리
- [ ] `MemberCard.tsx` - 멤버 카드
- [ ] `FinanceCard.tsx` - 회비/회계 카드
- [ ] `GameRecordForm.tsx` - 경기 기록 폼
- [ ] `LineupSelector.tsx` - 라인업 선택기

### 모달 컴포넌트
- [ ] `CreatePostModal.tsx` - 게시글 작성 모달
- [ ] `EditProfileModal.tsx` - 프로필 수정 모달
- [ ] `InviteCodeModal.tsx` - 초대 코드 생성 모달
- [ ] `FinanceModal.tsx` - 회비 등록 모달
- [ ] `MemberEditModal.tsx` - 멤버 정보 수정 모달

---

## 🎨 디자인 개선

- [ ] 다크 모드 완전 지원
- [ ] 애니메이션 추가 (페이지 전환, 리스트 아이템)
- [ ] 스켈레톤 로딩 UI
- [ ] 빈 상태 UI 개선
- [ ] 에러 상태 UI
- [ ] 토스트 알림 스타일 개선
- [ ] 모바일 최적화

---

## 🧪 테스트

### 기능 테스트
- [ ] 회원가입/로그인 플로우
- [ ] 게시글 CRUD
- [ ] 댓글 추가/삭제
- [ ] 출석 투표
- [ ] 일반 투표
- [ ] 파일 업로드
- [ ] 권한 관리

### 성능 테스트
- [ ] Firestore 쿼리 최적화
- [ ] 이미지 로딩 최적화
- [ ] 무한 스크롤 구현
- [ ] 캐싱 전략

### 보안 테스트
- [ ] Firestore 보안 규칙 테스트
- [ ] Storage 보안 규칙 테스트
- [ ] 권한 확인 테스트

---

## 📱 배포

- [ ] Firebase Hosting 설정
- [ ] 프로덕션 빌드
- [ ] 환경 변수 설정
- [ ] 도메인 연결
- [ ] SSL 인증서
- [ ] PWA 등록 확인

---

## 📚 문서화

- [ ] API 문서
- [ ] 사용자 가이드
- [ ] 관리자 가이드
- [ ] 개발자 가이드
- [ ] 배포 가이드

---

## 🎯 우선순위별 다음 단계

### 🔴 최우선 (즉시 구현 필요)
1. **Firebase 프로젝트 설정 및 초기 데이터 구축**
   - Firebase Console에서 프로젝트 생성
   - `.env` 파일 설정
   - Firestore 보안 규칙 배포
   - 첫 번째 초대 코드 생성

2. **게시글 작성 기능**
   - 게시글 작성 페이지/모달 구현
   - 이벤트/투표/일반 게시글 작성 UI

3. **게시글 상세 페이지**
   - 댓글 기능 완성
   - 출석/투표 기능 UI

### 🟡 중요 (1-2주 내)
4. **경기 기록 시스템**
   - 경기 기록 페이지 전체 구현
   - 라인업/타자/투수 기록

5. **회비/회계 시스템**
   - 회비 관리 페이지
   - 총무 기능

6. **관리자 기능**
   - 멤버 관리
   - 초대 코드 관리

### 🟢 추후 (2주 이후)
7. **Cloud Functions**
   - 자동 마감
   - 푸시 알림
   - 리마인더

8. **PWA 고도화**
   - 오프라인 지원
   - 푸시 알림

9. **기타 개선사항**
   - 디자인 개선
   - 성능 최적화
   - 추가 기능

---

## 📞 현재 상태 요약

### ✅ 완료된 것
- Firebase 설정 구조
- 인증 시스템 (로그인/로그아웃)
- 데이터 Context (게시글, 댓글, 출석)
- 기본 UI 페이지들
- Storage 서비스

### ⚠️ 부분 완료
- 게시판 (작성/상세 페이지 없음)
- 출석 시스템 (자동 마감 없음)
- 마이페이지 (프로필 수정 없음)

### ❌ 미완료
- 경기 기록 시스템
- 회비/회계 시스템
- 관리자 기능
- Cloud Functions
- 앨범 실제 업로드
- PWA 푸시 알림

### 🎯 다음 단계
**가장 먼저 해야 할 일:**
1. Firebase 프로젝트 생성 및 설정
2. 첫 번째 초대 코드로 테스트 가입
3. 게시글 작성 페이지 구현
4. 게시글 상세 페이지 구현

---

**작성일:** 2024-12-16
**버전:** 1.0
**작성자:** AI Assistant
