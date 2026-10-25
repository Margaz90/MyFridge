// Promemoria della verifica mensile degli hook (hook UserPromptSubmit).
// Se dall'ultima verifica sono passati almeno `intervalloGiorni`, chiede a Claude di eseguire la skill verifica-hook
// dopo aver risposto a Diego. Altrimenti non stampa nulla. Non blocca mai: in caso di errore esce in silenzio.
// Uso nei test: node promemoria-verifica.mjs [percorso-json] [oggi AAAA-MM-GG]
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

try {
  const file = process.argv[2] || join(process.env.CLAUDE_PROJECT_DIR || join(dirname(fileURLToPath(import.meta.url)), "..", ".."), ".claude", "verifica-hook.json");
  const { ultima, intervalloGiorni = 30 } = JSON.parse(readFileSync(file, "utf8"));
  // la data di oggi è quella italiana, come le date scritte nel file
  const oggi = process.argv[3] || new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
  const giorni = Math.round((Date.parse(oggi) - Date.parse(ultima)) / 864e5);
  if (Number.isFinite(giorni) && giorni >= intervalloGiorni) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: `Verifica mensile degli hook di MyFridge: l'ultima è del ${ultima}, ${giorni} giorni fa. ` +
          "Prima rispondi alla richiesta di Diego come al solito; poi, nella stessa risposta, esegui la skill verifica-hook " +
          "(.claude/skills/verifica-hook/SKILL.md) e segui le sue istruzioni. Non creare nuovi hook senza la sua approvazione."
      }
    }));
  }
} catch {}
process.exit(0);
