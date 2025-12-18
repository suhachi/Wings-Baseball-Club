# 02. BUILD AND TYPESCRIPT
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA  
**목적**: 빌드 및 TypeScript 상태를 증거로 고정

---

## 📊 빌드 상태 요약

| 항목 | 결과 | 상태 |
|------|------|------|
| **npm ci** | 미실행 | N/A |
| **npm install** | 필요 (package.json 기반) | N/A |
| **npm run build** | ✅ 성공 (경고 포함) | 프로덕션 배포 가능 |
| **npm run type-check** | ⚠️ 43개 에러 | TS 엄격 모드 활성 상태 |
| **dist/ 생성** | ✅ Yes | index.html, CSS, JS 존재 |

---

## 🔨 npm run build 실행 로그

### 명령어
```bash
npm run build
```

### 전체 출력 (요약 + 주요 부분)

```
> @figma/my-make-file@0.0.1 build
> vite build

vite v6.3.5 building for production...
transforming...
✓ 2961 modules transformed.

(!) D:/projectsing/Wings Baseball Club Community PWA/src/lib/firebase/auth.service.ts 
    is dynamically imported by:
      - src/app/pages/AdminPage.tsx
      - src/app/pages/LoginPage.tsx
    but also statically imported by:
      - src/app/contexts/AuthContext.tsx
      - src/app/pages/LoginPage.tsx
    
    Dynamic import will not move module into another chunk.

rendering chunks...
computing gzip size...

✓ dist/index.html              1.28 kB │ gzip:   0.64 kB
✓ dist/assets/index-CTN_kpCA.css 136.55 kB │ gzip:  20.44 kB
✓ dist/assets/index-CN9RyZBU.js 1,284.93 kB │ gzip: 340.58 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

### 분석

| 경고 | 심각도 | 대응 |
|-----|--------|------|
| **Dynamic/Static import 혼재** (auth.service.ts) | ⚠️ Medium | 번들 최적화 기회 (P2) |
| **1.28MB 단일 chunk** | ⚠️ Medium | 코드 분할 권장 (P2) |
| **gzip 340KB** | ℹ️ Info | 네트워크 전송량 양호 |

### 결론: ✅ 빌드 성공
- 모든 2,961개 모듈 변환됨
- dist/ 폴더 생성됨 (HTML, CSS, JS)
- **프로덕션 배포 가능 상태**

---

## 📝 TypeScript 타입 검사 결과

### 명령어
```bash
npm run type-check
# 또는
tsc --noEmit
```

### 최종 결과
```
Found 43 errors in 16 files.
Exit Code: 1 (실패)
```

### 에러 분류 (파일:라인:메시지)

#### ✗ P0 (런타임 위험 / 즉시 수정 필요)

**1. DataContext.tsx에서 타입 불일치**
| 파일 | 라인 | 에러 | 분석 |
|-----|------|------|------|
| `src/app/contexts/DataContext.tsx` | 118 | `Cannot find name 'UserRole'` | 타입 import 누락 |
| `src/app/contexts/DataContext.tsx` | 352 | `Type 'Date \| null' is not assignable to type 'Date \| undefined'` | closeAt 필드 타입 불일치 |
| `src/app/contexts/DataContext.tsx` | 444 | `Type 'string \| null \| undefined' is not assignable to type 'string \| undefined'` | authorPhotoURL 필드 타입 불일치 |

**근거 코드** (DataContext.tsx, 라인 118):
```typescript
interface User {
  role: UserRole;  // ❌ UserRole 정의 찾을 수 없음
}
```

**원인**: `UserRole`을 import 하지 않음
```typescript
// ❌ 현재 (import 없음)
import type { UserRole } from '../../lib/firebase/types';

