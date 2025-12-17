# ⚾ WINGS BASEBALL CLUB

야구동호회 통합 관리 웹앱 (PWA)

## 📖 프로젝트 소개

**WINGS BASEBALL CLUB**은 야구동호회 운영과 경기 기록을 통합한 웹 애플리케이션입니다.

### 주요 기능

#### 🏟️ 동호회 운영
- **공지사항**: 중요 공지 작성 및 푸시 알림
- **일정 관리**: 연습/경기 일정 생성 및 출석 투표
- **자동 마감**: 전날 23:00 출석 투표 자동 마감
- **게시판**: 자유게시판, 투표, 모임 등 다양한 게시판
- **앨범**: 사진/동영상 공유
- **회비/회계**: 회비 납부 현황 및 수입/지출 관리

#### ⚾ 경기 기록
- **라인업 설정**: 타순과 포지션 배정
- **타자 기록**: 타석 결과, 안타, 타점 등
- **투수 기록**: 이닝, 피안타, 삼진, 실점 등
- **기록 잠금**: 경기 종료 후 기록 수정 방지

#### 👥 회원 관리
- **초대 코드**: 초대 코드 기반 회원 가입
- **역할 관리**: 회장/감독/총무/관리자/일반회원
- **권한 관리**: 역할별 기능 접근 제어
- **포지션/등번호**: 회원별 포지션 및 등번호 설정

### 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **State Management**: React Context API
- **Animation**: Motion (Framer Motion)
- **PWA**: Service Worker + Web App Manifest

---

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 18+ 
- npm 또는 pnpm
- Firebase 프로젝트

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 Firebase 설정 값 입력

# 3. 개발 서버 실행
npm run dev
```

자세한 설정 가이드는 [`/QUICK_START.md`](/QUICK_START.md) 참조

---

## 📚 문서

- **[빠른 시작 가이드](/QUICK_START.md)** - 5분 안에 프로젝트 시작하기
- **[Firebase 설정 가이드](/README_FIREBASE_SETUP.md)** - Firebase 상세 설정 방법
- **[구현 체크리스트](/IMPLEMENTATION_CHECKLIST.md)** - 전체 기능 구현 현황

---

## 📁 프로젝트 구조

```
wings-baseball-club/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service Worker
├── src/
│   ├── app/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   │   ├── TopBar.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── contexts/         # React Context
│   │   │   ├── AuthContext.tsx
│   │   │   └── DataContext.tsx
│   │   ├── pages/            # 페이지 컴포넌트
│   │   │   ├── HomePage.tsx
│   │   │   ├── SchedulePage.tsx
│   │   │   ├── BoardsPage.tsx
│   │   │   ├── AlbumPage.tsx
│   │   │   ├── MyPage.tsx
│   │   │   └── LoginPage.tsx
│   │   └── App.tsx           # 메인 앱
│   ├── lib/
│   │   └── firebase/         # Firebase 관련
│   │       ├── config.ts     # Firebase 설정
│   │       ├── types.ts      # TypeScript 타입
│   │       ├── auth.service.ts
│   │       ├── firestore.service.ts
│   │       └── storage.service.ts
│   ├── styles/               # 스타일
│   └── main.tsx              # 엔트리 포인트
├── .env.example              # 환경 변수 예제
├── QUICK_START.md            # 빠른 시작 가이드
├── README_FIREBASE_SETUP.md  # Firebase 설정 가이드
└── IMPLEMENTATION_CHECKLIST.md # 구현 체크리스트
```

---

## 🎯 주요 기능 상태

### ✅ 완료
- Firebase 설정 및 연동
- 인증 시스템 (초대 코드 기반)
- 게시글 시스템 (CRUD)
- 댓글 시스템
- 출석 투표
- 회원 관리
- 역할별 권한 관리
- 파일 업로드 (Storage)
- PWA 기본 설정

### ⚠️ 부분 완료
- 게시판 (작성/상세 페이지 UI 필요)
- 출석 시스템 (자동 마감 Function 필요)
- 앨범 (실제 업로드 UI 필요)
- 마이페이지 (프로필 수정 필요)

### ❌ 미완료
- 경기 기록 시스템 (전체)
- 회비/회계 관리 (전체)
- 관리자 기능 (멤버 관리 등)
- Cloud Functions (자동 마감, 푸시 알림)
- 알림 시스템
- PWA 푸시 알림

자세한 구현 현황은 [`/IMPLEMENTATION_CHECKLIST.md`](/IMPLEMENTATION_CHECKLIST.md) 참조

---

## 🔐 보안

### Firestore 보안 규칙
- 모든 데이터 읽기: 로그인 필수
- 게시글/댓글 작성: 로그인 필수
- 게시글/댓글 수정/삭제: 작성자 본인 또는 관리자만
- 회비/회계 관리: 회장/총무만
- 회원 정보 수정: 본인 또는 관리자만

### Storage 보안 규칙
- 프로필 사진: 본인만 업로드 (최대 5MB)
- 앨범 미디어: 모든 회원 업로드 가능 (사진 10MB, 영상 100MB)
- 게시글 첨부파일: 모든 회원 업로드 가능

---

## 👥 역할 및 권한

| 역할 | 코드 | 권한 |
|------|------|------|
| 회장 | PRESIDENT | 모든 권한 |
| 감독 | DIRECTOR | 관리자 권한 + 경기 기록 |
| 총무 | TREASURER | 회비/회계 관리 |
| 관리자 | ADMIN | 게시글 관리, 회원 관리 |
| 일반회원 | MEMBER | 기본 권한 |

### 권한별 기능

- **게시글 작성**: 모든 회원
- **게시글 삭제**: 작성자 본인 또는 관리자
- **회원 관리**: 회장, 감독, 관리자
- **경기 기록**: 회장, 감독, 지정된 기록원
- **회비/회계**: 회장, 총무
- **초대 코드 생성**: 회장, 관리자

---

## 🗄️ 데이터 구조

### Firestore Collections

```
wings-baseball-club/
├── users/              # 회원 정보
├── inviteCodes/        # 초대 코드
├── posts/              # 게시글
├── comments/           # 댓글
├── attendance/         # 출석 기록
├── finance/            # 회비/회계
├── gameRecords/        # 경기 기록
│   ├── batters/       # 타자 기록
│   └── pitchers/      # 투수 기록
└── notifications/      # 알림
```

### Firebase Storage 구조

```
wings-baseball-club.appspot.com/
├── profiles/           # 프로필 사진
│   └── {userId}/
├── albums/            # 앨범
│   └── {year}/{month}/
└── posts/             # 게시글 첨부파일
    └── {postId}/
