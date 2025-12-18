# handoff_pack/02_WIREFRAMES_SPEC.md

## 목적/범위
화면 구조(IA), 워크플로우(WF), 각 화면의 UI 블록 및 액션을 정의합니다.

---

## 정보 구조 (IA)

### 탭 구조 (하단 네비게이션)
위치: `src/app/components/BottomNav.tsx`

```
홈 (home)
  └─ HomePage
일정 (schedule)
  └─ SchedulePage
게시판 (boards)
  └─ BoardsPage
앨범 (album)
  └─ AlbumPage
내정보 (my)
  └─ MyPage
```

### 게시판 타입 (PostType)
위치: `src/lib/firebase/types.ts`

- `notice`: 공지사항 (관리자만 작성 가능)
- `free`: 자유게시판
- `event`: 일정/출석 (연습/경기)
- `poll`: 투표
- `game`: 경기 (event의 하위 타입, eventType === 'GAME')
- `album`: 앨범
- `meetup`: 모임 (현재 미사용)

---

## 워크플로우 (WF) 목록

### WF-01: 로그인 및 회원가입
**파일**: `src/app/pages/LoginPage.tsx`

**진입 조건**: 미로그인 상태

**단계**:
1. 로그인 방법 선택 (Google / 이메일)
2. Google: 팝업 로그인 → Firebase Auth 완료
3. 이메일: 회원가입 또는 로그인 폼
4. 회원가입 시 추가 정보 입력 (실명, 닉네임, 전화번호)
5. `createAccount()` 호출 → UserDoc 생성 (`status: 'pending'`)
6. 앱 메인 화면 진입

**주요 UI 블록**:
- 로고/타이틀
- Google 로그인 버튼
- 이메일 로그인/회원가입 폼
- 추가 정보 입력 폼

---

### WF-02: 공지사항 작성 및 푸시
**파일**: `src/app/pages/BoardsPage.tsx`, `src/app/components/CreatePostModal.tsx`

**진입 조건**: `isAdmin()` === true

**단계**:
1. 게시판 탭 → 공지사항 탭 선택
2. "+" 버튼 클릭 → `CreatePostModal` 오픈
3. 게시글 유형: "공지사항" 선택
4. 제목, 내용 입력
5. "작성하기" 버튼 → `addPost()` 호출
6. ⚠️ **푸시 알림 발송은 미구현** (Cloud Functions 필요)

**주요 UI 블록**:
- 게시글 유형 선택 버튼 (관리자만 "공지사항" 표시)
- 제목/내용 입력 폼
- 작성/취소 버튼

**오류 상태**: 제목/내용 미입력 시 토스트 에러

---

### WF-03: 일정 생성 및 출석 투표
**파일**: `src/app/pages/SchedulePage.tsx`, `src/app/components/CreatePostModal.tsx`

**진입 조건**: 로그인 상태

**단계**:
1. 일정 탭 → "일정 추가" 버튼
2. `CreatePostModal` → 게시글 유형: "일정/출석"
3. 일정 정보 입력:
   - 유형: 연습 / 경기
   - 날짜/시간
   - 장소
   - 상대팀 (경기인 경우)
4. 작성 완료 → `voteCloseAt = startAt - 1일 23:00` 자동 계산
5. 회원들이 출석 투표 (참석/불참/보류)

**주요 UI 블록**:
- 일정 유형 선택 (연습/경기)
- 날짜/시간 피커
- 장소 입력
- 출석 투표 버튼 (참석/불참/보류)

**오류 상태**: 날짜/시간/장소 미입력 시 토스트 에러

**빈 상태**: "예정된 일정이 없습니다"

---

### WF-04: 투표 작성 및 참여
**파일**: `src/app/pages/BoardsPage.tsx`, `src/app/components/CreatePostModal.tsx`, `src/app/components/PollVoteModal.tsx`

**진입 조건**: 로그인 상태

**작성 단계**:
1. 게시판 탭 → 투표 탭
2. "+" 버튼 → 게시글 유형: "투표"
3. 선택지 추가 (최소 2개, 최대 10개)
4. 옵션: 복수 선택 허용, 익명 투표
5. 마감일 설정 (선택)

**참여 단계**:
1. 투표 게시글 클릭 → `PollVoteModal` 오픈
2. 선택지 선택 (단일/복수)
3. "투표하기" 버튼 → `votePoll()` 호출
4. 투표 결과 표시 (퍼센트, 득표수)

**주요 UI 블록**:
- 선택지 입력 폼 (동적 추가/삭제)
- 복수 선택/익명 체크박스
- 투표 결과 차트

**오류 상태**: 선택지 2개 미만 시 토스트 에러

---

### WF-05: 앨범 업로드
**파일**: `src/app/pages/AlbumPage.tsx`, `src/app/components/FileUploadModal.tsx`

**진입 조건**: 로그인 상태

**단계**:
1. 앨범 탭 → "+" 버튼
2. 파일 선택 (이미지/비디오)
3. 업로드 진행률 표시
4. `uploadAlbumMedia()` 호출 → Storage 업로드
5. 게시글 자동 생성 (`type: 'free'`, `images: [url]`)

**주요 UI 블록**:
- 파일 선택 버튼
- 업로드 진행률 바
- 미디어 그리드 표시

**오류 상태**: 파일 크기 초과 시 토스트 에러

---

### WF-06: 회원 승인 (관리자)
**파일**: `src/app/pages/AdminPage.tsx`