// ✅ 수정 필요
import type { UserRole } from '../../lib/firebase/types';
```

---

**2. AdminPage.tsx에서 상태 타입 오류**
| 파일 | 라인 | 에러 | 분석 |
|-----|------|------|------|
| `src/app/pages/AdminPage.tsx` | 201 | `This comparison appears to be unintentional because the types '"pending" \| "active" \| "rejected" \| "withdrawn"' and '"inactive"' have no overlap` | 허용되지 않는 상태값 사용 |
| `src/app/pages/AdminPage.tsx` | 428 | `Type '"active" \| "inactive"' is not assignable to type '"pending" \| "active" \| "rejected" \| "withdrawn" \| undefined'` | 폼에서 'inactive' 상태 할당 시도 |

**근거 코드** (AdminPage.tsx, 라인 201):
```typescript
inactiveMembers: members.filter((m) => m.status === 'inactive').length,
// ❌ 'inactive'는 타입 정의에 없음 (pending, active, rejected, withdrawn만 유효)
```

**원인**: Member 상태 값이 types.ts에서 정의한 타입과 불일치

---

**3. lodash 선언 파일 누락**
| 파일 | 라인 | 에러 | 분석 |
|-----|------|------|------|
| `src/app/components/game-record/LineupEditor.tsx` | 13 | `Could not find a declaration file for module 'lodash'` | @types/lodash 미설치 |

**원인**: lodash 사용하지만 TypeScript 타입 정의 패키지 미설치
```typescript
import { debounce } from 'lodash';  // ❌ TS 정의 파일 없음
```

---

#### ⚠️ P1 (기능 오류 / 우선 수정)

**4. 미사용 import 선언들 (각 파일)**
| 파일 | 라인 | import | 분석 |
|-----|------|--------|------|
| `CreatePostModal.tsx` | 20 | `user` | 선언만 하고 미사용 |
| `EditPostModal.tsx` | 2 | `Calendar` | 선언만 하고 미사용 |
| `BatterTable.tsx` | 2 | `useData`, `Save`, `Loader2`, `Trash2` | 5개 미사용 |
| `LineupEditor.tsx` | 1 | `useCallback`, `useAuth`, `useData`, `Input`, `debounce` | 5개 미사용 |
| `PitcherTable.tsx` | 2 | `useAuth`, `useData` | 2개 미사용 |

**정책** (tsconfig.json 라인 ~20):
```json
"noUnusedLocals": true,
"noUnusedParameters": true
```

---

**5. 미사용 변수/파라미터 (각 파일)**
| 파일 | 라인 | 변수 | 분석 |
|-----|------|------|------|
| `GameRecordPage.tsx` | 141 | `isLocking` | useState 선언만, 미사용 |
| `GameRecordPage.tsx` | 163 | `canLock` | useMemo 선언만, 미사용 |
| `AdminPage.tsx` | 67 | `setLoading` | setState 미사용 |
| `AdminPage.tsx` | 92 | `loadData` | 함수 선언만, 미사용 |
| `HomePage.tsx` | 18 | `user` | destructure만, 미사용 |

---

#### ℹ️ P2 (코드 정리 / 낮은 우선도)

- **BatterTable.tsx:66** – `ids` 파라미터 미사용 (handleCreate)
- **LineupEditor.tsx:164** – `ids` 파라미터 미사용 (onSelectionChange)
- **PitcherTable.tsx:69** – `ids` 파라미터 미사용 (handleCreate)
- **FinancePage.tsx:9~12** – Filter, CreditCard, ShoppingBag import 미사용
- **BoardsPage.tsx:3** – Calendar import 미사용
- **LoginPage.tsx:21** – isIOS import 미사용
- **MyPage.tsx:5** – Comment import 미사용
- **NotificationPage.tsx:12** – Trash2 import 미사용
- **SchedulePage.tsx:346** – user import 미사용
- **auth.service.ts:432** – role 파라미터 미사용

---

## 📌 에러 분포 (파일별)

```
Total: 43 errors in 16 files

src/app/components/CreatePostModal.tsx           1 error
src/app/components/EditPostModal.tsx            2 errors
src/app/components/game-record/BatterTable.tsx  6 errors
src/app/components/game-record/LineupEditor.tsx 8 errors
src/app/components/game-record/PitcherTable.tsx 4 errors
src/app/contexts/DataContext.tsx                3 errors
src/app/pages/AdminPage.tsx                     4 errors
src/app/pages/BoardsPage.tsx                    1 error
src/app/pages/FinancePage.tsx                   4 errors
src/app/pages/GameRecordPage.tsx                3 errors
src/app/pages/HomePage.tsx                      1 error
src/app/pages/LoginPage.tsx                     1 error
src/app/pages/MyPage.tsx                        1 error
src/app/pages/NotificationPage.tsx              2 errors
src/app/pages/SchedulePage.tsx                  1 error
src/lib/firebase/auth.service.ts                1 error
```

---

## 🎯 우선순위별 수정 계획

### P0 (즉시)
1. **DataContext.tsx** – UserRole 타입 import 추가
2. **DataContext.tsx** – closeAt, authorPhotoURL 타입 수정
3. **AdminPage.tsx** – 'inactive' 상태 제거 (valid values: pending, active, rejected, withdrawn)
4. **LineupEditor.tsx** – @types/lodash 설치 또는 debounce 제거

### P1 (1차)
5. 모든 미사용 import 제거 (auto-fix 가능: `tsc` + IDE)
6. 모든 미사용 변수/파라미터 제거 또는 _ 접두사 적용

### P2 (2차)
7. 파라미터 미사용 (ids) – 콜백 시그니처 재검토

---

## 🔍 환경 차이 분석

| 환경 | 빌드 | TS 체크 | 배포 |
|-----|------|--------|------|
| **로컬 (현재)** | ✅ 성공 | ⚠️ 43 errors | ✅ dist/ 생성 |
| **CI/CD** | 미확인 | 예상: 동일 | 예상: GitHub Actions? |
| **배포 (Firebase)** | Firebase Hosting 사용 | N/A | ✅ 가능 (dist/) |

**주의**: TypeScript 에러가 있어도 **빌드는 성공**함. 이는 `tsconfig.json`에서 `noEmit: true`이므로 TS는 타입 검사만 하고 빌드는 Vite가 독립적으로 수행하기 때문.

---

## ✅ 빌드 안정성 체크리스트

- [x] Vite 빌드 성공 (2,961 modules)
- [x] dist/ 생성 (HTML, CSS, JS)
- [x] 번들 크기 양호 (gzip 340KB)
- [ ] **TypeScript 에러 0** (현재 43개)
- [ ] 경고 0 (현재 2개)
- [ ] CI/CD 파이프라인 확인 (미확인)

---

## 📋 Next Steps

1. **P0 에러 수정** – 위 리스트 기반 패치 작성
2. **npm run type-check 재실행** – 에러 개수 추적
3. **빌드 재검증** – 패치 적용 후 성공 여부 확인
4. **배포 스테이징 테스트** – Firebase 호스팅에 배포 후 런타임 검증
