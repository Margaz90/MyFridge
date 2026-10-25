# MyFridge — note per Claude

App personale di Diego per le scadenze di frigo, freezer e dispensa, condivisa con la compagna. Utenti: due adulti, entrambi su iPhone, app installata dalla schermata Home. Lingua dell'interfaccia e dei commit: italiano.

## Architettura

- **PWA statica** pubblicata con GitHub Pages dal ramo `main`, cartella root (`https://margaz90.github.io/MyFridge/`). Nessun build step: si modifica e si pubblica direttamente `index.html`.
- **Tutto in `index.html`**: CSS e JS inline, JavaScript vanilla, nessun framework. Mantenere questa struttura a file unico.
- `sw.js`: service worker network-first per i file del sito; jsDelivr e Google Fonts vanno invece in una cache separata (`myfridge-cdn-v1`) con priorità alla cache, così Firebase si carica anche offline. Quando cambiano i file dell'app, incrementare `CACHE` (oggi `myfridge-v3`). Quando cambia la versione di una libreria (`FB_VER`, ZXing), incrementare `CDN_CACHE` per eliminare i file vecchi.
- `manifest.json` e `icons/`: icona verde con frigo bianco e un'etichetta rosa con la data a puntini attaccata alla porta. Il sorgente è `icons/icon.svg`: i PNG (512, 192, 180 per `apple-touch-icon`) si rigenerano da lì.
- **Firebase** (SDK compat `10.12.2` da jsDelivr, caricato solo se `FIREBASE_CONFIG` non è `null`): Auth Email/Password e Firestore con persistenza offline. Firebase Storage non si usa, per restare nel piano gratuito Spark.
- **Modalità prova**: con `FIREBASE_CONFIG = null` i dati vanno in `localStorage` (`myfridge.v1`) con prodotti di esempio rimovibili. `LocalStore` e `CloudStore` espongono la stessa interfaccia (`saveItem`, `deleteItem`, `saveProduct`, `deleteProduct`, `clearExamples`).

## Modello dati Firestore

- `users/{uid}` → `{ householdId }`
- `households/{codice}` → `{ name, members: [uid], memberEmails: {uid: email}, createdAt }`. L'ID del documento è il codice d'invito (10 caratteri, alfabeto senza caratteri ambigui).
- `households/{codice}/products/{id}`: catalogo permanente → `name, brand, barcode, photo, location, dateType, openDays, lastDays, timesAdded, lastAdded, toBuy, toBuyAt`. `toBuy` indica che il prodotto è nella lista "Da comprare".
- `households/{codice}/items/{id}`: confezioni in casa → `productId, name, expiry (YYYY-MM-DD), dateType ('entro'|'pref'), qty, location ('frigo'|'freezer'|'dispensa'), openDays, opened, openedAt, status ('active'|'consumed'|'wasted'), closedAt, addedAt, addedBy, calendarAdded, log: [{d, k:'u'|'w', n, by}]`
- Le regole sono in `firestore.rules`: un utente legge e scrive solo nella propria casa. Può entrare in una casa solo aggiungendo se stesso con la propria email. I membri possono cambiare solo il nome della casa: nessuno può togliere gli altri o cambiarne l'email. Ogni modifica a queste regole va ripubblicata a mano nella console Firebase.
- `CloudStore` scarica solo gli item attivi e quelli chiusi dal primo giorno del mese di 6 mesi fa (`closedAt >= …`), cioè quanto serve alla pagina Spreco. Gli item più vecchi restano su Firestore ma l'app non li legge.

## Logica chiave

