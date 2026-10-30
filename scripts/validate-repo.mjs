import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateMaterials } from './validate-materials.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const ignoredDirectories = new Set([".git", "dist", "node_modules", "tmp"]);
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".txt",
  ".yml",
  ".yaml",
]);
const requiredTopLevel = [
  "README.md",
  "LICENSE",
  "LICENSE-CONTENT",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "index.html",
  "styles.css",
  "app.js",
  "episodes/manifest.json",
  "assets/ep01-preview.png",
];
const requiredEpisodeFiles = [
  "README.md",
  "SPEC.md",
  "PROMPT-CARD.md",
  "VERIFY.md",
  "site/index.html",
];
const sensitivePatterns = [
  {
    label: "本機使用者路徑",
    pattern: /\/Users\/[A-Za-z0-9._-]+\//,
  },
  {
    label: "Tailscale 網域",
    pattern: /\b[a-z0-9-]+\.ts\.net\b/i,
  },
  {
    label: "Tailscale IP",
    pattern: /\b100\.(?:6[4-9]|[78]\d|9\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/,
  },
  {
    label: "疑似 API 金鑰",
    pattern: /\b(?:sk-(?:proj-)?|ghp_|github_pat_|AKIA)[A-Za-z0-9_-]{12,}\b/,
  },
  {
    label: "私密金鑰",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
];

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function report(message) {
  errors.push(message);
}

async function validateRequiredFiles() {
  for (const relativePath of requiredTopLevel) {
    if (!(await exists(relativePath))) {
      report(`缺少必要檔案：${relativePath}`);
    }
  }
}

async function validateManifest() {
  const manifestPath = path.join(root, "episodes/manifest.json");
  let episodes;

  try {
    episodes = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch (error) {
    report(`課程索引無法解析：${error.message}`);
    return;
  }

  if (!Array.isArray(episodes) || episodes.length !== 18) {
    report("episodes/manifest.json 必須恰好包含 18 集。");
    return;
  }

  const validStates = new Set(["published", "prepared", "preparing", "planned"]);
  const numbers = new Set();
  const slugs = new Set();

  for (const [index, episode] of episodes.entries()) {
    const expectedNumber = String(index + 1).padStart(2, "0");
    if (episode.number !== expectedNumber) {
      report(`第 ${index + 1} 筆課程編號應為 ${expectedNumber}。`);
    }
    if (numbers.has(episode.number)) {
      report(`課程編號重複：${episode.number}`);
    }
    numbers.add(episode.number);

    if (!episode.title || !episode.description || !validStates.has(episode.state)) {
      report(`EP${expectedNumber} 缺少標題、說明或有效狀態。`);
    }

    if (episode.state !== "published" && episode.state !== "prepared") {
      continue;
    }

    if (!episode.slug || slugs.has(episode.slug)) {
      report(`EP${expectedNumber} 的公開 slug 缺少或重複。`);
      continue;
    }
    slugs.add(episode.slug);

    for (const file of requiredEpisodeFiles) {
      const relativePath = path.join("episodes", episode.slug, file);
      if (!(await exists(relativePath))) {
        report(`EP${expectedNumber} 缺少：${relativePath}`);
      }
    }

    if (!episode.image || !(await exists(episode.image))) {
      report(`EP${expectedNumber} 的首頁預覽圖不存在：${episode.image || "未設定"}`);
    }
    if (episode.state === "prepared") {
      // Prepared packages must work locally; never advertise a release that does not exist.
      if (!/^downloads\/ep\d{2}-[a-z0-9-]+\.zip$/.test(episode.downloadUrl || "")
          || !(await exists(episode.downloadUrl))) {
        report(`EP${expectedNumber} 缺少本機原始碼下載檔。`);
      }
      if (!(await exists(path.join("episodes", episode.slug, "index.html")))) {
        report(`EP${expectedNumber} 缺少可閱讀的教學入口。`);
      }
    } else if (!episode.downloadUrl?.startsWith("https://github.com/")) {
      report(`EP${expectedNumber} 缺少 GitHub Release 下載連結。`);
    }

    const sitePath = path.join(root, "episodes", episode.slug, "site", "index.html");
    try {
      const html = await fs.readFile(sitePath, "utf8");
      if (!html.includes('name="viewport"')) {
        report(`EP${expectedNumber} 網站缺少 viewport 設定。`);
      }
      if (!html.includes("課程示意")) {
        report(`EP${expectedNumber} 網站未清楚標示為課程示意。`);
      }
    } catch {
      // Missing files are already reported above.
    }
  }
}

function isExternalTarget(target) {
  return /^(?:[a-z]+:|#|\/\/)/i.test(target);
}

async function validateHtmlLinks(files, missingReferences) {
  for (const absolutePath of files.filter((file) => file.endsWith(".html"))) {
    const html = await fs.readFile(absolutePath, "utf8");
    const attributePattern = /\b(?:href|src)=["']([^"']+)["']/g;

    for (const match of html.matchAll(attributePattern)) {
      const target = match[1].split(/[?#]/, 1)[0];
      if (!target || isExternalTarget(target)) {
        continue;
      }

      const resolved = target.startsWith("/")
        ? path.join(root, target)
        : path.resolve(path.dirname(absolutePath), target);
      const candidate = target.endsWith("/") ? path.join(resolved, "index.html") : resolved;

      if (!candidate.startsWith(root) || !(await fileExists(candidate))) {
        // Historical video HTML is preserved byte-for-byte. Only an explicitly
        // disclosed, absent image with its original remove-on-error behavior is exempt.
        if (missingReferences.get(absolutePath)?.has(target)
            && /<img\b[^>]*onerror=["']this\.remove\(\)["'][^>]*>/i.test(html)) {
          console.log(`已揭露原始素材缺件：${path.relative(root, absolutePath)} → ${target}`);
          continue;
        }
        const relativeFile = path.relative(root, absolutePath);
        report(`${relativeFile} 指向不存在的本地檔案：${target}`);
      }
    }
  }
}

async function fileExists(absolutePath) {
  try {
    const stat = await fs.stat(absolutePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function validatePublicSafety(files) {
  for (const absolutePath of files) {
    const relativePath = path.relative(root, absolutePath);
    const stat = await fs.stat(absolutePath);

    if (stat.size > 5 * 1024 * 1024) {
      report(`檔案超過 5 MB，請確認是否適合公開：${relativePath}`);
    }

    const extension = path.extname(absolutePath).toLowerCase();
    const isKnownText =
      textExtensions.has(extension)
      || [".gitattributes", ".gitignore", ".nojekyll", "LICENSE"].includes(
        path.basename(absolutePath),
      );
    if (!isKnownText || stat.size > 2 * 1024 * 1024) {
      continue;
    }

    const content = await fs.readFile(absolutePath, "utf8");
    for (const { label, pattern } of sensitivePatterns) {
      if (pattern.test(content)) {
        report(`${relativePath} 含有${label}，請人工確認。`);
      }
    }
  }
}

await validateRequiredFiles();
await validateManifest();
const missingReferences = await validateMaterials(root, report);
const files = await walk(root);
await validateHtmlLinks(files, missingReferences);
await validatePublicSafety(files);

if (errors.length > 0) {
  console.error(`公開檢查失敗，共 ${errors.length} 項：`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`公開檢查通過：18 集索引與 ${files.length} 個檔案均符合規則。`);
}
