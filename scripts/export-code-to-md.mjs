import { promises as fs } from 'fs';
import path from 'path';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'docs', 'code');

const GROUPS = [
  { name: 'root-and-config', title: '루트 & 설정 파일', match: (rel) =>
      ['package.json', 'tsconfig.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html', 'postcss.config.mjs'].includes(rel)
    },
  { name: 'src-app', title: 'src/app – 앱 레이어 전체 코드', match: (rel) => rel.startsWith('src/app/') },
  { name: 'src-lib-firebase', title: 'src/lib/firebase – Firebase 서비스/타입 전체 코드', match: (rel) => rel.startsWith('src/lib/firebase/') },
  { name: 'src-lib-etc', title: 'src/lib 기타', match: (rel) => rel.startsWith('src/lib/') && !rel.startsWith('src/lib/firebase/') },
  { name: 'src-styles', title: 'src/styles – 스타일', match: (rel) => rel.startsWith('src/styles/') },
  { name: 'public', title: 'public – PWA & 정적 자산 관련 코드', match: (rel) => rel.startsWith('public/') },
];

const LANG_MAP = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.mjs': 'js',
  '.jsx': 'jsx',
  '.css': 'css',
  '.html': 'html',
  '.json': 'json',
  '.md': 'md',
};

const INCLUDE_DIRS = ['src', 'public'];
const INCLUDE_ROOT_FILES = [
  'package.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'index.html',
  'postcss.config.mjs',
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function collectFiles() {
  const files = [];

  for (const rel of INCLUDE_ROOT_FILES) {
    const abs = path.join(rootDir, rel);
    try {
      const stat = await fs.stat(abs);
      if (stat.isFile()) {
        files.push(rel);
      }
    } catch {
      // ignore missing
    }
  }

  async function walk(dirRel) {
    const dirAbs = path.join(rootDir, dirRel);
    let entries;
    try {
      entries = await fs.readdir(dirAbs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryRel = path.join(dirRel, entry.name);
      const entryAbs = path.join(dirAbs, entry.name);

      // 스킵할 디렉터리
      if (entry.isDirectory()) {
        if (['node_modules', '.git', '.cursor', 'dist', 'docs'].includes(entry.name)) continue;
        await walk(entryRel);
      } else {
        files.push(entryRel.replace(/\\/g, '/'));
      }
    }
  }

  for (const d of INCLUDE_DIRS) {
    await walk(d);
  }

  return files.sort();
}

function pickGroup(rel) {
  for (const g of GROUPS) {
    if (g.match(rel)) return g.name;
  }
  return 'others';
}

function getTitleForGroup(name) {
  const g = GROUPS.find((g) => g.name === name);
  if (g) return g.title;
  return '기타 파일';
}

function detectLang(rel) {
  const ext = path.extname(rel);
  return LANG_MAP[ext] || '';
}

async function generate() {
  await ensureDir(outDir);

  const relFiles = await collectFiles();

  /** @type {Record<string, {rel: string, content: string}[]>} */
  const grouped = {};

  for (const rel of relFiles) {
    const group = pickGroup(rel);
    if (!grouped[group]) grouped[group] = [];

    const abs = path.join(rootDir, rel);
    const content = await fs.readFile(abs, 'utf8');
    grouped[group].push({ rel, content });
  }

  for (const [groupName, list] of Object.entries(grouped)) {
    const title = getTitleForGroup(groupName);
    const mdParts = [];

    mdParts.push(`# ${title}`);
    mdParts.push('');
    mdParts.push(`> 이 문서는 \`${groupName}\` 그룹에 속한 모든 파일의 실제 코드를 100% 포함합니다.`);
    mdParts.push('');

    for (const { rel, content } of list) {
      const lang = detectLang(rel);
      mdParts.push(`## ${rel}`);
      mdParts.push('');
      mdParts.push('```' + lang);
      mdParts.push(content.replace(/\s+$/gm, ''));
      mdParts.push('```');
      mdParts.push('');
    }

    const outPath = path.join(outDir, `code-${groupName}.md`);
    await fs.writeFile(outPath, mdParts.join('\n'), 'utf8');
    console.log(`Generated ${path.relative(rootDir, outPath)}`);
  }
}

generate().catch((err) => {
  console.error('Error generating code markdown files:', err);
  process.exit(1);
});


