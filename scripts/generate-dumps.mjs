import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'docs', '_understanding_pack');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`\n📂 Output directory: ${outputDir}\n`);

function collectFiles(sourceDir, excludePatterns = []) {
  const files = [];
  const patterns = ['node_modules', '.git', 'dist', '.firebase', '.next', 'build', '.turbo', 'coverage'];
  
  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir);
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry);
        const relativePath = path.relative(sourceDir, fullPath);
        
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
      console.warn(`  ⚠️  Cannot read: ${dir}`);
    }
  }
  
  if (fs.existsSync(sourceDir)) {
    walk(sourceDir);
  }
  return files.sort();
}

function getLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript',
    '.json': 'json', '.css': 'css', '.scss': 'scss', '.html': 'html', '.md': 'markdown',
    '.yaml': 'yaml', '.yml': 'yaml', '.xml': 'xml', '.env': 'bash',
  };
  return map[ext] || '';
}

function convertDirectoryToMarkdown(sourceDir, title, description) {
  let content = `# ${title}\n\n`;
  content += `**Generated**: ${new Date().toISOString()}\n\n`;
  content += `## Description\n${description}\n\n`;
  content += `### Scope\n- All source files (excluding node_modules, dist, .git, .firebase)\n- Sorted by file path\n\n`;
  content += `### Warning\n- 100% original content (no summaries)\n- Read-only (no modifications)\n- File structure preserved\n\n---\n\n`;
  
  const files = collectFiles(sourceDir);
  console.log(`  📁 Collecting ${files.length} files...`);
  
  files.forEach(file => {
    const relativePath = path.relative(sourceDir, file);
    const language = getLanguage(file);
    
    content += `## ${relativePath}\n`;
    content += `\`\`\`${language}\n`;
    
    try {
      const fileContent = fs.readFileSync(file, 'utf-8');
      content += fileContent;
    } catch (e) {
      content += `[ERROR: Cannot read file]`;
    }
    
    content += `\n\`\`\`\n\n`;
  });
  
  return content;
}

console.log(`🔵 [1/4] Creating 91_FULL_SOURCE_DUMP_SRC.md...`);
const srcContent = convertDirectoryToMarkdown(
  path.join(projectRoot, 'src'),
  '91. Full Source Dump: src/ Directory',
  'React frontend source code'
);
fs.writeFileSync(path.join(outputDir, '91_FULL_SOURCE_DUMP_SRC.md'), srcContent, 'utf-8');
console.log(`✅ Created: 91_FULL_SOURCE_DUMP_SRC.md (${(srcContent.length / 1024 / 1024).toFixed(2)}MB)\n`);

console.log(`🔵 [2/4] Creating 92_FULL_SOURCE_DUMP_FUNCTIONS.md...`);
const functionsContent = convertDirectoryToMarkdown(
  path.join(projectRoot, 'functions', 'src'),
  '92. Full Source Dump: functions/src/ Directory',
  'Cloud Functions v2 source code'
);
fs.writeFileSync(path.join(outputDir, '92_FULL_SOURCE_DUMP_FUNCTIONS.md'), functionsContent, 'utf-8');
console.log(`✅ Created: 92_FULL_SOURCE_DUMP_FUNCTIONS.md (${(functionsContent.length / 1024 / 1024).toFixed(2)}MB)\n`);

console.log(`🔵 [3/4] Creating 93_FULL_SOURCE_DUMP_TESTS.md...`);
const testsContent = convertDirectoryToMarkdown(
  path.join(projectRoot, 'tests'),
  '93. Full Source Dump: tests/ Directory',
  'Firestore Rules unit tests and E2E test code'
);
fs.writeFileSync(path.join(outputDir, '93_FULL_SOURCE_DUMP_TESTS.md'), testsContent, 'utf-8');
console.log(`✅ Created: 93_FULL_SOURCE_DUMP_TESTS.md (${(testsContent.length / 1024 / 1024).toFixed(2)}MB)\n`);

console.log(`🔵 [4/4] Creating 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md...`);
const limitationsContent = `# 99. Known Limitations and v1.2 Hook Points

**Generated**: ${new Date().toISOString()}
**Status**: v1.1 MVP Complete (P0-P6)

---

## ⚠️ Known Limitations

### 1. Firestore Rules Test Failure (μATOM-0606)
**Status**: 1 test failed (7/8 passed)
- Free post author cannot update own post
- PERMISSION_DENIED error at L111
- Fix required in firestore.rules

### 2. Large Bundle Size
- JS chunk: ~1.17 MB
- Recommendation: Code splitting, tree shaking

### 3. Hardcoded Club ID
- Only supports single club (clubId = 'WINGS' or 'default-club')
- Multi-club support needed for v1.2

### 4. In-App Browser Login Blocked
- Google OAuth fails in KakaoTalk, Instagram
- Need alternative auth or WebView workaround

### 5. Timezone Hardcoded
- Vote close time: Asia/Seoul only
- Need timezone customization in v1.2

### 6. FCM Token Handling
- Invalid tokens auto-deleted without retry
- Add retry logic and token refresh

### 7. Post Recording Lock Not Implemented
- recordingLocked field defined in PRD but not implemented
- Implement for game recording close feature

---

## 🎯 v1.2 Hook Points

### Phase A: Data Structure
- [ ] Game recording system
- [ ] Fee/treasury management  
- [ ] Album/photo management

### Phase B: Security & Permissions
- [ ] Multi-club architecture
- [ ] Granular role policies
- [ ] Audit log dashboard

### Phase C: Performance
- [ ] Reduce bundle size
- [ ] Optimize Firestore queries
- [ ] Improve caching

### Phase D: Testing
- [ ] Fix Rules test (μATOM-0606)
- [ ] Expand E2E tests
- [ ] Add integration tests

---

## Pre-Deployment Checklist

- [x] Type check passed
- [x] Build succeeded
- [x] Functions build succeeded
- [ ] All Rules tests passed (1 failed)
- [ ] E2E tests passed
- [ ] Security review completed
- [ ] Performance testing completed

**Last Updated**: 2024-12-19
`;

fs.writeFileSync(path.join(outputDir, '99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md'), limitationsContent, 'utf-8');
console.log(`✅ Created: 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md\n`);

console.log('='.repeat(60));
console.log('✅ All source dump files created successfully!');
console.log('='.repeat(60));
console.log('\nGenerated:\n  [1] 91_FULL_SOURCE_DUMP_SRC.md\n  [2] 92_FULL_SOURCE_DUMP_FUNCTIONS.md\n  [3] 93_FULL_SOURCE_DUMP_TESTS.md\n  [4] 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md\n');
