#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Source Code Dump Generator
 * Generates 91, 92, 93, 99 MD files with full source code content
 */

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'docs', '_understanding_pack');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`\n📂 Output directory: ${outputDir}\n`);

// Helper: Collect all files from a directory
function collectFiles(sourceDir, excludePatterns = []) {
  const files = [];
  const patterns = ['node_modules', '.git', 'dist', '.firebase', '.next', 'build', '.turbo', 'coverage'];
  
  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir);
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry);
        const relativePath = path.relative(sourceDir, fullPath);
        
        // Skip excluded patterns
        const shouldSkip = patterns.some(p => relativePath.includes(p)) || 
                          excludePatterns.some(p => relativePath.includes(p));
        
        if (shouldSkip) return;
        
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else {
          files.push(fullPath);
        }
      });
    } catch (e) {
      console.warn(`  ⚠️  Cannot read directory: ${dir}`);
    }
  }
  
  if (fs.existsSync(sourceDir)) {
    walk(sourceDir);
  }
  return files.sort();
}

// Helper: Get language from file extension
function getLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.md': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.env': 'bash',
  };
  return map[ext] || '';
}

// Helper: Convert directory to markdown
function convertDirectoryToMarkdown(sourceDir, title, description) {
  let content = `# ${title}\n\n`;
  content += `**Generated**: ${new Date().toISOString()}\n\n`;
  content += `## 📋 설명\n${description}\n\n`;
  content += `### 🔍 포함 범위\n- 모든 소스 파일 (제외: node_modules, dist, .git, .firebase 등)\n- 정렬: 파일 경로 순서\n\n`;
  content += `### ⚠️ 주의\n- 원본 콘텐츠 100% 포함 (요약 없음)\n- 읽기 전용 (수정 금지)\n- 파일 구조는 원본 그대로 유지\n\n---\n\n`;
  
  const files = collectFiles(sourceDir);
  console.log(`  📁 Collecting ${files.length} files from ${sourceDir}`);
  
  files.forEach(file => {
    const relativePath = path.relative(sourceDir, file);
    const language = getLanguage(file);
    
    content += `## 📄 ${relativePath}\n`;
    content += `\`\`\`${language}\n`;
    
    try {
      const fileContent = fs.readFileSync(file, 'utf-8');
      content += fileContent;
    } catch (e) {
      content += `[ERROR: Cannot read file: ${e.message}]`;
    }
    
    content += `\n\`\`\`\n\n`;
  });
  
  return content;
}

console.log(`🔵 [1/4] Creating 91_FULL_SOURCE_DUMP_SRC.md...`);
const srcContent = convertDirectoryToMarkdown(
  path.join(projectRoot, 'src'),
  '91. Full Source Dump: src/ Directory',
  'React frontend source code (App, components, contexts, pages, lib/firebase, styles)'
);
const srcPath = path.join(outputDir, '91_FULL_SOURCE_DUMP_SRC.md');
fs.writeFileSync(srcPath, srcContent, 'utf-8');
console.log(`✅ Created: 91_FULL_SOURCE_DUMP_SRC.md (${(srcContent.length / 1024 / 1024).toFixed(2)}MB)\n`);

console.log(`🔵 [2/4] Creating 92_FULL_SOURCE_DUMP_FUNCTIONS.md...`);
const functionsContent = convertDirectoryToMarkdown(
  path.join(projectRoot, 'functions', 'src'),
  '92. Full Source Dump: functions/src/ Directory',
  'Cloud Functions v2 source code (callables, scheduled, shared modules)'
);
const functionsPath = path.join(outputDir, '92_FULL_SOURCE_DUMP_FUNCTIONS.md');
fs.writeFileSync(functionsPath, functionsContent, 'utf-8');
console.log(`✅ Created: 92_FULL_SOURCE_DUMP_FUNCTIONS.md (${(functionsContent.length / 1024 / 1024).toFixed(2)}MB)\n`);

console.log(`🔵 [3/4] Creating 93_FULL_SOURCE_DUMP_TESTS.md...`);
const testsContent = convertDirectoryToMarkdown(
  path.join(projectRoot, 'tests'),
  '93. Full Source Dump: tests/ Directory',
  'Firestore Rules unit tests and E2E test code'
);
const testsPath = path.join(outputDir, '93_FULL_SOURCE_DUMP_TESTS.md');
fs.writeFileSync(testsPath, testsContent, 'utf-8');
console.log(`✅ Created: 93_FULL_SOURCE_DUMP_TESTS.md (${(testsContent.length / 1024 / 1024).toFixed(2)}MB)\n`);