```

---

## 🔄 다음 개발 우선순위

### 1️⃣ 최우선 (즉시)
- [ ] Firebase 프로젝트 설정 완료
- [ ] 게시글 작성 페이지 구현
- [ ] 게시글 상세 페이지 구현

### 2️⃣ 중요 (1-2주)
- [ ] 경기 기록 시스템 전체
- [ ] 회비/회계 관리 시스템
- [ ] 관리자 페이지

### 3️⃣ 추후 (2주+)
- [ ] Cloud Functions (자동 마감, 푸시 알림)
- [ ] PWA 푸시 알림
- [ ] 오프라인 지원

---

## 📱 PWA 기능

### 현재 구현
- ✅ Web App Manifest
- ✅ Service Worker 기본 구조
- ✅ 앱 아이콘
- ✅ 홈 화면 추가

### 추후 구현
- ⏳ 오프라인 지원
- ⏳ 푸시 알림
- ⏳ 백그라운드 동기화
- ⏳ 설치 프롬프트

---

## 🧪 테스트

### 로컬 테스트
```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### Firebase 에뮬레이터 (추후)
```bash
firebase emulators:start
```

---

## 📦 배포

### Firebase Hosting
```bash
# 빌드
npm run build

# 배포
firebase deploy --only hosting
```

### 환경 변수
프로덕션 환경의 `.env` 파일은 절대 Git에 커밋하지 마세요!

---

## 🤝 기여

이 프로젝트는 WINGS BASEBALL CLUB 전용 프로젝트입니다.

### 개발 가이드라인
1. TypeScript 타입을 엄격하게 지정
2. ESLint/Prettier 규칙 준수
3. 컴포넌트는 재사용 가능하도록 설계
4. 커밋 메시지는 명확하게 작성

---

## 📄 라이선스

이 프로젝트는 WINGS BASEBALL CLUB의 내부 프로젝트입니다.

---

## 📞 지원

### 문서
- [빠른 시작](/QUICK_START.md)
- [Firebase 설정](/README_FIREBASE_SETUP.md)
- [구현 체크리스트](/IMPLEMENTATION_CHECKLIST.md)

### 문제 해결
- Firebase 연결 오류: `.env` 파일 확인
- 보안 규칙 오류: Firestore/Storage 규칙 확인
- 로그인 오류: 초대 코드 확인

---

## 🎉 제작

**WINGS BASEBALL CLUB** 야구동호회를 위한 통합 관리 시스템

- **버전**: 1.0.0
- **시작일**: 2024-12-16
- **상태**: 개발 진행 중

---

**Let's Play Ball! ⚾**
