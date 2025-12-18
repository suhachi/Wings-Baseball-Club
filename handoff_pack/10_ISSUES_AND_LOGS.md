# handoff_pack/10_ISSUES_AND_LOGS.md

## 목적/범위
현재 겪는 오류를 이슈 단위로 정리하고, 재현 절차, 콘솔/Network 로그, 의심 원인을 제시합니다.

---

## 이슈 1: TypeScript 타입 에러 71개

### 발생 위치
전체 프로젝트 (타입 체크 시)

### 계정 상태/역할
N/A (컴파일 타임 에러)

### 재현 절차
1. 터미널에서 `npx tsc --noEmit` 실행
2. 71개 에러 확인

### 기대 결과
TypeScript 에러 0개

### 실제 결과
71개 타입 에러 발생

### 에러 분류
- **미사용 import/변수**: 38개 (TS6133, TS6198)
- **타입 불일치**: 11개 (TS2322, TS2362)
- **타입 비교/인덱싱**: 4개 (TS2367, TS7053)
- **누락된 타입 정의**: 4개 (TS2305)
- **기타**: 14개 (TS2552, TS7006 등)

### 관련 문서
- 상세 분석: `docs/TS_ERROR_FINAL_AUDIT_REPORT.md`
- 수정 가이드: `docs/TS_ERROR_FIX_REPORT.md`

### 의심 원인 Top 3

1. **타입 정의 누락** (높음)
   - `CommentDoc`, `AttendanceDoc`, `FinanceDoc`가 `types.ts`에 없음
   - `firestore.service.ts`에서 import 시도 → TS2305 에러

2. **null 처리 미일치** (중간)
   - Firestore는 `null` 허용, 클라이언트 타입은 `undefined`만 허용
   - `DataContext.tsx` Line 340, 353: `?? null` 사용으로 타입 불일치

3. **미사용 코드** (낮음)
   - 개발 과정에서 생긴 미사용 import/변수들

---

## 이슈 2: Firestore Rules 타입 불일치

### 발생 위치
`firestore.rules` Line 54, 68

### 재현 절차
1. 게시글/댓글 수정 시도
2. Firestore Rules 검증 실패 가능성

### 기대 결과
작성자 본인 또는 관리자만 수정 가능

### 실제 결과
규칙이 `resource.data.author.id`를 참조하지만, 실제 Firestore 문서에는 `authorId` 필드만 존재

### 에러 메시지 (예상)
```
FirestoreError: Missing or insufficient permissions.
```

### 의심 원인 Top 3

1. **필드명 불일치** (높음)
   - Rules: `resource.data.author.id`
   - 실제 문서: `authorId`
   - 클라이언트 변환 후: `author: { id, name, photoURL }`

2. **Rules 업데이트 누락** (중간)
   - 클라이언트 데이터 구조 변경 후 Rules 미갱신

3. **테스트 부족** (낮음)
   - Rules 배포 후 실제 테스트 미실시

---

## 이슈 3: 회계 컬렉션 Rules 누락

### 발생 위치
`clubs/{clubId}/ledger/{financeId}` 컬렉션

### 재현 절차
1. 총무가 아닌 사용자가 `FinancePage` 접근 시도 (클라이언트 가드 우회)
2. Firestore 직접 접근 시도

### 기대 결과
총무만 읽기/쓰기 가능

### 실제 결과
Rules 없음 → 기본 Deny 규칙 적용 → 접근 불가 (다행)

### 의심 원인 Top 3

1. **Rules 파일 미완성** (높음)
   - `ledger` 컬렉션 규칙 누락

2. **기능 추가 후 Rules 미갱신** (중간)
   - 회계 기능 추가 시 Rules 업데이트 누락

3. **명시적 Deny 규칙 없음** (낮음)
   - 기본 Deny로 보호되지만 명시적 규칙 추가 권장

---

## 이슈 4: Cloud Functions 미구현

### 발생 위치
전체 (출석 마감, 푸시 알림)

### 재현 절차
1. 일정 생성 → 출석 투표 마감 시각 경과
2. 공지사항 작성 → 푸시 알림 미발송

### 기대 결과
- 출석 투표 전날 23:00 자동 마감
- 공지사항 작성 시 모든 회원에게 푸시 알림

### 실제 결과
- 자동 마감 미작동
- 푸시 알림 미발송

### 의심 원인 Top 3

1. **Functions 폴더 없음** (높음)
   - `functions/` 디렉토리 자체가 존재하지 않음

2. **우선순위 낮음** (중간)
   - 클라이언트 기능 우선 구현, 백엔드 자동화는 미구현

3. **FCM 토큰 관리 부재** (낮음)
   - 푸시 알림을 위한 FCM 토큰 저장 컬렉션 없음

---

## 이슈 5: DataContext loadAttendances 중복 정의

### 발생 위치
`src/app/contexts/DataContext.tsx` Line 154-155

### 계정 상태/역할
N/A (컴파일 타임 에러)

### 재현 절차
1. `npx tsc --noEmit` 실행
2. TS2300 에러 확인

### 기대 결과
중복 없이 한 번만 정의

### 실제 결과
`loadAttendances` 함수가 2번 선언됨

### 에러 메시지
```
error TS2300: Duplicate identifier 'loadAttendances'.
```

### 의심 원인 Top 3

1. **복사-붙여넣기 실수** (높음)
   - 개발 중 실수로 중복 선언

2. **병합 충돌 해결 오류** (중간)
   - Git 병합 시 충돌 해결 과정에서 중복 생성

3. **리팩토링 미완료** (낮음)
   - 함수 이름 변경 과정에서 미완료

---

## TODO/누락

1. **런타임 에러 수집**: 실제 사용 중 발생하는 런타임 에러 로그 수집 필요
2. **Network 로그 수집**: Firestore/Sorage API 호출 실패 케이스 수집
3. **Functions 로그**: Cloud Functions 구현 후 로그 수집

