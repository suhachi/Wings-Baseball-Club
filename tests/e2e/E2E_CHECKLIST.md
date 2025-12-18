# E2E 체크리스트

## μATOM-0611~0616: 수동 E2E 체크리스트

각 시나리오는 수동으로 테스트하고 결과를 기록합니다.

---

## μATOM-0611: 로그인 → Access Gate → 홈 화면

**시나리오:**
1. 비로그인 상태에서 앱 접근
2. Google 로그인 수행
3. Access Gate 확인 (members/{uid} 존재 체크)
4. 홈 화면 표시 확인

**기대 화면/로그:**
- 비로그인: LoginPage 표시
- 로그인 후: "접근 권한 확인 중..." 로딩 화면
- Access Gate 통과: HomePage 표시
- Access Gate 실패: AccessDeniedPage 표시

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 에러 로그 확인
3. Network 탭에서 Firestore 요청 확인
4. Application 탭에서 Firebase Auth 상태 확인

**체크리스트:**
- [ ] 비로그인 시 LoginPage 표시
- [ ] Google 로그인 성공
- [ ] Access Gate 확인 중 로딩 화면 표시
- [ ] members/{uid} 존재 시 홈 화면 표시
- [ ] members/{uid} 없을 시 AccessDeniedPage 표시
- [ ] status !== 'active' 시 AccessDeniedPage 표시

**결과:** PASS / FAIL

---

## μATOM-0612: 게시판 탭 전환 및 게시글 목록 표시

**시나리오:**
1. 홈 화면에서 게시판 탭 클릭
2. 공지/자유/연습·시합 탭 전환
3. 각 탭별 게시글 목록 표시 확인

**기대 화면/로그:**
- 게시판 탭: BoardsPage 표시
- 공지 탭: type='notice' 게시글만 표시, pinned 우선 정렬
- 자유 탭: type='free' 게시글만 표시, 최신순 정렬
- 연습·시합 탭: type='event' 게시글만 표시, startAt 기준 정렬

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 Firestore 쿼리 로그 확인
3. Network 탭에서 Firestore read 요청 확인
4. React DevTools에서 DataContext 상태 확인

**체크리스트:**
- [ ] 게시판 탭 클릭 시 BoardsPage 표시
- [ ] 공지 탭: notice 게시글만 표시, pinned 우선
- [ ] 자유 탭: free 게시글만 표시, 최신순
- [ ] 연습·시합 탭: event 게시글만 표시, startAt 기준 정렬
- [ ] 빈 게시글 목록 시 EmptyState 표시

**결과:** PASS / FAIL

---

## μATOM-0613: 이벤트 상세 → 출석 투표

**시나리오:**
1. 연습·시합 탭에서 이벤트 게시글 클릭
2. 이벤트 상세 모달 표시 (메타 정보 확인)
3. 출석 투표 버튼 클릭 (참석/불참/미정)
4. 투표 결과 반영 확인

**기대 화면/로그:**
- 이벤트 상세: startAt, place, opponent, voteCloseAt 표시
- 출석 집계: 참석/불참/미정 카운트 표시
- 내 상태: 현재 투표 상태 표시
- 투표 버튼: 참석/불참/미정 3개 버튼
- 투표 후: 즉시 집계 반영

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 updateAttendance 호출 로그 확인
3. Network 탭에서 Firestore write 요청 확인
4. Firestore Rules 에러 확인

**체크리스트:**
- [ ] 이벤트 상세 모달 표시
- [ ] 메타 정보 표시 (startAt, place, opponent, voteCloseAt)
- [ ] 출석 집계 표시 (참석/불참/미정)
- [ ] 내 상태 표시
- [ ] 참석 버튼 클릭 시 상태 변경
- [ ] 불참 버튼 클릭 시 상태 변경
- [ ] 미정 버튼 클릭 시 상태 변경
- [ ] 투표 후 집계 즉시 반영

**결과:** PASS / FAIL

---

## μATOM-0614: 관리자 공지 작성 + 푸시 발송

**시나리오:**
1. 관리자 계정으로 로그인
2. 게시판 → 공지 탭 → 글쓰기 버튼 클릭
3. CreateNoticeModal에서 공지 작성
4. createNoticeWithPush callable 호출
5. 푸시 발송 상태 확인

