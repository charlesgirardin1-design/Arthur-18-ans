# ⚽🎾 Arthur · 18 ans

Site cadeau pour les 18 ans d'Arthur (né le 20 décembre 2008) : il lui est adressé directement, à la 2e personne.
100 % statique (HTML / CSS / JS), aucune installation : ouvrir `index.html` dans un navigateur.

## Sections
1. **Hero stade** — projecteurs, « ARTHUR 18 », compte à rebours jusqu'au 20/12/2026 (bascule automatiquement en mode « Joyeux anniversaire » le jour J, avec confettis).
2. **Carte joueur** — carte collector dorée, effet 3D au survol, se retourne au clic (fiche technique).
3. **Stats en direct** — secondes vécues, battements de cœur, pas courus… mis à jour chaque seconde.
4. **La carrière** — frise chronologique 2008 → 2026.
5. **Séance de tirs au but** — mini-jeu : 5 tirs contre un gardien dessiné qui plonge, ballon en courbe, filet qui tremble, tribune qui s'enflamme.
6. **Jeu, set et quiz** — quiz « Connais-tu Arthur ? » compté comme au tennis (15, 30, 40, JEU…).
7. **Vestiaire photo** — galerie polaroïds (emplacements « photo à venir » en attendant).
8. **Tes supporters** — messages de ses proches pour lui, en post-it.
9. **Souffle tes 18 bougies** — gâteau avec 18 bougies à souffler au clic… ou pour de vrai dans le micro.

Animations : minute de match qui avance avec le défilement (0' → 90+'), bandeau LED, flashs photo dans les tribunes, apparition des sections au défilement, compteurs qui s'emballent, balle de tennis qui rebondit sur le court.

Easter eggs : taper `psg`, `arthur` ou `ace` au clavier, ou cliquer sur le ballon.

## Personnaliser
Tout le contenu est dans **`js/data.js`** (textes, quiz, frise, messages, photos).

**Ajouter des photos** : déposer les fichiers dans `images/galerie/`, puis dans `js/data.js` :
```js
photos: [
  { src: "images/galerie/plage-2015.jpg", legende: "Été 2015" },
],
photoProfil: "images/arthur.jpg",   // photo de la carte joueur
```
Une photo peut aussi être ajoutée à chaque étape de la frise (`photo: "images/…"`).

## Mise en ligne
N'importe quel hébergeur statique : GitHub Pages, Netlify, Vercel (glisser-déposer le dossier).
