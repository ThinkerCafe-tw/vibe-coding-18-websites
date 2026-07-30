import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [slug, rawVersion] = process.argv.slice(2);

if (!slug || !rawVersion || !/^ep\d{2}-[a-z0-9-]+$/.test(slug)) {
  console.error("用法：node scripts/package-episode.mjs ep01-cafe v1.0.0");
  process.exit(1);
}

const version = rawVersion.replace(/^v/, "");
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("版本格式必須是 v1.0.0 或 1.0.0。");
  process.exit(1);
}

const source = path.join(root, "episodes", slug);
const outputDirectory = path.join(root, "dist");
const output = path.join(outputDirectory, `${slug}-v${version}.zip`);
const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "vibe-course-"));

try {
  await fs.access(source);
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.rm(output, { force: true });
  await fs.cp(source, path.join(temporaryRoot, slug), { recursive: true });

  const result = spawnSync("zip", ["-q", "-r", output, slug], {
    cwd: temporaryRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "zip 指令執行失敗。");
  }

  const stat = await fs.stat(output);
  console.log(
    `已建立 ${path.relative(root, output)}（${Math.round(stat.size / 1024)} KB）`,
  );
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}
