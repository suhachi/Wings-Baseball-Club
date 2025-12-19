import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'docs', 'code');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`🚀 Starting Firebase Code Export...`);
console.log(`📂 Output Directory: ${outputDir}\n`);

const TARGET_FILES = [
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'firestore.indexes.json',
  'storage.rules'
];

const TARGET_DIRS = [
  'src/lib/firebase',
  'functions'
];

const EXCLUDE_DIRS = ['node_modules', '.git', '.firebase', 'lib', 'bin', 'obj']; // functions/node_modules etc.

function collectFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        results = results.concat(collectFiles(fullPath));
      }
    } else {
      results.push(relPath);
    }
  });
  return results;
}

let allFiles = [];

// 1. Add root config files
TARGET_FILES.forEach(file => {
  if (fs.existsSync(path.join(projectRoot, file))) {
    allFiles.push(file);
  }
});

// 2. Add directory contents
TARGET_DIRS.forEach(dir => {
  const fullPath = path.join(projectRoot, dir);
  allFiles = allFiles.concat(collectFiles(fullPath));
});

console.log(`🔍 Found ${allFiles.length} Firebase-related files.`);

// 3. Generate Markdown
let content = `# Firebase Full Code Pack\n\n`;
content += `**Generated**: ${new Date().toISOString()}\n`;
content += `**Scope**: Firebase Configs, Security Rules, Cloud Functions, Frontend SDK Wrappers\n\n`;

allFiles.forEach(file => {
  try {
    const fullPath = path.join(projectRoot, file);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const ext = path.extname(file).substring(1) || 'txt';
    
    content += `## File: ${file}\n`;
    content += `\`\`\`${ext}\n`;
    content += fileContent;
    content += `\n\`\`\`\n\n`;
  } catch (e) {
    console.warn(`⚠️ Failed to read: ${file}`);
  }
});

const outputPath = path.join(outputDir, 'FIREBASE_FULL_PACK.md');
fs.writeFileSync(outputPath, content);

console.log(`✅ Created: FIREBASE_FULL_PACK.md (${(content.length / 1024).toFixed(1)} KB)`);
console.log(`\n🎉 Firebase Export Complete!`);
