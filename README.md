# MyFridge

App personale (PWA) per le scadenze di frigo, freezer e dispensa, condivisa tra chi vive in casa.

## Cosa fa

- **Oggi**: si aggiorna da sola ogni giorno e mostra gli scaduti, cosa scade oggi, domani ed entro 3 giorni.
- **Aggiungi**: foto del prodotto, scansione del codice a barre (nome e immagine da Open Food Facts), data con scorciatoie (+3 gg, +1 settimana…), tipo di data, quantità, posizione e durata dopo l'apertura.
- **Memoria dei prodotti**: ogni prodotto resta nel catalogo con foto e abitudini. La volta dopo basta scrivere le prime lettere o scansionare il codice, e la scadenza viene proposta in base all'ultimo acquisto.
- **Usato / Buttato**: toglie un'unità alla volta. A zero, il prodotto sparisce dalle liste ma resta nel catalogo. C'è sempre "Annulla".
- **Aperto**: ricalcola la scadenza in base ai giorni di durata dopo l'apertura.
- **Calendario**: crea un evento con avviso alle 9 del giorno prima e alle 9 del giorno stesso, per un prodotto o per tutte le scadenze dei prossimi 14 giorni.
- **Spreco**: usati e buttati negli ultimi 30 giorni, grafico degli ultimi 6 mesi e prodotti buttati più spesso.
- **Casa condivisa**: ognuno ha il proprio account, la dispensa è la stessa e si aggiorna in tempo reale.

Senza Firebase l'app funziona in **modalità prova** (dati solo sul dispositivo, con esempi rimovibili).

## 1. Pubblicare su GitHub Pages

1. Su GitHub crea un nuovo repository, per esempio `MyFridge` (pubblico, come per Libreria).
2. Carica tutto il contenuto della cartella: `index.html`, `manifest.json`, `sw.js`, `firestore.rules`, `README.md` e la cartella `icons`.
3. **Settings → Pages**: Source "Deploy from a branch", branch `main`, cartella `/ (root)`. Salva.
4. Dopo un minuto l'app è su `https://margaz90.github.io/MyFridge/`.
5. Sull'iPhone aprila in Safari → Condividi → **Aggiungi alla schermata Home**.

## 2. Collegare Firebase (per la condivisione)

Puoi usare il progetto Firebase che hai già per MyLibrary oppure crearne uno nuovo. Le raccolte non si sovrappongono (`households` e `users`). Se `users` esiste già in MyLibrary con un altro uso, conviene un progetto nuovo.

1. [console.firebase.google.com](https://console.firebase.google.com) → **Aggiungi progetto** (piano gratuito Spark, Analytics non serve).
2. **Build → Authentication → Inizia → Email/Password → Attiva**.
3. **Authentication → Settings → Authorized domains → Add domain**: `margaz90.github.io`.
4. **Build → Firestore Database → Crea database**, località `eur3 (europe-west)`, modalità produzione.
5. **Firestore → Regole**: incolla il contenuto di `firestore.rules` e **Pubblica**.
6. **Impostazioni progetto (ingranaggio) → Le tue app → icona Web `</>`**: registra l'app "MyFridge" (Hosting non serve). Copia l'oggetto `firebaseConfig`.
7. In `index.html` cerca la riga `const FIREBASE_CONFIG = null;` e sostituiscila con:

```js
const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "....firebaseapp.com",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

8. Fai commit. Questi valori possono stare in un repository pubblico: la protezione è data dalle regole di Firestore.

## 3. Primo accesso e invito

1. Apri l'app, tocca **Crea un nuovo account** (email + password).
2. Tocca **Crea la casa**.
3. Nella scheda **Casa** copia il **codice d'invito** e mandalo a chi vive con te.
4. Sul suo telefono: installa l'app, crea un account, **Entra con il codice**.

## Note tecniche

- Le foto vengono ridotte a circa 480 px e salvate nel database (circa 40 KB l'una). Non serve Firebase Storage, quindi resta tutto nel piano gratuito.
- Funziona anche offline: le modifiche si sincronizzano quando torna la connessione.
- La scansione del codice a barre usa una foto del codice: avvicinati e cerca una buona luce.
- I promemoria passano dal Calendario di iOS perché le notifiche push di una PWA richiederebbero un server sempre attivo.
- Se cambi `index.html` e l'app installata non si aggiorna, chiudila e riaprila. In `sw.js` puoi anche incrementare `myfridge-v1`.
