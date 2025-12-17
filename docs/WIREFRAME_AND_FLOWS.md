## WINGS BASEBALL CLUB – 와이어프레임 & 화면 흐름

이 문서는 실제 구현된 코드 기준으로 **화면 구조(와이어프레임)** 를 텍스트로 정의하고,  
각 화면이 어떤 컴포넌트/파일로 구성되어 있는지 연결해서 설명합니다.

---

## 1. 전체 네비게이션 구조

- **엔트리**
  - `src/main.tsx` → `src/app/App.tsx`
  - 전역 Provider:
    - `AuthProvider` (`AuthContext.tsx`)
    - `DataProvider` (`DataContext.tsx`)
    - `ThemeProvider` (`ThemeContext.tsx`)

- **상단 바 (`TopBar.tsx`)**
  - 좌측: 뒤로가기 버튼 (필요한 페이지에서만 표시)
  - 중앙: 현재 페이지 제목
  - 우측:
    - 알림 아이콘 (Home 등) – 미읽은 개수 뱃지
    - 설정 아이콘 (MyPage 등)

- **하단 탭 (`BottomNav.tsx`)**
  - 탭 5개:
    - 홈 (`home`)
    - 일정 (`schedule`)
    - 게시판 (`boards`)
    - 앨범 (`album`)
    - 마이 (`my`)
  - 각 탭 클릭 시 `AppContent`의 `activeTab` / `currentPage` 상태 변경.

- **페이지 전환**
  - 메인 컨텐츠는 `AppContent` 내부 `switch` 방식으로 렌더:
    - `HomePage`, `SchedulePage`, `BoardsPage`, `AlbumPage`, `MyPage`,
      `SettingsPage`, `NotificationPage`, `AdminPage`, `FinancePage`, `GameRecordPage`, `LoginPage`.

---

## 2. 로그인 플로우 (`LoginPage.tsx`)

**화면 구성**
- 상단 로고/타이틀 영역:
  - 큰 트로피 아이콘 + "WINGS" 텍스트 + "야구동호회 커뮤니티" 서브텍스트.
- 입력 폼 카드:
  - 입력 필드:
    - 초대코드 (필수)
    - 실명 (필수)
    - 닉네임 (선택)
    - 연락처 (선택)
  - 오류 메시지 영역 (빨간 박스).
  - 하단 “가입하기” 버튼 (로딩 시 스피너 + “가입 중...” 텍스트).
- 하단 안내:
  - “가입 후 관리자가 포지션과 백넘버를 설정합니다”
  - 데모 안내: “초대코드: WINGS2024” (실제 검증은 Firestore에서 수행).


