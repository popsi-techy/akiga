const fs = require("fs");
const path = require("path");

const outPath = "C:/Users/aman.kumar/Desktop/akiga/tmp-due-extract.txt";
const pagePath =
  "C:/Users/aman.kumar/Desktop/akiga/apps/design-system/.next/static/chunks/app/iga/reviewer/sod-resolution-v3/[id]/page.js";
const hotDir =
  "C:/Users/aman.kumar/Desktop/akiga/apps/design-system/.next/static/webpack/app/iga/reviewer/sod-resolution-v3/[id]";

function findAll(hay, needle) {
  const idxs = [];
  let i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) {
    idxs.push(i);
    i += needle.length;
  }
  return idxs;
}

function extractBraceFn(src, startIdx) {
  const brace = src.indexOf("{", startIdx);
  if (brace < 0) return src.slice(startIdx, startIdx + 3000);
  let depth = 0;
  let inStr = null;
  let esc = false;
  for (let j = brace; j < src.length && j < brace + 30000; j++) {
    const ch = src[j];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(startIdx, j + 1);
    }
  }
  return src.slice(startIdx, startIdx + 5000);
}

function tryBeautify(code) {
  try {
    const prettier = require("prettier");
    return prettier.format(code, { parser: "babel", printWidth: 100 });
  } catch (_) {
    return code
      .replace(/;\s*/g, ";\n")
      .replace(/\{\s*/g, "{\n")
      .replace(/\s*\}/g, "\n}\n");
  }
}

const files = [
  pagePath,
  ...fs
    .readdirSync(hotDir)
    .filter((f) => f.endsWith(".js"))
    .map((f) => path.join(hotDir, f)),
];

const out = [];
out.push("DueCountdown bundle extraction report");
out.push("Generated: " + new Date().toISOString());
out.push("");

for (const file of files) {
  const c = fs.readFileSync(file, "utf8");
  out.push("=".repeat(80));
  out.push("FILE: " + file);
  out.push("SIZE: " + c.length);
  const needles = [
    "DueCountdown",
    "days left",
    "Days left",
    " day left",
    " days left",
    "Overdue",
    "formatDateTime",
    "InfoOutlined",
    "Tooltip",
    "dueDate",
  ];
  for (const n of needles) {
    const idxs = findAll(c, n);
    if (idxs.length)
      out.push(
        "  " +
          JSON.stringify(n) +
          ": " +
          idxs.length +
          " @ " +
          idxs.slice(0, 8).join(", ")
      );
  }

  const patterns = [
    /function\s+DueCountdown\s*\([^)]*\)\s*\{/,
    /(?:const|let|var)\s+DueCountdown\s*=/,
    /DueCountdown\s*=\s*function\s*\(/,
  ];
  for (const p of patterns) {
    const m = c.match(p);
    if (m) {
      out.push("*** FOUND DEF: " + m[0]);
      const body = extractBraceFn(c, m.index);
      out.push("--- RAW ---");
      out.push(body);
      out.push("--- BEAUTIFIED ---");
      out.push(tryBeautify(body));
    }
  }
}

out.push("\n" + "=".repeat(80));
out.push("ALL DueCountdown CONTEXTS (~3000 chars each)");
for (const file of files) {
  const c = fs.readFileSync(file, "utf8");
  for (const idx of findAll(c, "DueCountdown")) {
    out.push("\n--- " + path.basename(file) + " @" + idx + " ---");
    out.push(c.slice(Math.max(0, idx - 1500), Math.min(c.length, idx + 1500)));
  }
}

const page = fs.readFileSync(pagePath, "utf8");

// Labels near DueCountdown usage in page module band
out.push("\n\nLABEL HITS in page module band (3938000-4100000)");
for (const lab of [
  '"Due"',
  "'Due'",
  " days",
  '"day"',
  '"Days"',
  "Day left",
  "days remaining",
  "Days remaining",
  "hours left",
  " left",
]) {
  for (const i of findAll(page, lab)) {
    if (i > 3938000 && i < 4100000) {
      out.push("\nLABEL " + lab + " @" + i + ":");
      out.push(page.slice(i - 180, i + 180));
    }
  }
}

// Functions named in the page webpack module
const modStart = page.lastIndexOf("/***/", 3960233);
let modEnd = page.indexOf("\n/***/", 3960233 + 10);
if (modEnd < 0) modEnd = Math.min(page.length, modStart + 500000);
const mod = page.slice(modStart, modEnd);
out.push("\n\nPAGE MODULE funcs:");
const fnRe = /function\s+([A-Za-z0-9_$]+)\s*\(/g;
let m;
const fns = [];
while ((m = fnRe.exec(mod))) fns.push(m[1] + "@" + (modStart + m.index));
out.push(fns.join(", "));
out.push("DueCountdown count in module: " + findAll(mod, "DueCountdown").length);
out.push("NOTE: DueCountdown is referenced but NOT defined in this module.");

// formatDate / formatDateTime
for (const name of ["function formatDateTime", "function formatDate("]) {
  const idx = page.indexOf(name);
  if (idx >= 0) {
    out.push("\n\n=== " + name + " ===");
    const body = extractBraceFn(page, idx);
    out.push(body);
    out.push("--- BEAUTIFIED ---");
    out.push(tryBeautify(body));
  }
}

// InfoOutlined contexts mentioning due/Tooltip
out.push("\n\n=== InfoOutlined contexts with due/Tooltip/left ===");
for (const i of findAll(page, "InfoOutlined")) {
  const snip = page.slice(Math.max(0, i - 600), Math.min(page.length, i + 900));
  if (/due|Due|Tooltip|countdown|Countdown|left/i.test(snip)) {
    out.push("\n--- InfoOutlined @" + i + " ---");
    out.push(snip);
  }
}

// Tooltip contexts
out.push("\n\n=== Tooltip string contexts (first 3) ===");
for (const i of findAll(page, "Tooltip").slice(0, 3)) {
  out.push("\n--- Tooltip @" + i + " ---");
  out.push(page.slice(Math.max(0, i - 400), Math.min(page.length, i + 600)));
}

// Repo search excluding node_modules/.next
function walk(dir, acc = []) {
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", ".git", ".next", "cache", "dist"].includes(e.name))
        continue;
      walk(p, acc);
    } else acc.push(p);
  }
  return acc;
}
const widerHits = [];
for (const f of walk("C:/Users/aman.kumar/Desktop/akiga")) {
  if (!/\.(tsx?|jsx?)$/.test(f)) continue;
  try {
    const t = fs.readFileSync(f, "utf8");
    if (t.includes("DueCountdown")) widerHits.push(f);
  } catch {}
}
out.push("\n\n=== REPO TS/JS with DueCountdown (excl node_modules/.next) ===");
out.push(widerHits.length ? widerHits.join("\n") : "(none)");

// Also dump related accept-days UI near applyAccept for completeness
const daysIdx = page.indexOf("applyAccept = (scope, ruleIds, justification, days)");
if (daysIdx >= 0) {
  out.push("\n\n=== applyAccept days-related (not DueCountdown) @ " + daysIdx + " ===");
  out.push(page.slice(daysIdx, daysIdx + 800));
}

fs.writeFileSync(outPath, out.join("\n"), "utf8");
console.log("Wrote", outPath, "bytes", Buffer.byteLength(out.join("\n")));
console.log("Wider hits:", widerHits);
console.log("Fns:", fns.slice(0, 30));
