import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const MAIN = join(dirname(fileURLToPath(import.meta.url)), "main.ts");

function run(dir: string): string {
  execFileSync(process.execPath, [MAIN, dir]);
  return readFileSync(join(dir, "entry.txt"), "utf8");
}

function tempDir(t: { after: (fn: () => void) => void }): string {
  const dir = mkdtempSync(join(tmpdir(), "dad-joke-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("writes entry.txt inside the given directory", (t) => {
  const dir = tempDir(t);
  execFileSync(process.execPath, [MAIN, dir]);
  const out = join(dir, "entry.txt");
  assert.ok(existsSync(out), "expected entry.txt in the output directory");
  assert.equal(readFileSync(out, "utf8").length > 0, true);
});

test("output is deterministic across runs and directories", (t) => {
  const a = run(tempDir(t));
  const b = run(tempDir(t));
  assert.equal(b, a);
});

test("output is exactly one line with no newline characters", (t) => {
  const text = run(tempDir(t));
  assert.ok(!/[\r\n]/.test(text), `expected a single line, got ${JSON.stringify(text)}`);
});

test("output is at most 200 Unicode characters", (t) => {
  const text = run(tempDir(t));
  assert.ok([...text].length <= 200, `entry is ${[...text].length} characters`);
});
