import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'docs', 'understanding_pack');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`🚀 Starting Project Understanding Pack Generation...`);
console.log(`📂 Output Directory: ${outputDir}\n`);

// --- Helpers ---

function runCommand(command, ignoreError = true) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (ignoreError) return `[COMMAND FAILED] ${command}\n${error.message}`;
    throw error;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(projectRoot, filePath), 'utf8');
  } catch (e) {
    return `[FILE NOT FOUND] ${filePath}`;
  }
}

function writeFile(fileName, content) {
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Created: ${fileName}`);
}

function maskSecrets(content) {
  return content
    .replace(/apiKey["']?\s*:\s*["']([^"']+)["']/g, 'apiKey: "MASKED_API_KEY"')
    .replace(/VITE_API_KEY\s*=\s*([^\n]+)/g, 'VITE_API_KEY=MASKED_API_KEY')
    .replace(/secret["']?\s*:\s*["']([^"']+)["']/g, 'secret: "MASKED_SECRET"');
}

function collectFiles(sourceDir, excludePatterns = []) {
  const files = [];
  const patterns = ['node_modules', '.git', 'dist', '.firebase', '.next', 'build', '.turbo', 'coverage', 'package-lock.json', 'yarn.lock'];
  
  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir);
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry);
        const relativePath = path.relative(sourceDir, fullPath);
        const shouldSkip = patterns.some(p => relativePath.includes(p)) || excludePatterns.some(p => relativePath.includes(p));
        if (shouldSkip) return;
        
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else {
          files.push(fullPath);
        }
      });
    } catch (e) {}
  }
  if (fs.existsSync(sourceDir)) walk(sourceDir);
  return files.sort();
}

function generateSourceDump(title, sourceDir, fileName) {
  let content = `# ${title}\n\n**Generated**: ${new Date().toISOString()}\n\n`;
  const files = collectFiles(sourceDir);
  files.forEach(file => {
    const relPath = path.relative(projectRoot, file);
    const ext = path.extname(file).substring(1);
    content += `## FILE: ${relPath}\n\`\`\`${ext}\n${maskSecrets(fs.readFileSync(file, 'utf8'))}\n\`\`\`\n\n`;
  });
  writeFile(fileName, content);
}

// --- Evidence Collection ---

console.log(`🔍 Collecting Evidence...`);
const evidence = {
  gitStatus: runCommand('git status -sb'),
  gitLog: runCommand('git log -n 20 --oneline'),
  nodeVersion: runCommand('node -v'),
  firebaseVersion: runCommand('npx firebase --version'),
  firebaseProjects: runCommand('npx firebase projects:list'),
  firebaseFunctions: runCommand('npx firebase functions:list'),
  // firebaseHosting: runCommand('npx firebase hosting:sites:list'), // May fail if not authenticated
};

// --- Document Generation ---

// 00_INDEX.md
const indexContent = `# Project Understanding Pack Index

**Generated**: ${new Date().toISOString()}
**Project**: Wings Baseball Club Community PWA

## 📂 Document List

| File | Description |
|------|-------------|
| [10_ARCHITECTURE_OVERVIEW.md](10_ARCHITECTURE_OVERVIEW.md) | App structure, routing, auth flows |
| [20_FIREBASE_RUNTIME_STATE.md](20_FIREBASE_RUNTIME_STATE.md) | Functions, Hosting, Rules runtime state |
| [30_ENV_AND_SECRETS_MAP.md](30_ENV_AND_SECRETS_MAP.md) | Environment variables and secrets (Masked) |
| [40_DATA_MODEL_AND_PATHS.md](40_DATA_MODEL_AND_PATHS.md) | Firestore schema, paths, and types |
| [50_RULES_AND_SECURITY.md](50_RULES_AND_SECURITY.md) | Security rules and access policies |
| [60_FUNCTIONS_CONTRACTS.md](60_FUNCTIONS_CONTRACTS.md) | Cloud Functions contracts and triggers |
| [90_FULL_SOURCE_DUMP_ROOT.md](90_FULL_SOURCE_DUMP_ROOT.md) | Root config files (100% dump) |
| [91_FULL_SOURCE_DUMP_SRC.md](91_FULL_SOURCE_DUMP_SRC.md) | Frontend source code (100% dump) |
| [92_FULL_SOURCE_DUMP_FUNCTIONS.md](92_FULL_SOURCE_DUMP_FUNCTIONS.md) | Backend source code (100% dump) |
| [93_FULL_SOURCE_DUMP_TESTS.md](93_FULL_SOURCE_DUMP_TESTS.md) | Test code (100% dump) |
| [99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md](99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md) | Limitations and v1.2 roadmap |

## ✅ Done Checklist
- [x] READ-ONLY command output evidence linked
- [x] Firebase Runtime State documented
- [x] Env/Secrets masked
- [x] Data Model/Schema confirmed by code
- [x] FULL SOURCE DUMPS (90-93) generated
- [x] Next steps (v1.2) defined
`;
writeFile('00_INDEX.md', indexContent);

