# ⚽🎾 Arthur · 18 ans

Site cadeau pour les 18 ans d'Arthur (né le 20 décembre 2008), qui lui est adressé directement.
100 % statique (HTML / CSS / JS), aucune installation. En ligne : https://arthur18ans.vercel.app

## Le déroulé (« programme du match »)
0. **Entrée des joueurs** — intro dans le tunnel, avec ou sans le son (coup de sifflet, ambiance de stade).
1. **Coup d'envoi** — maillot de foot floqué « ARTHUR 18 » qui tombe et se balance, projecteurs qui s'allument, compte à rebours jusqu'au 20/12/2026.
2. **Le mot d'avant-match** — une lettre manuscrite qui s'écrit paragraphe par paragraphe.
3. **Ta carte de joueur** — carte collector holographique, se retourne au clic.
3 bis. **Ta race préférée** — fiche « Le bulldog » avec une vraie photo et des stats animées (contenu dans `preferes.chien`, js/data.js).
4. **Tes stats en direct** — compteurs qui s'emballent puis avancent chaque seconde.
5. **Ta carrière** — frise 2008 → 2026.
6. **Ta vie en 18 saisons** — pellicule de 31 photos classées par âge (6 à 17 ans), visionneuse plein écran avec flèches et balayage.
7. **Tirs au but** — Arthur (vu de dos, maillot « ARTHUR 18 ») prend son élan et frappe ; le gardien articulé plonge. Bandeau façon retransmission TV.
8. **Défi jongles** — mini-jeu, record enregistré dans le navigateur.
9. **Tes supporters** — messages de ses proches.
10. **Tes 18 bougies** — à souffler au clic ou dans le micro.
11. **Ton billet pour le Parc** — billet de match PARIS vs MARSEILLE (20/12/2026, au nom d’Arthur) avec zone à gratter qui révèle le cadeau, puis tampon « VALIDÉ ». Infos du billet modifiables dans `billet` (js/data.js).
12. **Le casier n°18** — réglable dans `casier.verrouille` (js/data.js) : `false` = ouvert (réglage actuel), `true` = fermé jusqu’au 20/12/2026 (tester avec `?jourj`).
13. **Coup de sifflet final** — feu d'artifice.

Personnages et ballon : dessinés en vectoriel et animés par squelette (`js/figures.js`).

Mascotte : un vrai bouledogue (photo découpée en corps + 4 pattes articulées, `js/dog.js`) qui marche, trotte, se promène, aboie au clic et sprinte en poussant le ballon. Photos : Artur Malinowski (CC BY 2.0) et marneejill (CC BY-SA 2.0), Flickr, créditées en bas du site.

Bonus : minute de match qui avance avec le défilement, menu « Programme », sons synthétisés (aucun fichier audio),
easter eggs au clavier (`psg`, `arthur`, `ace`).

## Personnaliser
Tout le contenu est dans **`js/data.js`** : lettre, frise, photos par âge, messages, cadeau à gratter, message du casier.

**Ajouter des photos** : déposer les fichiers dans `images/galerie/`, puis dans `js/data.js` :
```js
saisons: [ { age: 5, src: "images/galerie/age-05.jpg", legende: "Premier maillot", pos: "50% 30%" }, … ],  // pos = cadrage
photoProfil: "images/arthur.jpg",   // photo de la carte joueur
```

## 🔒 Verrou jusqu'au coup d'envoi
Le fichier **`middleware.js`** verrouille le site côté serveur (Vercel) jusqu'à l'heure `OUVERTURE` :
- avant l'heure, seule une page d'attente s'affiche (« Le match n'a pas encore commencé » + compte à rebours synchronisé sur l'horloge du serveur) ; photos, textes et scripts sont inaccessibles ;
- à l'heure exacte, la page d'attente bascule toute seule sur le site ;
- les parents gardent l'accès via le lien d'aperçu secret (`?apercu=…`) ; seule son empreinte SHA-256 figure dans le code ;
- réglages en haut de `middleware.js` : `VERROU_ACTIF` (true/false) et `OUVERTURE` (date et heure, heure de Paris).