**진입 조건**: `isAdmin()` === true

**단계**:
1. 내정보 탭 → "관리자 페이지" 버튼
2. "멤버 관리" 탭 선택
3. "승인 대기" 필터 또는 `status === 'pending'` 목록 확인
4. 회원 정보 확인 (실명, 닉네임, 연락처)
5. "승인" 버튼 → `approveMember(memberId)` 호출
6. `updateMember(clubId, memberId, { status: 'active' })` 실행

**주요 UI 블록**:
- 멤버 목록 테이블
- 상태 필터 (전체/승인 대기/활성/거절)
- 승인/거절 버튼
- 역할 변경 드롭다운

**오류 상태**: 승인 실패 시 토스트 에러

---

### WF-07: 경기 기록 (상세)
**파일**: `src/app/pages/GameRecordPage.tsx`, `src/app/components/game-record/*.tsx`

**상세 문서**: `handoff_pack/09_WF07_GAME_RECORDING_IMPLEMENTATION.md` 참조

**진입 조건**: 
- `isAdmin()` === true OR `user.id in post.recorders`

**주요 단계**:
1. 경기 기록 탭 → 경기 선택 (eventType === 'GAME')
2. 경기 상세 모달 오픈
3. 탭: 요약 / 라인업 / 타자 기록 / 투수 기록
4. 기록원 지정 (관리자만) → `recorders` 배열 업데이트
5. 라인업 설정 (타순 1-9, 포지션)
6. 타자/투수 기록 입력
7. LOCK 버튼 (관리자만) → `recordingLocked: true`
8. LOCK 후 기록원 수정 불가, 관리자는 수정 가능

**주요 UI 블록**:
- 경기 목록 카드
- 라인업 에디터 (타순 1-9)
- 타자 기록 테이블 (타수, 안타, 타점 등)
- 투수 기록 테이블 (이닝, 피안타, 삼진 등)
- LOCK/UNLOCK 버튼

**오류 상태**: LOCK 후 기록원 수정 시도 → 권한 에러

---

### WF-08: 회비/회계 관리
**파일**: `src/app/pages/FinancePage.tsx`

**진입 조건**: `isTreasury()` === true

**단계**:
1. 내정보 탭 → "회비/회계" 버튼
2. 수입/지출 선택
3. 카테고리 선택 (회비/행사비/장비/기타)
4. 금액, 설명 입력
5. "추가" 버튼 → `addFinance()` 호출
6. 목록에 추가 (월별 필터링 가능)

**주요 UI 블록**:
- 통계 카드 (총 수입/지출/잔액)
- 월 선택 버튼
- 수입/지출 탭
- 내역 추가 폼
- 내역 목록

**오류 상태**: 금액/설명 미입력 시 토스트 에러

---

## 화면별 상세 구조

### HomePage (`src/app/pages/HomePage.tsx`)
**UI 블록**:
- 통계 카드 (활동 멤버, 예정 일정, 최근 경기)
- 마감 임박 알림 배너 (48시간 이내)
- 다가오는 일정 (최대 3개)
- 최신 공지사항 (최대 2개)

**액션**:
- 일정 클릭 → SchedulePage 상세
- 공지사항 클릭 → PostDetailModal

---

### BoardsPage (`src/app/pages/BoardsPage.tsx`)
**UI 블록**:
- 탭: 공지사항 / 자유게시판 / 일정/출석 / 투표 / 경기
- 게시글 목록 카드
- "+" 버튼 (게시글 작성)

**액션**:
- 게시글 클릭 → PostDetailModal
- "+" 버튼 → CreatePostModal

---

### SchedulePage (`src/app/pages/SchedulePage.tsx`)
**UI 블록**:
- 탭: 예정 / 지난 일정
- 일정 카드 (날짜/시간/장소/출석 현황)
- 출석 투표 버튼 (참석/불참/보류)

**액션**:
- 일정 클릭 → EventDetailModal
- 출석 투표 버튼 → `updateAttendance()` 호출

---

### MyPage (`src/app/pages/MyPage.tsx`)
**UI 블록**:
- 프로필 카드 (사진/이름/역할/포지션/등번호)
- 기능 버튼:
  - 설정
  - 알림
  - 내 활동
  - 관리자 페이지 (관리자만)
  - 회비/회계 (총무만)
  - 경기 기록 (기록원/관리자만)
  - 공지 관리 (관리자만)

**액션**:
- 각 버튼 클릭 → 해당 페이지로 이동

---

## 오류/빈 상태/로딩 상태

### 로딩 상태
- 전역: `AuthContext.loading` 또는 `DataContext.loading` → 스피너 표시
- 컴포넌트별: `useState<boolean>(false)` → 버튼 비활성화 또는 스피너

### 빈 상태
- 일정 없음: "예정된 일정이 없습니다"
- 게시글 없음: "게시글이 없습니다"
- 경기 없음: "등록된 경기 일정이 없습니다"

### 오류 상태
- 네트워크 오류: 토스트 에러 "인터넷 연결을 확인해주세요"
- 권한 오류: 토스트 에러 "권한이 없습니다"
- 유효성 검사 실패: 폼 필드 하단 빨간 텍스트 또는 토스트 에러

---

## TODO/누락

1. **Figma 디자인 파일**: 링크 없음 (텍스트 기반 와이어프레임만 존재)
2. **반응형 디자인**: 모바일 우선, 데스크톱 미확인
3. **접근성**: ARIA 라벨 등 미확인

