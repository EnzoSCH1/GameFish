# Sea Fish Game

Jeu web 2D en JavaScript (DOM) avec boucles d’animation temps réel, événements dynamiques et persistance locale/cloud. Projet optimisé pour desktop et mobile.

## Fonctionnalités
- **Gameplay temps réel** : suivi du curseur, dash, aimant, boss, ennemis et particules de feedback.
- **Modes de jeu** : Normal, Endless, Time Attack.
- **Événements aléatoires** : tempête, soif de sang, marée, plancton lumineux, eau trouble, attaque surprise.
- **Skins & Aquarium** : boutique, badges NEW, équipement, raretés.
- **Options avancées** : multiplicateur de vitesse du boss, temps, toggles visuels (parallaxe, caustiques, swimmers).
- **Mobile** : joystick virtuel, HUD adaptatif, perf réduite.

## Stack technique
- **HTML5 / CSS3 / JavaScript ES6**
- **Firebase (Firestore + Analytics)** pour la sauvegarde et le leaderboard
- **localStorage** pour la persistance client
- **Optimisations DOM** : pooling, contain, will-change, content-visibility

## Structure
- [index.html](index.html) : structure et UI
- [styles.css](styles.css) : styles, animations, UI responsive
- [app.js](app.js) : logique de jeu
- [firebase.js](firebase.js) : API Firebase
- [assets/](assets/) : images et sprites

## Sécurité Firebase
La config Firebase n’est pas versionnée. Un fichier `firebase.config.js` (non commité) :

```js
window.__FIREBASE_CONFIG__ = {
  apiKey: "???",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

## ▶Lancer en local
- Ouvrir [index.html](index.html) avec un serveur local (Live Server conseillé)
- URL typique : `http://localhost:5500/`

## Notes techniques
- **Event loop** : `requestAnimationFrame`
- **Pooling** : bulles et swimmers recyclés
- **Pause auto** : onglet inactif + options
- **Z-index** : overlays contrôlés pour éviter conflits UI

## Détails dev (tech)
- **État global** : variables runtime centralisées (score, timer, boss, events)
- **Systèmes** : spawns séparés (food/bonus/malus/power) + handlers dédiés
- **Input** : souris + touch + joystick virtuel (mobile)
- **Perf** : `contain`, `will-change`, `content-visibility`, et timers limités
- **Persistance** : `localStorage` (options/skins) + Firestore (scores)

## Diagramme (architecture)
```mermaid
flowchart TB
  UI[UI / HUD / Overlays]
  Input[Souris / Touch / Joystick]
  Engine[Game Loop (requestAnimationFrame)]
  Systems[Systems: spawn, collisions, boss, events]
  State[Global State (score, timer, mode, options)]
  Storage[Storage: localStorage + Firestore]

  Input --> Engine --> Systems --> State
  UI --> State
  State --> UI
  State --> Storage
  Storage --> State
```

## Schéma d’événement (runtime)
```mermaid
sequenceDiagram
  participant Loop as Game Loop
  participant RNG as Event RNG
  participant State as State
  participant UI as UI/Overlay
  participant FX as Effects

  Loop->>RNG: tick()
  RNG-->>Loop: eventType?
  Loop->>State: startEvent(type)
  State->>FX: applyEffects(type)
  State->>UI: showNotification(type)
  Loop->>State: updateEventTimer(dt)
  State-->>Loop: endEvent when timer=0
  State->>FX: clearEffects()
  State->>UI: hideNotification()
```

---

Auteur : EnzoSCH1
