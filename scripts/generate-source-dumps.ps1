# PowerShell Script: 소스 코드 덤프 MD 파일 자동 생성
# 목적: docs/_understanding_pack 폴더에 91, 92, 93, 99 MD 파일 생성

param(
    [string]$OutputDir = "docs/_understanding_pack"
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$OutputPath = Join-Path $ProjectRoot $OutputDir

# 함수: 파일들을 MD 포맷으로 변환
function Convert-DirectoryToMarkdown {
    param(
        [string]$SourceDir,
        [string]$Title,
        [string]$Description,
        [array]$ExcludePatterns = @('node_modules', '.git', 'dist', '.firebase', '.next', 'build', '.turbo')
    )
    
    $content = @"
# $Title

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## 📋 설명
$Description

### 🔍 포함 범위
- 모든 소스 파일 (제외: node_modules, dist, .git, .firebase 등)
- 정렬: 파일 경로 순서

### ⚠️ 주의
- 원본 콘텐츠 100% 포함 (요약 없음)
- 읽기 전용 (수정 금지)
- 파일 구조는 원본 그대로 유지

---

"@
    
    # 재귀적으로 모든 파일 수집
    $files = Get-ChildItem -Path $SourceDir -Recurse -File | 
        Where-Object { 
            $relativePath = $_.FullName.Replace($SourceDir, '').TrimStart('\/')
            -not ($ExcludePatterns | Where-Object { $relativePath -match $_ })
        } | 
        Sort-Object FullName
    
    Write-Host "📁 Collecting $($files.Count) files from $Title..." -ForegroundColor Cyan
    
    foreach ($file in $files) {
        $relativePath = $file.FullName.Replace($SourceDir, '').TrimStart('\/')
        $content += "`n## 📄 $relativePath`n"
        $content += "````"
        
        # 파일 확장자로 언어 지정
        $ext = $file.Extension.TrimStart('.')
        $lang = switch ($ext) {
            'ts' { 'typescript' }
            'tsx' { 'typescript' }
            'js' { 'javascript' }
            'jsx' { 'javascript' }
            'json' { 'json' }
            'css' { 'css' }
            'html' { 'html' }
            'md' { 'markdown' }
            default { '' }
        }
        
        if ($lang) {
            $content += $lang + "`n"
        } else {
            $content += "`n"
        }
        
        # 파일 내용 읽기
        try {
            $fileContent = Get-Content -Path $file.FullName -Raw -Encoding UTF8
            $content += $fileContent
        } catch {
            $content += "[ERROR: 파일을 읽을 수 없음: $_]"
        }
        
        $content += "`n````"
        $content += "`n"
    }
    
    return $content
}

# 91번: src 소스 덤프
Write-Host "`n🔵 [1/4] 91_FULL_SOURCE_DUMP_SRC.md Creating..." -ForegroundColor Green
$srcDumpContent = Convert-DirectoryToMarkdown `
    -SourceDir (Join-Path $ProjectRoot "src") `
    -Title "91. 전체 소스 덤프: src/ 디렉토리" `
    -Description "React 프론트엔드 소스 코드 전체 (App, components, contexts, pages, lib/firebase, styles 포함)"

$srcDumpPath = Join-Path $OutputPath "91_FULL_SOURCE_DUMP_SRC.md"
$srcDumpContent | Out-File -FilePath $srcDumpPath -Encoding UTF8
Write-Host "Created: $srcDumpPath ($(($srcDumpContent | Measure-Object -Character).Characters / 1024 / 1024)MB)" -ForegroundColor Green

# 92번: functions 소스 덤프
Write-Host "`n🔵 [2/4] 92_FULL_SOURCE_DUMP_FUNCTIONS.md Creating..." -ForegroundColor Green
$functionsDumpContent = Convert-DirectoryToMarkdown `
    -SourceDir (Join-Path $ProjectRoot "functions/src") `
    -Title "92. 전체 소스 덤프: functions/src/ 디렉토리" `
    -Description "Cloud Functions v2 소스 코드 전체 (callables, scheduled, shared 모듈 포함)"

$functionsDumpPath = Join-Path $OutputPath "92_FULL_SOURCE_DUMP_FUNCTIONS.md"
$functionsDumpContent | Out-File -FilePath $functionsDumpPath -Encoding UTF8
Write-Host "Created: $functionsDumpPath ($(($functionsDumpContent | Measure-Object -Character).Characters / 1024 / 1024)MB)" -ForegroundColor Green

# 93번: tests 소스 덤프
Write-Host "`n🔵 [3/4] 93_FULL_SOURCE_DUMP_TESTS.md Creating..." -ForegroundColor Green
$testsDumpContent = Convert-DirectoryToMarkdown `
    -SourceDir (Join-Path $ProjectRoot "tests") `
    -Title "93. 전체 소스 덤프: tests/ 디렉토리" `
    -Description "Firestore Rules 단위 테스트 및 E2E 테스트 코드 전체"

$testsDumpPath = Join-Path $OutputPath "93_FULL_SOURCE_DUMP_TESTS.md"
$testsDumpContent | Out-File -FilePath $testsDumpPath -Encoding UTF8
Write-Host "Created: $testsDumpPath ($(($testsDumpContent | Measure-Object -Character).Characters / 1024 / 1024)MB)" -ForegroundColor Green

# 99번: Known Limitations and Next Hooks
Write-Host "`n🔵 [4/4] 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md Creating..." -ForegroundColor Green

$limitationsContent = @"
# 99. 알려진 제한사항 및 v1.2 후크 포인트

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Branch**: feat/atom-14-17-board-comments-notice  
**Last Commit**: v1.1 MVP 리셋 및 구현 완료 (P0-P6)

---

## ⚠️ 알려진 제한사항 (Known Limitations)

### 1. Firestore Rules 테스트 실패 (μATOM-0606)
**파일**: [tests/rules/firestore.rules.test.ts](tests/rules/firestore.rules.test.ts#L1)  
**상태**: 1개 테스트 실패 (7/8 통과)  
**테스트명**: "μATOM-0606: free 작성자만 update/delete"  

**현상**:
- Free post 작성자가 자신의 게시글을 업데이트 시도 시 PERMISSION_DENIED 반환
- 규칙 평가: L39 (match rule), L111 (allow expression)
- Exit Code: 1

**영향범위**:
- Firestore Rules 정책 L111 근처의 free post 작성자 write 권한 검증 로직
- 현재 규칙이 의도한 대로 작성자만 업데이트 가능한지 재검토 필요

**권장 조치** (v1.2 이후):
1. [firestore.rules](firestore.rules#L111) 의 free post author 권한 재검증
2. 규칙 테스트 추가 (LOCK 상태 post, pinned post 등 엣지 케이스)
3. 필요 시 규칙 수정 및 재테스트

**참고 로그**:
\`\`\`
$ npx firebase emulators:exec --only firestore,auth "npm run test:rules"
...
FAIL tests/rules/firestore.rules.test.ts
  Firestore Rules Tests
    μATOM-0606: free 작성자만 update/delete
      ✕ (PERMISSION_DENIED)
      Error: false for 'update' @ L39
      Evaluation error @ L111:26

Exit code: 1
\`\`\`

---

### 2. 번들 크기 경고 (Large Chunk)
**파일**: [vite.config.ts](vite.config.ts)  
**현상**:
- 빌드 시 JS chunk ~1.17 MB (매우 큼)
- CSS chunk ~129 kB
- 개발 환경에서는 경고만 표시, 기능 영향 없음

**영향범위**:
- 모바일 기기에서 초기 로딩 시간 증가 가능 (특히 느린 네트워크)
- PWA 설치 및 업데이트 시간 증가

**권장 조치** (v1.2 이후):
1. 코드 스플리팅 최적화 (route-based code splitting 강화)
2. Tree shaking 검토 (unused imports 제거)
3. 번들 분석 도구 활용 (e.g., `npm run analyze` 추가)
4. 라이브러리 종속성 검토 (motion/react, radix-ui 등)

**참고 로그**:
\`\`\`
$ npm run build
...
  dist/index.html                    0.74 kB
  dist/assets/index-*.js          1.17 MB
  dist/assets/index-*.css         129.78 kB

⚠️ (!) some chunks are > 500kB after minification. Consider:
- Using dynamic import() to code-split the application
- Lazy loading routes and components
- Reducing imports and dependencies
\`\`\`

---

### 3. 하드코딩된 클럽 ID (Hardcoded Club ID)
**파일**: 
- [src/app/contexts/ClubContext.tsx#L10](src/app/contexts/ClubContext.tsx#L10)
- [src/lib/firebase/auth.service.ts#L29](src/lib/firebase/auth.service.ts#L29)
- Functions: [functions/src/shared/paths.ts](functions/src/shared/paths.ts)

**상태**: 현재 v1.0은 단일 클럽 프로토타입 (clubId = 'default-club' or 'WINGS')  
**제한사항**: 다중 클럽 지원 불가

**권장 조치** (v1.2 이후):
1. URL 기반 클럽 선택 (e.g., `/club/:clubId/home`)
2. 클럽 선택 화면 추가 (사용자가 여러 클럽 가입 시)
3. 클럽별 권한 격리 검증 강화
4. DB 마이그레이션 (clubId 파라미터 일관성 검토)

---

### 4. 인앱 브라우저 로그인 차단
**파일**: [src/app/pages/LoginPage.tsx#L35](src/app/pages/LoginPage.tsx#L35)  
**현상**: 카카오톡, 인스타그램 등 인앱 브라우저에서 Google OAuth 불가  
**원인**: Google 보안 정책 (기본값 차단)

**권장 조치** (v1.2 이후):
1. 대체 인증 수단 검토 (Anonymous + 전화 인증?)
2. WebView 환경에서 OAuth 예외 처리 (앱 측에서 별도 로직)
3. 사용자 교육 (메시지 개선)

---

### 5. 출석 투표 마감 시간 자동 계산 (Vote Close Time Computation)
**파일**: 
- [functions/src/shared/time.ts](functions/src/shared/time.ts)
- [functions/src/callables/events.ts#L85](functions/src/callables/events.ts#L85)

**정책**: startAt의 전날 밤 11시 (KST 23:00)  
**제한사항**: 
- 시간대 하드코딩 (Asia/Seoul만 지원)
- 타임존 변경 불가능

**권장 조치** (v1.2 이후):
1. 클럽 설정에서 투표 마감 시간 커스터마이징
2. 타임존 선택 기능 추가
3. 마감 시간 예측 UI 개선 (사용자에게 명확한 표시)

---

### 6. FCM 토큰 실패 처리 (FCM Token Failure Handling)
**파일**: [functions/src/shared/fcm.ts#L150](functions/src/shared/fcm.ts#L150)  
**현상**: 무효한 토큰 자동 삭제 후 재발송 없음

**권장 조치** (v1.2 이후):
1. 실패한 토큰에 대한 재시도 로직 추가
2. 토큰 갱신 자동화 (클라이언트 측)
3. 토큰 실패 로그 모니터링 대시보드

---

### 7. 게시글 LOCK 상태 미지원 (Post Recording Lock Not Implemented)
**파일**: [firestore.rules](firestore.rules) (recordingLocked field 없음)  
**상태**: PRD에는 정의했으나 구현 미완료

**권장 조치** (v1.2):
1. recordingLocked 필드 추가
2. 경기 기록 마감 UI/UX 구현
3. Firestore Rules에서 LOCK 상태 체크 로직 추가

---

## 🎯 v1.2 주요 후크 포인트 (Major Hook Points)

### Phase A: 데이터 구조 확장
- [ ] 경기 기록 시스템 구현 (라인업, 타자, 투수 기록)
- [ ] 회비 관리 기능 추가
- [ ] 앨범/사진 관리 기능

**참고 파일**:
- [firestore.rules](firestore.rules) - 새로운 컬렉션 정책 추가
- [functions/src/callables/](functions/src/callables/) - 새로운 callable 추가

### Phase B: 권한/보안 강화
- [ ] 다중 클럽 지원 아키텍처
- [ ] 세분화된 역할 정책 (예: 코치, 주급사 등)
- [ ] 감사 로그 대시보드

**참고 파일**:
- [src/app/contexts/AuthContext.tsx](src/app/contexts/AuthContext.tsx)
- [src/app/contexts/ClubContext.tsx](src/app/contexts/ClubContext.tsx)
- [firestore.rules](firestore.rules#L1)

### Phase C: 성능 최적화
- [ ] 번들 크기 감소 (code splitting, tree shaking)
- [ ] Firestore 쿼리 최적화 (인덱스, 페이지네이션)
- [ ] 캐싱 전략 개선

**참고 파일**:
- [src/lib/firebase/firestore.service.ts](src/lib/firebase/firestore.service.ts)
- [vite.config.ts](vite.config.ts)

### Phase D: 테스트 커버리지 강화
- [ ] 실패한 Firestore Rules 테스트 수정 (μATOM-0606)
- [ ] E2E 테스트 확대
- [ ] 통합 테스트 추가

**참고 파일**:
- [tests/rules/firestore.rules.test.ts](tests/rules/firestore.rules.test.ts#L200)
- [tests/e2e/](tests/e2e/) - 추가 시나리오

---

## 📊 정성적 평가 (Qualitative Assessment)

### 강점 (Strengths)
✅ 명확한 권한 정책 (Firestore Rules 기반)  
✅ 멱등성 처리 (중복 요청 방지)  
✅ 감사 로그 시스템  
✅ 푸시 알림 통합  
✅ 모바일 반응형 UI (PWA)  

### 약점 (Weaknesses)
❌ 불완전한 테스트 커버리지 (1개 실패)  
❌ 큰 번들 크기  
❌ 단일 클럽 제약  
❌ 제한된 인증 수단  

---

## 🚀 배포 전 체크리스트 (Pre-Deployment Checklist)

- [x] 타입 검사 통과 (npm run type-check)
- [x] 빌드 성공 (npm run build)
- [x] Functions 빌드 성공 (cd functions && npm run build)
- [ ] 모든 Rules 테스트 통과 (현재 1개 실패)
- [ ] E2E 테스트 통과
- [x] Firebase emulator 테스트 (부분 통과)
- [ ] 보안 리뷰 완료
- [ ] 성능 테스트 완료
- [ ] 사용자 테스트 완료

---

## 📝 참고 문서

- [PRD 및 아키텍처](handoff_pack/00_INDEX.md)
- [Firestore 스키마](handoff_pack/05_FIRESTORE_SCHEMA.md)
- [보안 규칙](handoff_pack/06_SECURITY_RULES.md)
- [함수 명세서](handoff_pack/07_FUNCTIONS_SPEC.md)

**Last Updated**: 2024-12-19  
**Status**: v1.1 MVP 완료, v1.2 준비 단계
"@

$limitationsPath = Join-Path $OutputPath "99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md"
$limitationsContent | Out-File -FilePath $limitationsPath -Encoding UTF8
Write-Host "Created: $limitationsPath" -ForegroundColor Green

# Completion message
Write-Host "`n" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green
Write-Host "All source dump files created successfully!" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Cyan
Write-Host "  [1] 91_FULL_SOURCE_DUMP_SRC.md" -ForegroundColor Yellow
Write-Host "  [2] 92_FULL_SOURCE_DUMP_FUNCTIONS.md" -ForegroundColor Yellow
Write-Host "  [3] 93_FULL_SOURCE_DUMP_TESTS.md" -ForegroundColor Yellow
Write-Host "  [4] 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Output Directory: $OutputPath" -ForegroundColor Cyan
Write-Host ""
param(
    [string]$OutputDir = "docs\_understanding_pack"
)

$ProjectRoot = (Get-Location).Path
$OutputPath = Join-Path $ProjectRoot $OutputDir

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
}