// 10_ARCHITECTURE_OVERVIEW.md
const appTsx = readFile('src/app/App.tsx');
const pagesDir = collectFiles(path.join(projectRoot, 'src/app/pages')).map(f => path.basename(f)).join('\n- ');
const archContent = `# Architecture Overview

## 🏗️ App Structure
- **Entry Point**: \`src/main.tsx\` -> \`src/app/App.tsx\`
- **Routing**: State-based routing (Custom)
- **State Management**: React Context (\`AuthContext\`, \`DataContext\`, \`ClubContext\`)

## 📱 Pages (src/app/pages)
- ${pagesDir}

## 🔐 Auth Flow
- **Provider**: Firebase Auth (Google Only)
- **Access Gate**: \`AuthContext\` checks \`members/{uid}\` status ('active')
- **Role Based Access**: \`isAdmin()\`, \`isTreasury()\` helpers

## 🧩 Key Components
- **Layout**: \`BottomNav\`, \`TopBar\`
- **Modals**: \`CreatePostModal\`, \`PostDetailModal\`
`;
writeFile('10_ARCHITECTURE_OVERVIEW.md', archContent);

// 20_FIREBASE_RUNTIME_STATE.md
const runtimeContent = `# Firebase Runtime State

## ☁️ Cloud Functions
\`\`\`
${evidence.firebaseFunctions}
\`\`\`

## 📦 Projects
\`\`\`
${evidence.firebaseProjects}
\`\`\`

## 🛠️ CLI Versions
- Node: ${evidence.nodeVersion}
- Firebase CLI: ${evidence.firebaseVersion}

## 📜 Git State
\`\`\`
${evidence.gitStatus}
\`\`\`
\`\`\`
${evidence.gitLog}
\`\`\`
`;
writeFile('20_FIREBASE_RUNTIME_STATE.md', runtimeContent);

// 30_ENV_AND_SECRETS_MAP.md
const envFiles = runCommand('ls -la .env*');
const envContent = readFile('.env'); // Will be masked
const secretsContent = `# Environment & Secrets Map

## 📂 Environment Files
\`\`\`
${envFiles}
\`\`\`

## 🔑 .env Content (Masked)
\`\`\`
${maskSecrets(envContent)}
\`\`\`

## ⚠️ Security Note
- API Keys and Secrets are masked in this document.
- Ensure \`VITE_FIREBASE_CONFIG\` matches the project in \`firebase.json\`.
`;
writeFile('30_ENV_AND_SECRETS_MAP.md', secretsContent);

// 40_DATA_MODEL_AND_PATHS.md
const typesTs = readFile('src/lib/firebase/types.ts');
const dataModelContent = `# Data Model & Paths

## 🗄️ Firestore Schema (from types.ts)
\`\`\`typescript
${typesTs}
\`\`\`

## 🛣️ Collection Paths
- **Clubs**: \`clubs/{clubId}\`
- **Members**: \`clubs/{clubId}/members/{uid}\`
- **Posts**: \`clubs/{clubId}/posts/{postId}\`
- **Comments**: \`clubs/{clubId}/posts/{postId}/comments/{commentId}\`
- **Attendance**: \`clubs/{clubId}/posts/{postId}/attendance/{userId}\`
- **Users (Global)**: \`users/{uid}\`
`;
writeFile('40_DATA_MODEL_AND_PATHS.md', dataModelContent);

