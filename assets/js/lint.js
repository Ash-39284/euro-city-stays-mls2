#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const mode = process.argv[2];
const root = process.cwd();

if (!["js", "css", "html"].includes(mode)) {
  console.error("Usage: node assets/js/lint.js <js|css|html>");
  process.exit(1);
}

function walk(dir, predicate, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walk(full, predicate, list);
    } else if (predicate(full)) {
      list.push(full);
    }
  }
  return list;
}

function rel(file) {
  return path.relative(root, file);
}

function lintJs() {
  const files = walk(root, (f) => f.endsWith(".js") && !f.includes(`${path.sep}node_modules${path.sep}`));
  const issues = [];

  for (const file of files) {
    const result = cp.spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
      issues.push(`${rel(file)}: syntax check failed`);
      if (result.stderr) issues.push(result.stderr.trim());
    }
  }

  return { files: files.length, issues };
}

function lintCss() {
  const files = walk(path.join(root, "assets", "css"), (f) => f.endsWith(".css"));
  const issues = [];

  for (const file of files) {
    const css = fs.readFileSync(file, "utf8");
    let balance = 0;
    for (const ch of css) {
      if (ch === "{") balance += 1;
      if (ch === "}") balance -= 1;
      if (balance < 0) break;
    }

    if (balance !== 0) issues.push(`${rel(file)}: unbalanced braces`);
  }

  return { files: files.length, issues };
}

function lintHtml() {
  const files = walk(root, (f) => f.endsWith(".html"));
  const issues = [];

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const trimmed = html.trimStart().toLowerCase();

    if (!trimmed.startsWith("<!doctype html>")) {
      issues.push(`${rel(file)}: missing or invalid <!DOCTYPE html>`);
    }

    const checks = [
      ["<html", "</html>"],
      ["<head", "</head>"],
      ["<body", "</body>"],
    ];

    for (const [open, close] of checks) {
      if (!html.toLowerCase().includes(open) || !html.toLowerCase().includes(close)) {
        issues.push(`${rel(file)}: missing ${open}/${close} pair`);
      }
    }
  }

  return { files: files.length, issues };
}

const result = mode === "js" ? lintJs() : mode === "css" ? lintCss() : lintHtml();

if (result.issues.length > 0) {
  console.error(`Lint ${mode} failed with ${result.issues.length} issue(s):`);
  for (const issue of result.issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Lint ${mode} passed for ${result.files} file(s).`);