**기대 화면/로그:**
- 관리자만 공지 작성 버튼 표시
- CreateNoticeModal 표시
- 공지 작성 후: 게시글 생성 + 푸시 발송
- 공지 상세: pushStatus 배지 표시 (SENT/FAILED)

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 createNoticeWithPush 호출 로그 확인
3. Network 탭에서 Functions 호출 확인
4. Functions 로그 확인 (firebase functions:log)

**체크리스트:**
- [ ] 관리자만 공지 작성 버튼 표시
- [ ] CreateNoticeModal 표시
- [ ] 공지 작성 성공
- [ ] createNoticeWithPush callable 호출 성공
- [ ] 푸시 발송 상태 기록 (pushStatus)
- [ ] 공지 상세에서 pushStatus 배지 표시
- [ ] 푸시 발송 실패 시 pushError 표시

**결과:** PASS / FAIL

---

## μATOM-0615: 관리자 이벤트 작성 + voteCloseAt 계산

**시나리오:**
1. 관리자 계정으로 로그인
2. 게시판 → 연습·시합 탭 → 글쓰기 버튼 클릭
3. CreatePostModal에서 이벤트 작성 (eventType, startAt, place 입력)
4. createEventPost callable 호출
5. voteCloseAt 계산 결과 확인

**기대 화면/로그:**
- 관리자만 이벤트 작성 버튼 표시
- CreatePostModal에서 이벤트 작성 UI 표시
- 이벤트 작성 후: 게시글 생성 + voteCloseAt 계산 (전날 23:00 KST)
- 이벤트 상세: voteCloseAt 표시

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 createEventPost 호출 로그 확인
3. Network 탭에서 Functions 호출 확인
4. Functions 로그에서 voteCloseAt 계산 값 확인

**체크리스트:**
- [ ] 관리자만 이벤트 작성 버튼 표시
- [ ] CreatePostModal에서 이벤트 작성 UI 표시
- [ ] 이벤트 작성 성공
- [ ] createEventPost callable 호출 성공
- [ ] voteCloseAt 계산 정확 (전날 23:00 KST)
- [ ] 이벤트 상세에서 voteCloseAt 표시
- [ ] voteClosed=false 초기화

**결과:** PASS / FAIL

---

## μATOM-0616: FCM 토큰 등록 + 푸시 수신

**시나리오:**
1. 로그인 후 내정보 페이지 접근
2. 알림 권한 요청
3. FCM 토큰 등록
4. 공지 작성 시 푸시 수신 확인

**기대 화면/로그:**
- 내정보 페이지: 푸시 알림 상태 표시
- 권한 요청: 브라우저 알림 권한 요청 다이얼로그
- 토큰 등록: registerFcmToken callable 호출 성공
- 푸시 수신: 브라우저 알림 표시

**실패 시 재현 절차:**
1. 브라우저 개발자 도구 열기
2. Console 탭에서 FCM 토큰 등록 로그 확인
3. Application 탭에서 Service Worker 상태 확인
4. Network 탭에서 registerFcmToken 호출 확인

**체크리스트:**
- [ ] 내정보 페이지에서 푸시 알림 상태 표시
- [ ] 알림 권한 요청 성공
- [ ] FCM 토큰 등록 성공
- [ ] 토큰 재등록 버튼 동작
- [ ] 공지 작성 시 푸시 수신
- [ ] Background 메시지 수신 (Service Worker)

**결과:** PASS / FAIL

---

## E2E 테스트 결과 요약

| 시나리오 | 결과 | 비고 |
|---------|------|------|
| μATOM-0611: 로그인 → Access Gate | - | - |
| μATOM-0612: 게시판 탭 전환 | - | - |
| μATOM-0613: 이벤트 상세 → 출석 투표 | - | - |
| μATOM-0614: 관리자 공지 작성 + 푸시 | - | - |
| μATOM-0615: 관리자 이벤트 작성 | - | - |
| μATOM-0616: FCM 토큰 등록 + 푸시 수신 | - | - |

**전체 결과:** PASS / FAIL


