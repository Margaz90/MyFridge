---
name: verifica-hook
description: Verifica mensile degli hook di MyFridge. Controlla cosa è cambiato nel progetto dall'ultima verifica, se gli hook esistenti funzionano e propone da 0 a 3 nuovi hook, senza crearli finché Diego non approva. Usala quando il promemoria dell'hook UserPromptSubmit la richiede, oppure quando Diego chiede di verificare o rivedere gli hook.
---

# Verifica mensile degli hook di MyFridge

Rispondi sempre in italiano. Fai prima la richiesta di Diego, poi questa verifica nella stessa risposta, in una sezione breve e separata.

## 1. Cosa è cambiato

- Leggi `.claude/verifica-hook.json` per la data dell'ultima verifica (`ultima`).
- `git log --since=<ultima> --stat` su `main`: quali file sono cambiati e quanto spesso.
- Cerca i problemi ricorrenti nei messaggi di commit: correzioni ripetute, versioni ripubblicate per errori, rollback.
- Rileggi `CLAUDE.md`: le regole di lavoro del progetto sono le cose che un hook può far rispettare.

Le regole di MyFridge da tenere d'occhio:
- tutto in `index.html` (CSS e JS inline, nessun build step) e pubblicato direttamente da `main` con GitHub Pages: un errore di sintassi rompe l'app a entrambi gli utenti;
- `CACHE` in `sw.js` va incrementato quando cambiano i file dell'app, `CDN_CACHE` quando cambia `FB_VER` o la versione di ZXing;
- ogni modifica a `firestore.rules` va ripubblicata a mano nella console Firebase;
- niente `alert`/`confirm`, colori solo tramite token CSS in `:root`, input a 16 px;
- interfaccia e commit in italiano.

## 2. Gli hook esistenti funzionano?

- Elenca gli hook in `.claude/settings.json` (non cancellare o sostituire voci esistenti).
- Per ognuno, eseguilo con un input di prova e controlla codice di uscita e output (`jq` per il JSON).
- Per `promemoria-verifica.mjs`: prova con date di 0, 29, 30 e 31 giorni fa (`node .claude/hooks/promemoria-verifica.mjs <file> <oggi>`); deve stampare solo da 30 giorni in su e uscire sempre con 0.
- Segnala gli hook che non servono più o che danno falsi allarmi.

## 3. Proposte

Proponi da 0 a 3 nuovi hook, solo se c'è un motivo concreto emerso dai punti 1 e 2. Zero proposte è una risposta valida.

| Hook | Evento | Cosa fa | Pro | Contro |
|---|---|---|---|---|

**Non creare né modificare hook finché Diego non approva.** Se approva, aggiungili su un branch, provali come al punto 2 e chiedi prima di unire su `main`.

## 4. Chiusura

- Aggiorna `ultima` in `.claude/verifica-hook.json` con la data di oggi (fuso Europe/Rome).
- Fai commit in italiano e pubblica la data sul ramo in uso, così la prossima sessione la ritrova (le sessioni cloud sono temporanee).
- Riepiloga a Diego in poche righe: cosa hai controllato, cosa funziona, le proposte in tabella.
