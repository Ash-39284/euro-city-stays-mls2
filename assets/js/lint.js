#!/usr/bin/env node

 
// This script checks your code for basic errors.
// You run it from the command line like this:
//   node assets/js/lint.js js     (checks all JavaScript files)
//   node assets/js/lint.js css    (checks all CSS files)
//   node assets/js/lint.js html   (checks all HTML files)
 
const fs = require("fs");       // fs lets us read files and folders
const path = require("path");   // path helps us build file paths that work on any operating system
const cp = require("child_process"); // child_process lets us run other command-line programs from inside Node
 
// process.argv is an array of the words typed into the terminal.
// Index 0 is "node", index 1 is the script name, so index 2 is our argument (js, css, or html)
const mode = process.argv[2];
 
// process.cwd() gives us the folder the script was run from (usually the project root)
const root = process.cwd();
 
// If the user didn't type js, css, or html, show them the correct usage and stop
if (!["js", "css", "html"].includes(mode)) {
  console.error("Usage: node assets/js/lint.js <js|css|html>");
  process.exit(1); // Exit with code 1 to signal something went wrong
}
 
// Searches a folder and all its sub-folders for files that match a condition.
// - dir: the folder to start searching in
// - predicate: a function that returns true if we want to include a file
// - list: the running list of matched files (starts empty)
function walk(dir, predicate, list = []) {
  // readdirSync reads the contents of a folder all at once
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name); // Build the full path to this item
 
    if (entry.isDirectory()) {
      // Skip node_modules and .git - they're not our code and would slow things down a lot
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walk(full, predicate, list); // It's a folder, so search inside it too (recursion)
    } else if (predicate(full)) {
      list.push(full); // It's a file that matches our condition, so add it to the list
    }
  }
  return list;
}
 
// Converts an absolute file path into a shorter relative path from the project root.
// For example: /Users/alice/project/assets/js/main.js becomes assets/js/main.js
// This makes error messages easier to read.
function rel(file) {
  return path.relative(root, file);
}
 
// Checks all JavaScript files for syntax errors.
// It uses Node itself to check each file with the --check flag,
// which reads the file without running it and reports any syntax problems.
function lintJs() {
  // Find every .js file in the project, ignoring anything inside node_modules
  const files = walk(root, (f) => f.endsWith(".js") && !f.includes(`${path.sep}node_modules${path.sep}`));
  const issues = [];
 
  for (const file of files) {
    // spawnSync runs a command and waits for it to finish before moving on.
    // Here we're running: node --check <filename>
    // process.execPath is the path to the current Node.js executable
    const result = cp.spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
 
    // A status of 0 means success. Anything else means something went wrong.
    if (result.status !== 0) {
      issues.push(`${rel(file)}: syntax check failed`);
      if (result.stderr) issues.push(result.stderr.trim()); // Include Node's error message if there is one
    }
  }
 
  return { files: files.length, issues };
}
 
// Checks all CSS files to make sure every opening { has a matching closing }
function lintCss() {
  // Only look inside the assets/css folder
  const files = walk(path.join(root, "assets", "css"), (f) => f.endsWith(".css"));
  const issues = [];
 
  for (const file of files) {
    const css = fs.readFileSync(file, "utf8"); // Read the whole file as a string
 
    // Count the braces to check they're balanced.
    // balance goes up by 1 for every { and down by 1 for every }
    // If it ever goes below 0, we have a } without a matching {
    let balance = 0;
    for (const ch of css) {
      if (ch === "{") balance += 1;
      if (ch === "}") balance -= 1;
      if (balance < 0) break; // No point continuing - we already know it's broken
    }
 
    // If balance isn't 0 at the end, the braces don't match up
    if (balance !== 0) issues.push(`${rel(file)}: unbalanced braces`);
  }
 
  return { files: files.length, issues };
}
 
// Checks all HTML files for some basic structural requirements
function lintHtml() {
  // Find every .html file in the project
  const files = walk(root, (f) => f.endsWith(".html"));
  const issues = [];
 
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
 
    // trimStart() removes any whitespace at the beginning of the file before we check it.
    // We use toLowerCase() so the check works whether it's written as <!DOCTYPE html>,
    // <!doctype html>, or any other mix of upper and lower case.
    const trimmed = html.trimStart().toLowerCase();
 
    // Every HTML file should start with this declaration
    if (!trimmed.startsWith("<!doctype html>")) {
      issues.push(`${rel(file)}: missing or invalid <!DOCTYPE html>`);
    }
 
    // These are the three tag pairs that every valid HTML file must have
    const checks = [
      ["<html", "</html>"],
      ["<head", "</head>"],
      ["<body", "</body>"],
    ];
 
    // Check that both the opening and closing tag exist for each pair
    for (const [open, close] of checks) {
      if (!html.toLowerCase().includes(open) || !html.toLowerCase().includes(close)) {
        issues.push(`${rel(file)}: missing ${open}/${close} pair`);
      }
    }
  }
 
  return { files: files.length, issues };
}
 
// Run the right lint function based on which mode was passed in (js, css, or html)
const result = mode === "js" ? lintJs() : mode === "css" ? lintCss() : lintHtml();
 
// If there were any issues, print them all out and exit with an error code
if (result.issues.length > 0) {
  console.error(`Lint ${mode} failed with ${result.issues.length} issue(s):`);
  for (const issue of result.issues) console.error(`- ${issue}`);
  process.exit(1); // Exit with code 1 so CI tools and scripts know the lint check failed
}
 
// If we made it here, everything passed
console.log(`Lint ${mode} passed for ${result.files} file(s).`);