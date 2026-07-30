import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [sourceArgument, ...flags] = process.argv.slice(2);
const shouldWrite = flags.includes("--write");
const allowedRootFiles = new Set([
  "README.md",
  "SPEC.md",
  "PROMPT-CARD.md",
  "VERIFY.md",
]);
const allowedSiteExtensions = new Set([
  ".css",
  ".html",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".md",
  ".png",
  ".svg",
  ".webp",
]);
const forbiddenContent = [
  /\/Users\/[A-Za-z0-9._-]+\//,
  /\b[a-z0-9-]+\.ts\.net\b/i,
  /\b100\.(?:6[4-9]|[78]\d|9\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/,
  /\b(?:sk-(?:proj-)?|ghp_|github_pat_|AKIA)[A-Za-z0-9_-]{12,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

if (!sourceArgument) {
  console.error(
    "用法：node scripts/import-public-ready-episode.mjs /path/to/ep02-name [--write]",
  );
  process.exit(1);
}

const source = path.resolve(sourceArgument);
const slug = path.basename(source);
const destination = path.join(root, "episodes", slug);

if (!/^ep\d{2}-[a-z0-9-]+$/.test(slug)) {
  console.error("資料夾名稱必須符合 ep02-topic 這類格式。");
  process.exit(1);
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      throw new Error(`不允許隱藏檔案：${entry.name}`);
    }
    const absolutePath = path.join(directory, entry.name);
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink()) {
      throw new Error(`不允許符號連結：${absolutePath}`);
    }
    if (stat.isDirectory()) {
      files.push(...(await walk(absolutePath)));
    } else if (stat.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function isAllowed(relativePath) {
  const parts = relativePath.split(path.sep);
  if (parts.length === 1) {
    return allowedRootFiles.has(relativePath);
  }
  return parts[0] === "site" && allowedSiteExtensions.has(path.extname(relativePath).toLowerCase());
}

function isTextFile(file) {
  return new Set([".css", ".html", ".js", ".json", ".md", ".svg"]).has(
    path.extname(file).toLowerCase(),
  );
}

try {
  const sourceStat = await fs.stat(source);
  if (!sourceStat.isDirectory()) {
    throw new Error("來源必須是資料夾。");
  }

  const sourceFiles = await walk(source);
  const relativeFiles = sourceFiles.map((file) => path.relative(source, file));
  const rejected = relativeFiles.filter((file) => !isAllowed(file));

  if (rejected.length > 0) {
    throw new Error(`包含不在公開白名單的檔案：\n${rejected.join("\n")}`);
  }

  for (const required of allowedRootFiles) {
    if (!relativeFiles.includes(required)) {
      throw new Error(`缺少必要教材：${required}`);
    }
  }
  if (!relativeFiles.includes(path.join("site", "index.html"))) {
    throw new Error("缺少 site/index.html。");
  }

  for (const absolutePath of sourceFiles) {
    const stat = await fs.stat(absolutePath);
    if (stat.size > 5 * 1024 * 1024) {
      throw new Error(`檔案超過 5 MB：${path.relative(source, absolutePath)}`);
    }
    if (!isTextFile(absolutePath)) {
      continue;
    }
    const content = await fs.readFile(absolutePath, "utf8");
    if (forbiddenContent.some((pattern) => pattern.test(content))) {
      throw new Error(`疑似含有私人資料：${path.relative(source, absolutePath)}`);
    }
  }

  console.log(`公開匯入預檢通過：${slug}`);
  relativeFiles.forEach((file) => console.log(`- ${file}`));

  if (!shouldWrite) {
    console.log("\n目前是預演，沒有寫入。確認後加上 --write。");
    process.exit(0);
  }

  try {
    await fs.access(destination);
    throw new Error(`目的地已存在，為避免覆蓋而停止：${destination}`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await fs.cp(source, destination, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
  console.log(`\n已匯入：episodes/${slug}`);
} catch (error) {
  console.error(`匯入失敗：${error.message}`);
  process.exit(1);
}
