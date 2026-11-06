# ⚽🎾 Arthur · 18 ans

Site cadeau pour les 18 ans d'Arthur (né le 20 décembre 2008), qui lui est adressé directement.
100 % statique (HTML / CSS / JS), aucune installation. En ligne : https://arthur18ans.vercel.app

## Le déroulé (« programme du match »)
0. **Entrée des joueurs** — intro dans le tunnel, avec ou sans le son (coup de sifflet, ambiance de stade).
1. **Coup d'envoi** — « ARTHUR 18 », projecteurs qui s'allument, compte à rebours jusqu'au 20/12/2026.
2. **Le mot d'avant-match** — une lettre manuscrite qui s'écrit paragraphe par paragraphe.
3. **Ta carte de joueur** — carte collector holographique, se retourne au clic.
4. **Tes stats en direct** — compteurs qui s'emballent puis avancent chaque seconde.
5. **Ta carrière** — frise 2008 → 2026.
6. **Ta vie en 18 saisons** — pellicule de 31 photos classées par âge (6 à 17 ans), visionneuse plein écran avec flèches et balayage.
7. **Tirs au but** — Arthur (vu de dos, maillot « ARTHUR 18 ») prend son élan et frappe ; le gardien articulé plonge. Bandeau façon retransmission TV.
8. **Défi jongles** — mini-jeu, record enregistré dans le navigateur.
9. **Tes supporters** — messages de ses proches.
10. **Tes 18 bougies** — à souffler au clic ou dans le micro.
11. **Ton trophée** — ticket à gratter qui révèle le cadeau.
12. **Le casier n°18** — verrouillé jusqu'au 20/12/2026 à minuit (tester avant : ajouter `?jourj` à l'adresse).
13. **Coup de sifflet final** — feu d'artifice.

Personnages et ballon : dessinés en vectoriel et animés par squelette (`js/figures.js`).

Bonus : minute de match qui avance avec le défilement, menu « Programme », sons synthétisés (aucun fichier audio),
easter eggs au clavier (`psg`, `arthur`, `ace`).

## Personnaliser
Tout le contenu est dans **`js/data.js`** : lettre, frise, photos par âge, messages, cadeau à gratter, message du casier.

**Ajouter des photos** : déposer les fichiers dans `images/galerie/`, puis dans `js/data.js` :
```js
saisons: [ { age: 5, src: "images/galerie/age-05.jpg", legende: "Premier maillot", pos: "50% 30%" }, … ],  // pos = cadrage
photoProfil: "images/arthur.jpg",   // photo de la carte joueur
```