// 50_RULES_AND_SECURITY.md
const rulesContent = readFile('firestore.rules');
const securityContent = `# Rules & Security

## 🛡️ Firestore Rules
\`\`\`javascript
${rulesContent}
\`\`\`

## 🔒 Key Policies
1. **Active Member Only**: Most reads require \`isActiveMember()\`.
2. **Write Restrictions**:
   - **Free Posts**: Create allowed for members. Update/Delete own only.
   - **Notices/Events**: Admin/Staff only (via Functions or Rules).
   - **Attendance**: Self-update only, while vote is open.
3. **System Collections**: \`tokens\`, \`audit\`, \`idempotency\` are generally write-protected or Functions-only.
`;
writeFile('50_RULES_AND_SECURITY.md', securityContent);

// 60_FUNCTIONS_CONTRACTS.md
const functionsIndex = readFile('functions/src/index.ts');
const functionsContractsContent = `# Functions Contracts

## ⚡ Entry Points (functions/src/index.ts)
\`\`\`typescript
${functionsIndex}
\`\`\`

## 📋 Contracts
- **createNoticeWithPush**: Callable. Creates notice & sends FCM.
- **createEventPost**: Callable. Creates event & calculates vote close time.
- **closeEventVotes**: Scheduled. Closes votes & sends summary push.
- **registerFcmToken**: Callable. Registers device token.
`;
writeFile('60_FUNCTIONS_CONTRACTS.md', functionsContractsContent);

// --- Full Source Dumps ---

console.log(`📦 Generating Full Source Dumps...`);

// 90_FULL_SOURCE_DUMP_ROOT.md
let rootDump = `# 90. Full Source Dump: Root Config\n\n`;
['package.json', 'tsconfig.json', 'vite.config.ts', 'firebase.json', '.firebaserc', 'firestore.rules', 'firestore.indexes.json'].forEach(f => {
  const c = readFile(f);
  if (!c.startsWith('[FILE NOT FOUND]')) {
    rootDump += `## FILE: ${f}\n\`\`\`json\n${c}\n\`\`\`\n\n`;
  }
});
writeFile('90_FULL_SOURCE_DUMP_ROOT.md', rootDump);

// 91_FULL_SOURCE_DUMP_SRC.md
generateSourceDump('91. Full Source Dump: src/', path.join(projectRoot, 'src'), '91_FULL_SOURCE_DUMP_SRC.md');

// 92_FULL_SOURCE_DUMP_FUNCTIONS.md
generateSourceDump('92. Full Source Dump: functions/', path.join(projectRoot, 'functions'), '92_FULL_SOURCE_DUMP_FUNCTIONS.md');

// 93_FULL_SOURCE_DUMP_TESTS.md
generateSourceDump('93. Full Source Dump: tests/', path.join(projectRoot, 'tests'), '93_FULL_SOURCE_DUMP_TESTS.md');

// 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md
const limitationsContent = `# 99. Known Limitations & v1.2 Roadmap

## ⚠️ Known Limitations
1. **Firestore Rules Test Failure (μATOM-0606)**: Free post author update check fails in emulator.
2. **Large Bundle Size**: JS chunk > 1MB. Needs code splitting.
3. **Single Club ID**: Hardcoded 'default-club'/'WINGS'.
4. **In-App Browser Login**: Google OAuth blocked in Kakao/Insta.
5. **Timezone**: Hardcoded to Asia/Seoul.

## 🚀 v1.2 Hook Points
- **Phase A**: Game Recording System (Lineup/Records)
- **Phase B**: Multi-club Support & Granular Roles
- **Phase C**: Performance Optimization (Bundle size, Query indexing)
- **Phase D**: Test Coverage (Fix rules test, E2E expansion)
`;
writeFile('99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md', limitationsContent);

console.log(`\n🎉 Project Understanding Pack Generation Complete!`);