- Scadenza effettiva = la data più vicina tra la data in etichetta e `openedAt + openDays` (funzione `eff`).
- La home ha quattro fasce: scaduti, oggi, domani ed entro 3 giorni (`band`). Si aggiorna al cambio di giorno (`checkDay` su `visibilitychange` e timer).
- "Usato" e "Buttato" scalano un'unità e scrivono nel `log`. A zero l'item si chiude, mentre il prodotto resta nel catalogo. Se era l'ultima confezione in casa, il prodotto va in "Da comprare" (`toBuy`). Ogni azione ha "Annulla" nel toast.
- Lista "Da comprare" (scheda della Lista): si aggiunge a mano o in automatico. "Comprato" apre l'aggiunta già compilata, e il salvataggio toglie il prodotto dalla lista.
- Un prodotto si elimina dal catalogo dalla scheda che si apre toccandolo, ma solo se non ne restano confezioni in casa.
- Pallino sull'icona: `navigator.setAppBadge` con il numero di prodotti scaduti o che scadono oggi, aggiornato a ogni `render`. Su iOS funziona solo dalla schermata Home (16.4+) e richiede il permesso per le notifiche, che si chiede dalla scheda Casa.
- La scadenza non si legge dalla foto: la foto del codice a barre serve solo a riconoscere il prodotto. Per un prodotto nuovo la data parte vuota ed è obbligatoria. Si scrive nel campo di testo (`parseExpiry` capisce 15/11, 15.11.26, 15 NOV 2026, 151126, solo mese/anno = fine mese, anche in mezzo al numero di lotto) oppure si sceglie dal calendario. Su iPhone, tenendo premuto il campo, "Scansiona testo" di iOS la legge dalla confezione.
- `lastDays` (giorni tra acquisto e scadenza) serve a proporre la scadenza al riacquisto, con l'avviso di controllare la confezione. Se la data viene corretta in seguito con "Modifica", `lastDays` si ricalcola, purché si tratti dell'acquisto più recente.
- Le foto vengono compresse a 480 px in JPEG e salvate come data URL nel documento del prodotto, dove restano ben sotto il limite di 1 MB di Firestore.
- Codice a barre: si fotografa il codice, si prova prima `BarcodeDetector` e poi ZXing (`@zxing/library@0.21.3` caricato su richiesta). Nome e immagine arrivano da Open Food Facts.
- Calendario: file `.ics` con evento giornaliero e due avvisi (alle 9 del giorno prima e alle 9 del giorno stesso). Le notifiche push sono escluse di proposito, perché richiederebbero Cloud Functions e il piano a pagamento.

## Convenzioni di design

- Colori solo tramite token CSS in `:root`, con tema scuro sia via `prefers-color-scheme` sia via `[data-theme]`.
- Font: Instrument Sans per il testo, DotGothic16 per i "timbri" delle date (richiamano la stampa a puntini delle confezioni).
- Pensata prima per iPhone: rispettare le safe area, target tattili da almeno 36 px, input a 16 px per evitare lo zoom su iOS.
- Niente `alert`/`confirm`: le conferme stanno nell'interfaccia (per esempio "Tocca di nuovo per eliminare").

## Hook di Claude Code

- `.claude/settings.json` → hook `UserPromptSubmit` che lancia `.claude/hooks/promemoria-verifica.mjs`. Se dall'ultima verifica (`.claude/verifica-hook.json`) sono passati almeno 30 giorni, chiede di eseguire la skill `verifica-hook` dopo aver risposto. Non blocca mai.
- Hook `PostToolUse` (`.claude/hooks/controlla-sintassi.mjs`): dopo ogni modifica a `index.html` controlla la sintassi del JavaScript inline. Se trova un errore lo segnala (uscita 2) perché venga corretto prima di pubblicare.
- Skill `.claude/skills/verifica-hook/SKILL.md`: controlla i cambiamenti e gli hook esistenti, propone fino a 3 nuovi hook e non li crea senza l'approvazione di Diego.

## Stato

- Prima versione pubblicata il 23/10/2026. Versione 1.1.0: nuova icona, lista "Da comprare", eliminazione dal catalogo, pallino sull'icona, uso offline anche con Firebase, regole più strette. Versione 1.1.1: data di scadenza obbligatoria, scritta o scansionata come testo.
- GitHub Pages è attivo.
- Da fare: creare il progetto Firebase e inserire `FIREBASE_CONFIG` in `index.html` (i passaggi sono nel README).
