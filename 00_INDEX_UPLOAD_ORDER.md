# 00. INDEX & UPLOAD ORDER
**작성일**: 2025-12-18 | **Status**: Release Audit Report  
**프로젝트**: Wings Baseball Club PWA | **Branch**: main | **Commit**: 40d929c0acd84142eec03b78b66f8d1d8fa315a5

---

## 📋 생성된 MD 파일 전체 목록 (10개)

| # | 파일명 | 주제 | 상태 |
|---|--------|------|------|
| 1️⃣ | [01_REPO_SNAPSHOT.md](01_REPO_SNAPSHOT.md) | Git, 환경, 폴더 구조 | ✅ |
| 2️⃣ | [02_BUILD_AND_TYPESCRIPT.md](02_BUILD_AND_TYPESCRIPT.md) | 빌드 현황, 43 TS 에러 목록 | ✅ |
| 3️⃣ | [03_RUNTIME_LOGS_AND_ISSUES.md](03_RUNTIME_LOGS_AND_ISSUES.md) | 콘솔 로그, 권한 매트릭스 | ✅ |
| 4️⃣ | [04_FIREBASE_CONFIG_DEPLOY.md](04_FIREBASE_CONFIG_DEPLOY.md) | Firebase 설정, 배포 준비 | ✅ |
| 5️⃣ | [05_FIRESTORE_SCHEMA_SNAPSHOT.md](05_FIRESTORE_SCHEMA_SNAPSHOT.md) | DB 스키마, 필드 정의 | ✅ |
| 6️⃣ | [06_FIRESTORE_RULES_REVIEW.md](06_FIRESTORE_RULES_REVIEW.md) | 보안 규칙, 5 검증 완료 | ✅ |
| 7️⃣ | [07_WF07_CODE_MAP.md](07_WF07_CODE_MAP.md) | 코드 구조, 데이터 흐름 | ✅ |
| 8️⃣ | [08_BUGFIX_WF07_REPRO_ROOTCAUSE.md](08_BUGFIX_WF07_REPRO_ROOTCAUSE.md) | **이슈 A, B, C 원인 분석** | ✅ |
| 9️⃣ | [09_PATCH_PLAN_ATOMIC.md](09_PATCH_PLAN_ATOMIC.md) | **P0/P1/P2 패치 계획** | ✅ |
| 🔟 | [10_DOC_POLICY_ALIGNMENT.md](10_DOC_POLICY_ALIGNMENT.md) | **문서 정책 일관성** | ✅ |

---

## 🚀 업로드 분할 전략


---

## 🎯 사용 시나리오별 읽기 순서

### **시나리오 1: 상황 파악 (Senior Manager, 40분)**
```
01_REPO_SNAPSHOT.md (5분)
	↓
02_BUILD_AND_TYPESCRIPT.md (10분)
	↓
08_BUGFIX_WF07_REPRO_ROOTCAUSE.md - 이슈 요약 (10분)
	↓
09_PATCH_PLAN_ATOMIC.md - 패치 계획 (15분)
```

### **시나리오 2: 기술 심사 (Tech Lead, 62분)**
```
02_BUILD_AND_TYPESCRIPT.md (10분)
	↓
05_FIRESTORE_SCHEMA_SNAPSHOT.md (10분)
	↓
06_FIRESTORE_RULES_REVIEW.md (12분)
	↓
07_WF07_CODE_MAP.md (15분)
	↓
10_DOC_POLICY_ALIGNMENT.md (15분)
```

### **시나리오 3: 버그 수정 (개발팀, 60분)**
```
07_WF07_CODE_MAP.md (15분)
	↓
08_BUGFIX_WF07_REPRO_ROOTCAUSE.md (20분)
	↓
09_PATCH_PLAN_ATOMIC.md (25분)
```

### **시나리오 4: 배포 준비 (DevOps, 29분)**
```
04_FIREBASE_CONFIG_DEPLOY.md (7분)
	↓
06_FIRESTORE_RULES_REVIEW.md (12분)
	↓
09_PATCH_PLAN_ATOMIC.md - 배포 섹션 (10분)
```

---

## 🔑 핵심 발견사항 (빠른 요약)

### ✅ 긍정적 발견

| 항목 | 발견 | 문서 |
|-----|------|------|
| 빌드 성공 | npm run build 성공 (2961 modules) | 02 |
| 권한 체계 | 5개 역할 명확히 구현 | 06, 07 |
| 보안 규칙 | 5/5 검증 통과 | 06 |
| API 설계 | Service layer 잘 추상화됨 | 07 |

### ⚠️ 주의 필요

| 항목 | 문제 | 심각도 | 문서 |
|-----|------|--------|------|
| TS 에러 | 43개 (P0: 3, P1: 15, P2: 25) | 중 | 02 |
| CommentList 버그 | author.id → authorId 필수 | 높음 | 05, 10 |
| 이슈 C (테이블) | 모바일 스크롤 불가 | 높음 | 08, 09 |
| README 초대 정책 | 문서 vs 코드 불일치 | 중 | 10 |

