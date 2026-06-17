#!/usr/bin/env node
// Build the static, deployable share/ bundle:
//   share/index.html            ← gate page (client enters code)
//   share/p/<token>/index.html  ← that client's APPROVED proposal + assets + pdf
//
// Only active codes whose client is finalized (approvals.finalized) are published.
// The proposal lives at an unguessable path token = sha256(salt+code); the gate derives
// the same token client-side from the typed code, so no code/path list is exposed.
//
// Usage:  node scripts/build-share.mjs
// Then deploy the share/ folder to any static host (Netlify drop, Cloudflare Pages,
// GitHub Pages, etc). See README.

import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { build, loadApprovals } from "./build-page.mjs";
import { tokenFor } from "./codes.mjs";

const SHARE = resolve("share");
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const GATE = (salt) => `<!doctype html><html lang=en data-theme=dark><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1"><title>Enter your code</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:radial-gradient(1200px 600px at 50% -10%,#1c2230,#0c0d11);color:#e9eaee;font:16px/1.6 -apple-system,system-ui,sans-serif}
.card{width:min(420px,92vw);background:#15171d;border:1px solid #272b34;border-radius:16px;padding:30px;text-align:center}
h1{font-size:21px;margin:0 0 4px} p{color:#9aa0ab;font-size:14px;margin:0 0 20px}
input{width:100%;padding:13px 14px;font-size:18px;letter-spacing:.06em;text-align:center;border-radius:11px;
border:1px solid #272b34;background:#0f1116;color:#e9eaee;text-transform:lowercase}
input:focus{outline:none;border-color:#3ddc97}
button{margin-top:14px;width:100%;padding:13px;font-size:16px;font-weight:700;border:none;border-radius:11px;background:#3ddc97;color:#04210f;cursor:pointer}
.err{color:#ff8589;font-size:14px;min-height:20px;margin-top:12px}
</style></head><body>
<form class=card id=f>
<h1>Your shoot proposal</h1><p>Enter the access code you were given.</p>
<input id=code autocomplete=off autocapitalize=off spellcheck=false placeholder="e.g. WhiteSocksGuy" required>
<button type=submit>View proposal</button>
<div class=err id=err></div>
</form>
<script>
const salt=${JSON.stringify(salt)};
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
async function token(code){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+norm(code)));
return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,24);}
document.getElementById('f').addEventListener('submit',async e=>{e.preventDefault();
const err=document.getElementById('err');err.textContent='';
const code=document.getElementById('code').value.trim();
if(!norm(code))return;const t=await token(code);const url='p/'+t+'/index.html';
try{const r=await fetch(url,{method:'HEAD'});
 if(r.ok){location.href=url;return;}
 if(r.status===404){err.textContent='That code didn\\'t match an active proposal.';return;}
 location.href=url;return;
}catch(_){location.href=url;}}); // file:// blocks fetch — navigate; browser 404s an invalid code
</script></body></html>`;

async function copyImages(srcDir, files, destDir) {
  if (!files.length) return;
  await mkdir(destDir, { recursive: true });
  for (const f of files) { const s = join(srcDir, f); if (existsSync(s)) await copyFile(s, join(destDir, f)); }
}

async function main() {
  if (!existsSync("codes.json")) { console.error("No codes.json. Create a code first: node scripts/codes.mjs add <slug>"); process.exit(1); }
  const { salt, codes } = JSON.parse(await readFile("codes.json", "utf8"));

  await rm(SHARE, { recursive: true, force: true });
  await mkdir(join(SHARE, "p"), { recursive: true });
  await writeFile(join(SHARE, "index.html"), GATE(salt));

  let published = 0, skipped = 0;
  for (const [code, c] of Object.entries(codes)) {
    if (!c.active) { skipped++; continue; }
    const dir = resolve("clients", c.slug);
    const approvals = await loadApprovals(dir);
    if (!approvals || !approvals.finalized) {
      console.warn(`• skip ${code} (${c.slug}): not finalized in review yet`);
      skipped++; continue;
    }
    const token = tokenFor(salt, code);
    const dest = join(SHARE, "p", token);
    await mkdir(dest, { recursive: true });

    const res = await build({ dir, client: true });
    await writeFile(join(dest, res.outName === "proposal.html" ? "index.html" : res.outName), res.html);

    await copyImages(join(dir, "assets", "moodboard"), res.moodUsed, join(dest, "assets", "moodboard"));
    await copyImages(join(dir, "assets", "poses"), res.poseUsed, join(dest, "assets", "poses"));
    const pdf = join(dir, "deliverables", "presentation.pdf");
    if (existsSync(pdf)) { await mkdir(join(dest, "deliverables"), { recursive: true }); await copyFile(pdf, join(dest, "deliverables", "presentation.pdf")); }

    console.log(`✓ ${c.display || code} → ${c.slug}  (mood ${res.moodUsed.length} / pose ${res.poseUsed.length})  /p/${token}/`);
    published++;
  }

  console.log(`\nshare/ built: ${published} published, ${skipped} skipped.`);
  console.log(`Preview locally:  npx --yes serve share   (or: python3 -m http.server -d share 8080)`);
  console.log(`Deploy: drop the share/ folder on Netlify, Cloudflare Pages, or push to GitHub Pages.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
