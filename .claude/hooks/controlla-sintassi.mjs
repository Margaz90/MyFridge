// Controllo di sintassi del JavaScript inline di index.html (hook PostToolUse).
// L'app si pubblica direttamente da main: un errore di sintassi la rompe a entrambi gli utenti.
// Se trova un errore esce con 2 e lo descrive su stderr, così Claude lo corregge subito; altrimenti non fa nulla.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch {}
const t = input.tool_input || {};
const tocca = String(t.file_path || "").endsWith("index.html") || (input.tool_name === "Bash" && /index\.html/.test(t.command || ""));
if (!tocca) process.exit(0);

let html;
try { html = readFileSync(process.argv[2] || join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), "index.html"), "utf8"); } catch { process.exit(0); }
const blocchi = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
for (const b of blocchi) {
  const riga = html.slice(0, b.index).split("\n").length; // riga del tag <script> in index.html
  try { new vm.Script(b[1]); }
  catch (e) {
    const m = /:(\d+)$/m.exec(e.stack.split("\n")[0]);
    const dove = m ? ` intorno alla riga ${riga + Number(m[1]) - 1}` : "";
    process.stderr.write(`index.html: errore di sintassi JavaScript${dove}: ${e.message}. Correggilo prima di pubblicare.\n`);
    process.exit(2);
  }
}
process.exit(0);