### 🔴 긴급 조치 필요

| 항목 | 조치 | 담당 | 문서 |
|-----|------|------|------|
| 3개 이슈 수정 | Issue A, B, C 패치 | 개발팀 | 08, 09 |
| CommentList 수정 | authorId 타입 수정 | 개발팀 | 10 |
| README 갱신 | 인증 정책 명확화 | 문서팀 | 10 |
| CHANGELOG 작성 | 표준 형식 도입 | 문서팀 | 10 |


---

## 📌 추가 코드 파일 후보 (Reference용)
프리뷰/상세 분석 시 참조할 코드 파일 목록:

| 파일경로 | 역할 | 우선도 |
|---------|------|--------|
| `src/app/pages/GameRecordPage.tsx` | 경기 기록 페이지 메인 컴포넌트 | P0 |
| `src/app/components/game-record/LineupEditor.tsx` | 라인업 편집 (타자/포지션 입력) | P0 |
| `src/app/components/game-record/BatterTable.tsx` | 타자 기록 테이블 (스크롤 이슈 원인) | P0 |
| `src/app/components/game-record/PitcherTable.tsx` | 투수 기록 테이블 | P0 |
| `src/app/components/MemberPicker.tsx` | 멤버 선택 모달 (이슈 B 원인) | P0 |
| `src/app/components/CommentList.tsx` | 댓글 목록 (이슈 A 원인) | P0 |
| `src/app/contexts/DataContext.tsx` | 데이터 상태 관리 (addComment, updatePost) | P1 |
| `src/lib/firebase/firestore.service.ts` | Firebase 서비스 레이어 | P1 |
| `src/lib/firebase/auth.service.ts` | 인증 서비스 (가입 정책) | P1 |
| `src/app/contexts/AuthContext.tsx` | 인증 상태 관리 | P1 |
| `firestore.rules` | Firestore 보안 규칙 | P1 |
| `src/lib/firebase/types.ts` | Firestore 문서 타입 정의 | P2 |

---

## 🔐 비밀값 마스킹 기준

### **마스킹 대상 및 규칙**

| 카테고리 | 마스킹 대상 | 처리 방법 |
|---------|-----------|---------|
| **Firebase Project ID** | `wings-baseball-club` | 프로젝트명만 유지, URL/키는 제외 |
| **API Keys** | `VITE_FIREBASE_API_KEY` 등 | `[REDACTED-FIREBASE-KEY]` |
| **Service Account** | 서비스 계정 JSON | 파일 경로만 표기, 내용 제외 |
| **사용자 ID/UID** | Firebase UID, User ID | `[USER-ID-HASH]` 또는 예시만 표기 |
| **이메일 주소** | 실제 이메일 | `user@[DOMAIN]` 형식으로 마스킹 |
| **비밀번호/토큰** | 모든 인증 토큰 | 언급하지 않음 |
| **개인정보** | 실명, 전화번호 | `[MEMBER-NAME]`, `[PHONE]` |
| **GitHub/외부 링크** | 개인 리포 URL | 마스킹하지 않음 (공개 프로젝트 가정) |

### **예시**
- ❌ `VITE_FIREBASE_API_KEY=AIzaSyDxW...truncated`
- ✅ `VITE_FIREBASE_API_KEY=[REDACTED-FIREBASE-KEY]`

- ❌ `recorders: ['user123abc', 'user456def']`
- ✅ `recorders: [[USER-ID-HASH-1], [USER-ID-HASH-2]]`

---

## ✅ 문서 작성 체크리스트

- [x] 00_INDEX_UPLOAD_ORDER.md – 작성 완료
- [ ] 01_REPO_SNAPSHOT.md
- [ ] 02_BUILD_AND_TYPESCRIPT.md
- [ ] 03_RUNTIME_LOGS_AND_ISSUES.md
- [ ] 04_FIREBASE_CONFIG_DEPLOY.md
- [ ] 05_FIRESTORE_SCHEMA_SNAPSHOT.md
- [ ] 06_FIRESTORE_RULES_REVIEW.md
- [ ] 07_WF07_CODE_MAP.md
- [ ] 08_BUGFIX_WF07_REPRO_ROOTCAUSE.md ⭐ **이슈 A, B, C 완결**
- [ ] 09_PATCH_PLAN_ATOMIC.md
- [ ] 10_DOC_POLICY_ALIGNMENT.md

---

## 📝 다음 단계

1. **01~05 업로드 완료** → 팀과 기초 환경 공유
2. **이슈 재현 & 분석** (08번 파일 작성 중)
3. **06~10 업로드** → 보안, 기능, 패치 계획 제시
4. **패치 실행** → 09번 계획 기반 수정
5. **검증** → 각 패치별 검증 시나리오 실행