console.log(`🔵 [4/4] Creating 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md...`);
const limitationsContent = `# 99. Known Limitations and v1.2 Hook Points

**Generated**: ${new Date().toISOString()}
**Branch**: feat/atom-14-17-board-comments-notice
**Last Commit**: v1.1 MVP Complete (P0-P6)

---

## ⚠️ Known Limitations (알려진 제한사항)

### 1. Firestore Rules Test Failure (μATOM-0606)
**File**: tests/rules/firestore.rules.test.ts
**Status**: 1 test failed (7/8 passed)
**Test Name**: "μATOM-0606: free post author can update/delete own posts"

**Symptom**:
- Free post author cannot update own post
- Rule evaluation: L39 (match rule), L111 (allow expression)
- PERMISSION_DENIED error returned
- Exit Code: 1

**Impact Range**:
- Firestore Rules policy L111 near free post author write permission logic
- Client-side expectation: author should be able to edit own free posts

**Recommended Action** (v1.2+):
1. Review [firestore.rules](firestore.rules#L111) free post author permission logic
2. Add more test cases (locked posts, pinned posts edge cases)
3. Fix rules if needed and re-test

### 2. Large Bundle Size Warning
**File**: vite.config.ts
**Symptom**:
- JS chunk ~1.17 MB (very large)
- CSS chunk ~129 kB
- Build warning displayed

**Impact**: Slower initial load on mobile (especially slow networks)

**Recommended Action** (v1.2+):
1. Implement route-based code splitting
2. Review and remove unused imports
3. Analyze bundle with \`npm run analyze\`
4. Consider library optimization

### 3. Hardcoded Club ID
**Files**: 
- src/app/contexts/ClubContext.tsx#L10 (clubId = 'default-club')
- src/lib/firebase/auth.service.ts#L29 (clubId = 'WINGS')

**Status**: v1.0 is single-club prototype
**Limitation**: No multi-club support

**Recommended Action** (v1.2+):
1. URL-based club selection (e.g., \`/club/:clubId/home\`)
2. Club selection screen for multi-club users
3. Strengthen club-scoped permission checks

### 4. In-App Browser Login Blocked
**File**: src/app/pages/LoginPage.tsx#L35
**Issue**: Google OAuth not available in KakaoTalk, Instagram etc.
**Cause**: Google security policy (default block)

**Recommended Action** (v1.2+):
1. Alternative authentication (Anonymous + Phone?)
2. WebView OAuth workaround
3. Better user messaging

### 5. Vote Close Time Auto-Calculation
**Files**: 
- functions/src/shared/time.ts
- functions/src/callables/events.ts#L85

**Policy**: Event startAt minus 1 day at 23:00 KST
**Limitation**: Timezone hardcoded to Asia/Seoul

**Recommended Action** (v1.2+):
1. Allow club settings for vote close time
2. Add timezone selection feature
3. Improve UI clarity

### 6. FCM Token Failure Handling
**File**: functions/src/shared/fcm.ts#L150
**Issue**: Invalid tokens auto-deleted, no retry

**Recommended Action** (v1.2+):
1. Add retry logic for failed tokens
2. Automate token refresh (client-side)
3. Token failure monitoring dashboard

### 7. Post Recording Lock Not Implemented
**File**: firestore.rules (recordingLocked field missing)
**Status**: Defined in PRD but not implemented

**Recommended Action** (v1.2):
1. Add recordingLocked field
2. Implement game recording close UI/UX
3. Add LOCK state check to Firestore Rules

---

## 🎯 v1.2 Major Hook Points

### Phase A: Data Structure Extension
- [ ] Game recording system (lineup, batter, pitcher records)
- [ ] Fee/treasury management
- [ ] Album/photo management

**Reference Files**:
- firestore.rules - Add new collection policies
- functions/src/callables/ - Add new callables

### Phase B: Permission/Security Enhancement
- [ ] Multi-club architecture
- [ ] Granular role policies (coach, scorekeeper, etc.)
- [ ] Audit log dashboard

**Reference Files**:
- src/app/contexts/AuthContext.tsx
- src/app/contexts/ClubContext.tsx
- firestore.rules#L1

### Phase C: Performance Optimization
- [ ] Reduce bundle size (code splitting, tree shaking)
- [ ] Optimize Firestore queries (indexes, pagination)
- [ ] Improve caching strategy

**Reference Files**:
- src/lib/firebase/firestore.service.ts
- vite.config.ts

### Phase D: Test Coverage Enhancement
- [ ] Fix failed Firestore Rules test (μATOM-0606)
- [ ] Expand E2E tests
- [ ] Add integration tests

**Reference Files**:
- tests/rules/firestore.rules.test.ts#L200
- tests/e2e/ - Add more scenarios

---

## 📊 Qualitative Assessment

### Strengths ✅
- Clear permission policies (Firestore Rules based)
- Idempotency handling (duplicate request prevention)
- Audit logging system
- Push notification integration
- Mobile-responsive UI (PWA)

### Weaknesses ❌
- Incomplete test coverage (1 test failed)
- Large bundle size
- Single-club limitation
- Limited auth methods
- Timezone hardcoded

---

## 🚀 Pre-Deployment Checklist

- [x] Type check passed (npm run type-check)
- [x] Build succeeded (npm run build)
- [x] Functions build succeeded (cd functions && npm run build)
- [ ] All Rules tests passed (currently 1 failed)
- [ ] E2E tests passed
- [x] Firebase emulator tests (partial pass)
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] User acceptance testing completed

---

**Last Updated**: 2024-12-19  
**Status**: v1.1 MVP complete, v1.2 preparation phase`;

const limitationsPath = path.join(outputDir, '99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md');
fs.writeFileSync(limitationsPath, limitationsContent, 'utf-8');
console.log(`✅ Created: 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md\n`);

// Completion message
console.log('='.repeat(60));
console.log('✅ All source dump files created successfully!');
console.log('='.repeat(60));
console.log('\nGenerated Files:');
console.log('  [1] 91_FULL_SOURCE_DUMP_SRC.md');
console.log('  [2] 92_FULL_SOURCE_DUMP_FUNCTIONS.md');
console.log('  [3] 93_FULL_SOURCE_DUMP_TESTS.md');
console.log('  [4] 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md');
console.log(`\nOutput: ${outputDir}\n`);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
