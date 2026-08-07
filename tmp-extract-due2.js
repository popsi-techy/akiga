const fs = require("fs");
const path = require("path");

const outPath = "C:/Users/aman.kumar/Desktop/akiga/tmp-due-extract.txt";
const srcPath =
  "C:/Users/aman.kumar/Desktop/akiga/apps/design-system/src/app/iga/reviewer/sod-resolution-v3/[id]/page.tsx";
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
  // include any leading comments on previous lines
  let start = startIdx;
  const lineStart = src.lastIndexOf("\n", startIdx) + 1;
  // walk back over comment lines
  let probe = lineStart;
  while (probe > 0) {
    const prevNl = src.lastIndexOf("\n", probe - 2);
    const prevLine = src.slice(prevNl + 1, probe).trim();
    if (prevLine.startsWith("//") || prevLine.startsWith("/*") || prevLine.startsWith("*") || prevLine === "") {
      start = prevNl + 1;
      probe = prevNl + 1;
      if (prevLine === "" && src.slice(Math.max(0, prevNl - 80), prevNl).includes("function ")) break;
      continue;
    }
    break;
  }

  const brace = src.indexOf("{", startIdx);
  let depth = 0;
  let inStr = null;
  let esc = false;
  for (let j = brace; j < src.length; j++) {
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
      if (depth === 0) return src.slice(start, j + 1);
    }
  }
  return src.slice(start, start + 5000);
}

const src = fs.readFileSync(srcPath, "utf8");
const page = fs.readFileSync(pagePath, "utf8");
const out = [];

out.push("DueCountdown extraction");
out.push("Source: " + srcPath);
out.push("Bundle: " + pagePath);
out.push("Generated: " + new Date().toISOString());
out.push("");

// Source analysis
out.push("=".repeat(80));
out.push("SOURCE page.tsx DueCountdown occurrences: " + findAll(src, "DueCountdown").length);
const srcFn = src.search(/function\s+DueCountdown\b/);
const srcConst = src.search(/(?:const|let|var)\s+DueCountdown\s*=/);
out.push("function DueCountdown at: " + srcFn);
out.push("const DueCountdown at: " + srcConst);

let componentCode = null;
if (srcFn >= 0) {
  componentCode = extractBraceFn(src, srcFn);
} else if (srcConst >= 0) {
  componentCode = extractBraceFn(src, srcConst);
}

// Also grab nearby helpers in source (formatDateTime import, etc.)
const lines = src.split(/\r?\n/);
const dueLines = [];
lines.forEach((line, i) => {
  if (/DueCountdown|days left|Days left|Overdue|formatDateTime|InfoOutlined|Tooltip/.test(line)) {
    dueLines.push("L" + (i + 1) + ": " + line);
  }
});
out.push("\nRelated lines in source:");
out.push(dueLines.join("\n"));

if (componentCode) {
  out.push("\n" + "=".repeat(80));
  out.push("FULL DueCountdown FROM SOURCE (authoritative for implementation)");
  out.push(componentCode);
}

// Bundle: only usage?
out.push("\n" + "=".repeat(80));
out.push("BUNDLE analysis");
out.push("DueCountdown hits in page.js: " + findAll(page, "DueCountdown").length);
out.push("function DueCountdown in page.js: " + /function\s+DueCountdown\b/.test(page));

// Search if SWC renamed it - look for unique strings from component
const uniqueStrings = [];
if (componentCode) {
  const strRe = /["'`]([^"'`]{3,80})["'`]/g;
  let m;
  while ((m = strRe.exec(componentCode))) {
    const s = m[1];
    if (/left|Overdue|Due|day|Day|ago|remaining/i.test(s)) uniqueStrings.push(s);
  }
}
out.push("\nUnique UI strings from source component:");
out.push([...new Set(uniqueStrings)].join("\n"));

out.push("\nSearching those strings in bundle:");
for (const s of [...new Set(uniqueStrings)]) {
  const idxs = findAll(page, s);
  out.push("  " + JSON.stringify(s) + ": " + idxs.length + (idxs.length ? " @" + idxs.slice(0, 3).join(",") : ""));
  if (idxs.length && /left|Overdue/i.test(s)) {
    // extract surrounding function from bundle
    const idx = idxs[0];
    // walk back to "function "
    const back = page.lastIndexOf("function ", idx);
    if (back >= 0 && idx - back < 5000) {
      out.push("\n--- Possible compiled form near string " + JSON.stringify(s) + " ---");
      const compiled = extractBraceFn(page, back);
      out.push(compiled.slice(0, 4000));
      out.push("--- BEAUTIFIED ---");
      try {
        out.push(
          compiled
            .replace(/;\s*/g, ";\n")
            .replace(/\{\s*/g, "{\n")
            .replace(/\s*\}/g, "\n}\n")
            .slice(0, 5000)
        );
      } catch {}
    } else {
      out.push("\n--- Context ~3000 around string ---");
      out.push(page.slice(Math.max(0, idx - 1500), Math.min(page.length, idx + 1500)));
    }
  }
}

// Hot updates
out.push("\n" + "=".repeat(80));
out.push("HOT-UPDATE FILES");
for (const f of fs.readdirSync(hotDir).filter((x) => x.endsWith(".js"))) {
  const fp = path.join(hotDir, f);
  const c = fs.readFileSync(fp, "utf8");
  const hits = findAll(c, "DueCountdown").length;
  const hasFn = /function\s+DueCountdown\b/.test(c);
  out.push(f + ": DueCountdown=" + hits + " hasFn=" + hasFn);
  if (hasFn) {
    const idx = c.search(/function\s+DueCountdown\b/);
    out.push(extractBraceFn(c, idx));
  }
  // search unique strings
  for (const s of [...new Set(uniqueStrings)].filter((x) => /left|Overdue/i.test(x))) {
    if (c.includes(s)) {
      out.push("  contains string " + JSON.stringify(s));
      const idx = c.indexOf(s);
      const back = c.lastIndexOf("function ", idx);
      if (back >= 0 && idx - back < 8000) {
        out.push("--- compiled from hot-update ---");
        out.push(extractBraceFn(c, back));
      }
    }
  }
}

// Helpers: formatDateTime from source imports / labels
const labelsPath =
  "C:/Users/aman.kumar/Desktop/akiga/apps/design-system/src/components/product/sod/labels.tsx";
if (fs.existsSync(labelsPath)) {
  const lab = fs.readFileSync(labelsPath, "utf8");
  const fi = lab.search(/function\s+formatDateTime\b/);
  const fj = lab.search(/function\s+formatDate\b/);
  out.push("\n" + "=".repeat(80));
  out.push("RELATED HELPERS from labels.tsx");
  if (fj >= 0) out.push(extractBraceFn(lab, fj));
  if (fi >= 0) out.push("\n" + extractBraceFn(lab, fi));
}

// Also ~3000 char context from bundle around DueCountdown usage
out.push("\n" + "=".repeat(80));
out.push("BUNDLE USAGE CONTEXT (~3000 chars)");
for (const idx of findAll(page, "DueCountdown")) {
  out.push(page.slice(Math.max(0, idx - 1500), Math.min(page.length, idx + 1500)));
}

fs.writeFileSync(outPath, out.join("\n"), "utf8");
console.log("Wrote", outPath);
console.log("Component lines:", componentCode ? componentCode.split("\n").length : 0);
if (componentCode) {
  console.log("---COMPONENT START---");
  console.log(componentCode);
  console.log("---COMPONENT END---");
}
