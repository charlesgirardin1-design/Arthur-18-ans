/* =====================================================================
   CONTENU DU SITE — c'est ici qu'on personnalise tout !
   Pas besoin de toucher au reste du code : modifie les textes,
   ajoute des photos, des souvenirs, des messages…
   ===================================================================== */

window.ARTHUR = {
  prenom: "Arthur",
  // Date et heure de naissance (heure de Paris). Change l'heure si tu la connais !
  naissance: "2008-12-20T00:00:00+01:00",

  // Photo principale (carte joueur). Ex : "images/arthur.jpg" — laisse vide en attendant.
  photoProfil: "images/arthur-carte.jpg", // photo recadrée sur le visage
  photoProfilPos: "50% 50%",

  // ---------- LA LETTRE (juste après l'accueil) ----------
  // ⚠️ Texte d'exemple : remplace-le par tes vrais mots.
  lettre: {
    titre: "Mon cher Arthur,",
    paragraphes: [
      "Il y a 18 ans, le 20 décembre 2008, tu faisais ton entrée sur le terrain. Depuis, tu n'as jamais arrêté de courir : après un ballon, après une balle jaune, après tous les défis qu'on te lançait.",
      "On t'a vu tomber, te relever, rater des tirs et en marquer de magnifiques. On t'a vu perdre des matchs et revenir encore plus fort. C'est ça, le vrai talent.",
      "Aujourd'hui tu deviens majeur. Le terrain s'agrandit, les règles changent un peu, mais garde ce qui fait de toi un joueur unique : ton énergie, ton cœur et ce sourire après chaque but.",
      "Quoi qu'il arrive, tu auras toujours tes premiers supporters dans les tribunes. Joyeux anniversaire.",
    ],
    signature: "Ceux qui t'aiment",
  },

  // ---------- CARTE JOUEUR ----------
  carte: {
    note: 99,
    poste: "ATT",
    stats: [
      { label: "VIT", valeur: 92 }, // vitesse
      { label: "TIR", valeur: 88 }, // tir
      { label: "REV", valeur: 95 }, // revers (tennis)
      { label: "END", valeur: 90 }, // endurance
      { label: "PSG", valeur: 100 }, // amour du club
      { label: "FÊT", valeur: 99 }, // niveau de fête
    ],
    sports: ["Foot", "Tennis", "Multisport"],
  },

  // ---------- TON CHIEN PRÉFÉRÉ ----------
  preferes: {
    chien: {
      race: "Le bulldog",
      texte: "Petite taille, gros caractère et une bouille irrésistible : ta race de chien préférée.",
      stats: [
        { label: "Bouille", valeur: 99 },
        { label: "Câlins", valeur: 96 },
        { label: "Ronflements", valeur: 94 },
        { label: "Têtu", valeur: 90 },
        { label: "Vitesse", valeur: 18 },
      ],
      // ce que dit le bulldog quand on clique dessus
      repliques: ["WOUF !", "Une part de pizza ?", "Allez Paris !", "WOUF WOUF !", "18 ans ? Wouf !", "Burger ce soir ?", "Des pâtes, des pâtes !"],
    },
  },

  // ---------- TA CARRIÈRE (frise chronologique) ----------
  carriere: [
    { annee: "2008", titre: "Le coup d'envoi", texte: "20 décembre 2008 : tu entres sur le terrain. Premier cri, premier transfert… vers les bras de tes parents.", photo: "" },
    { annee: "2010", titre: "Premiers dribbles", texte: "À peine debout, tu shootais déjà dans tout ce qui roule. Les meubles du salon s'en souviennent.", photo: "" },
    { annee: "2014", titre: "Signature en club", texte: "Ton premier maillot, tes premiers crampons, tes premiers buts (et tes premières glissades dans la boue).", photo: "" },
    { annee: "2015", titre: "La raquette entre en jeu", texte: "Tu découvres le tennis — et le t-shirt Roland-Garros ne te quitte plus. Coup droit, revers, et une passion qui ne te lâchera plus.", photo: "images/galerie/arthur-06-le-trio.jpg" },
    { annee: "2020", titre: "L'athlète complet", texte: "Foot, tennis, ski nautique, plongée et tous les sports qui passent : tu ne tiens pas en place.", photo: "images/galerie/arthur-11-ski-nautique.jpg" },
    { annee: "2026", titre: "18 ans — Statut de légende", texte: "20 décembre 2026 : ta majorité. Le meilleur reste à jouer.", photo: "images/galerie/arthur-17-bateau.jpg" },
  ],

  // ---------- TA VIE EN 18 SAISONS (photos classées par âge) ----------
  // Plusieurs photos par âge possibles. Pour en ajouter : déposer le fichier dans images/galerie/
  // puis ajouter une ligne { age, src, legende, pos } (pos = cadrage, ex. "50% 30%").
  // Une ligne sans src affiche une case « photo à venir ».
  saisons: [
    { age: 11, src: "images/galerie/arthur-11-guitare.jpg", legende: "Premiers accords", pos: "50% 30%" },
    { age: 10, src: "images/galerie/arthur-10-diner.jpg", legende: "Le dîner aux chandelles, menu fait main", pos: "60% 45%" },
    { age: 10, src: "images/galerie/arthur-10-peignoir.jpg", legende: "Version palace", pos: "50% 30%" },
    { age: 11, src: "images/galerie/arthur-11-ski-nautique.jpg", legende: "Prêt pour le ski nautique", pos: "50% 40%" },
    { age: 11, src: "images/galerie/arthur-11-musee.jpg", legende: "Même pose que la statue", pos: "50% 55%" },
    { age: 11, src: "images/galerie/arthur-11-jardin-japonais.jpg", legende: "Équilibre parfait", pos: "45% 45%" },
    { age: 12, src: "images/galerie/arthur-12-venise.jpg", legende: "Venise, maillot de Paris sur le dos", pos: "50% 40%" },
    { age: 12, src: "images/galerie/arthur-12-piscine.jpg", legende: "Le roi de la piscine", pos: "45% 40%" },
    { age: 12, src: "images/galerie/arthur-12-plongee.jpg", legende: "Baptême de plongée", pos: "70% 35%" },
    { age: 12, src: "images/galerie/arthur-12-velo.jpg", legende: "En selle dans Paris", pos: "60% 50%" },
    { age: 12, src: "images/galerie/arthur-12-rencontre.jpg", legende: "Belle rencontre", pos: "40% 35%" },
    { age: 12, src: "images/galerie/arthur-12-salle-de-sport.jpg", legende: "Les biceps du champion", pos: "50% 45%" },
    { age: 13, src: "images/galerie/arthur-13-glace.jpg", legende: "Ray-Ban et glace à la fraise", pos: "50% 40%" },
    { age: 13, src: "images/galerie/arthur-13-parc-des-princes.jpg", legende: "Au Parc, avec bonnet et écharpe", pos: "50% 45%" },
    { age: 14, src: "images/galerie/arthur-14-terrasse.jpg", legende: "Pause en terrasse", pos: "50% 30%" },
    { age: 17, src: "images/galerie/arthur-17-lego.jpg", legende: "Le jour de ses 17 ans", pos: "35% 45%" },
    { age: 17, src: "images/galerie/arthur-17-paintball.jpg", legende: "Mode commando : paintball", pos: "45% 30%" },
    { age: 17, src: "images/galerie/arthur-17-jardinage.jpg", legende: "Bûcheron d'un jour", pos: "40% 35%" },
    { age: 17, src: "images/galerie/arthur-17-pizza.jpg", legende: "Pizza du soir", pos: "50% 45%" },
    { age: 17, src: "images/galerie/arthur-17-bateau.jpg", legende: "Capitaine Arthur", pos: "70% 45%" },
    { age: 6, src: "images/galerie/arthur-06-le-trio.jpg", legende: "Le trio inséparable", pos: "41% 40%" },
    { age: 6, src: "images/galerie/arthur-06-photo-de-famille.jpg", legende: "La photo de famille", pos: "36% 30%" },
    { age: 7, src: "images/galerie/arthur-07-new-york.jpg", legende: "New York, au MoMA", pos: "50% 65%" },
    { age: 8, src: "images/galerie/arthur-08-coucher-de-soleil.jpg", legende: "Surfeur au coucher du soleil", pos: "28% 50%" },
    { age: 10, src: "images/galerie/arthur-10-mascotte-psg.jpg", legende: "Avec la mascotte du PSG", pos: "55% 55%" },
    { age: 9, src: "images/galerie/arthur-09-scout.jpg", legende: "Scout toujours prêt", pos: "50% 30%" },
    { age: 9, src: "images/galerie/arthur-09-boutique-arthur.jpg", legende: "Sa propre boutique !", pos: "60% 55%" },
    { age: 10, src: "images/galerie/arthur-10-ballon-d-or.jpg", legende: "À deux doigts du Ballon d'Or", pos: "50% 40%" },
    { age: 11, src: "images/galerie/arthur-11-servant-d-autel.jpg", legende: "Servant d'autel", pos: "48% 30%" },
    { age: 11, src: "images/galerie/arthur-11-communion.jpg", legende: "Le jour de sa communion", pos: "60% 40%" },
    { age: 11, src: "images/galerie/arthur-11-tchin-tchin.jpg", legende: "Tchin-tchin !", pos: "25% 35%" },
    { age: 3, src: "images/galerie/arthur-03-balade-au-parc.jpg", legende: "Balade main dans la main", pos: "35% 45%" },
    { age: 3, src: "images/galerie/arthur-03-portrait-studio.jpg", legende: "Premier portrait de pro", pos: "50% 45%" },
    { age: 4, src: "images/galerie/arthur-04-fou-rire.jpg", legende: "Fou rire en famille", pos: "55% 35%" },
    { age: 5, src: "images/galerie/arthur-05-judo.jpg", legende: "Médaillé au judo", pos: "45% 30%" },
    { age: 5, src: "images/galerie/arthur-05-brevet-natation.jpg", legende: "Brevet de natation en poche", pos: "45% 35%" },
    { age: 6, src: "images/galerie/arthur-06-bouclier-de-brennus.jpg", legende: "Devant le Bouclier de Brennus", pos: "65% 60%" },
    { age: 6, src: "images/galerie/arthur-06-pause-au-ski.jpg", legende: "Pause dans la neige", pos: "25% 50%" },
    { age: 6, src: "images/galerie/arthur-06-raclette.jpg", legende: "Soirée raclette", pos: "45% 30%" },
    { age: 7, src: "images/galerie/arthur-07-sourire.jpg", legende: "Le sourire du 14 avril 2016", pos: "50% 40%" },
    { age: 7, src: "images/galerie/arthur-07-disneyland.jpg", legende: "Devant le château de Disneyland", pos: "25% 55%" },
    { age: 7, src: "images/galerie/arthur-07-buzz-l-eclair.jpg", legende: "Vers l'infini et au-delà !", pos: "75% 65%" },
    { age: 7, src: "images/galerie/arthur-07-selfie-disney.jpg", legende: "Selfie de famille à Disney", pos: "25% 40%" },
    { age: 7, src: "images/galerie/arthur-07-zen.jpg", legende: "Mode zen", pos: "50% 35%" },
    { age: 8, src: "images/galerie/arthur-08-ski-en-famille.jpg", legende: "En famille sur les pistes", pos: "75% 50%" },
    { age: 10, src: "images/galerie/arthur-10-meilleur-pote.jpg", legende: "Avec son meilleur pote", pos: "65% 30%" },
    { age: 11, src: "images/galerie/arthur-11-club-de-tennis.jpg", legende: "Au club de tennis", pos: "50% 35%" },
    { age: 12, src: "images/galerie/arthur-12-pensif.jpg", legende: "Pensif au soleil", pos: "50% 30%" },
    { age: 16, src: "images/galerie/arthur-16-sieste.jpg", legende: "Le seul réveillé de la sieste", pos: "18% 50%" },
    { age: 17, src: "images/galerie/arthur-17-sourire-en-coin.jpg", legende: "Sourire en coin", pos: "45% 30%" },
    { age: 17, src: "images/galerie/arthur-17-soiree-d-ete.jpg", legende: "Soirée d'été", pos: "40% 35%" },
    { age: 5, src: "images/galerie/arthur-05-premiere-medaille.jpg", legende: "Sa première grande médaille", pos: "50% 35%" },
    { age: 6, src: "images/galerie/arthur-06-trio-dans-la-neige.jpg", legende: "Le trio dans la neige", pos: "25% 55%" },
    { age: 6, src: "images/galerie/arthur-06-la-pose.jpg", legende: "La pose de groupe", pos: "55% 45%" },
    { age: 6, src: "images/galerie/arthur-06-photo-de-classe.jpg", legende: "Photo de classe", pos: "50% 35%" },
    { age: 6, src: "images/galerie/arthur-06-concert-de-piano.jpg", legende: "Spectateur du concert de piano", pos: "20% 45%" },
    { age: 6, src: "images/galerie/arthur-06-heure-de-la-bd.jpg", legende: "L'heure de la BD", pos: "35% 45%" },
    { age: 6, src: "images/galerie/arthur-06-pensif-au-salon.jpg", legende: "Pensif au salon", pos: "45% 30%" },
    { age: 7, src: "images/galerie/arthur-07-gros-dodo.jpg", legende: "Gros dodo", pos: "70% 60%" },
    { age: 7, src: "images/galerie/arthur-07-chocolats-de-paques.jpg", legende: "Les chocolats de Pâques", pos: "85% 55%" },
    { age: 7, src: "images/galerie/arthur-07-sweat-paris.jpg", legende: "En sweat Paris", pos: "50% 40%" },
    { age: 7, src: "images/galerie/arthur-07-avec-papa.jpg", legende: "Tee-shirts assortis", pos: "40% 45%" },
    { age: 7, src: "images/galerie/arthur-07-casquette.jpg", legende: "Casquette vissée", pos: "50% 40%" },
    { age: 7, src: "images/galerie/arthur-07-le-guerrier.jpg", legende: "Même pas mal !", pos: "70% 45%" },
    { age: 7, src: "images/galerie/arthur-07-retour-en-voiture.jpg", legende: "Retour en voiture, en héros", pos: "50% 40%" },
    { age: 7, src: "images/galerie/arthur-07-glace-a-biarritz.jpg", legende: "Glace à Biarritz", pos: "85% 45%" },
    { age: 7, src: "images/galerie/arthur-07-dejeuner-en-terrasse.jpg", legende: "Déjeuner dans la cour", pos: "30% 60%" },
    { age: 7, src: "images/galerie/arthur-07-devant-le-char.jpg", legende: "Devant le char sur les Champs", pos: "45% 60%" },
    { age: 7, src: "images/galerie/arthur-07-trophee-de-foot.jpg", legende: "Trophée du stage de foot 2016", pos: "45% 45%" },
    { age: 7, src: "images/galerie/arthur-07-selfie-grimaces.jpg", legende: "Selfie grimaces", pos: "25% 45%" },
    { age: 8, src: "images/galerie/arthur-08-toute-la-bande.jpg", legende: "Toute la bande", pos: "50% 40%" },
    { age: 6, src: "images/galerie/arthur-06-anniversaire-copains.jpg", legende: "Anniversaire entre copains", pos: "88% 60%" },
    { age: 7, src: "images/galerie/arthur-07-uppercut.jpg", legende: "Uppercut !", pos: "55% 45%" },
    { age: 7, src: "images/galerie/arthur-07-essayage-crampons.jpg", legende: "Choisir ses crampons", pos: "40% 55%" },
    { age: 7, src: "images/galerie/arthur-07-devant-le-blinde.jpg", legende: "Devant le blindé", pos: "12% 60%" },
    { age: 7, src: "images/galerie/arthur-07-soiree-deguisee.jpg", legende: "Soirée déguisée", pos: "35% 40%" },
    { age: 7, src: "images/galerie/arthur-07-la-perruque.jpg", legende: "La perruque", pos: "30% 50%" },
    { age: 7, src: "images/galerie/arthur-07-soiree-tele.jpg", legende: "Soirée télé", pos: "70% 35%" },
    { age: 7, src: "images/galerie/arthur-07-chorale.jpg", legende: "Concert de la chorale", pos: "62% 55%" },
    { age: 7, src: "images/galerie/arthur-07-moulin.jpg", legende: "Au pied du moulin", pos: "70% 60%" },
    { age: 7, src: "images/galerie/arthur-07-dodo-du-guerrier.jpg", legende: "Le repos du guerrier", pos: "45% 40%" },
    { age: 7, src: "images/galerie/arthur-07-selfie-casquette.jpg", legende: "Selfie casquette", pos: "30% 60%" },
    { age: 7, src: "images/galerie/arthur-07-echarpe-supporter.jpg", legende: "L'écharpe du supporter", pos: "45% 25%" },
    { age: 7, src: "images/galerie/arthur-07-bord-du-court.jpg", legende: "Pause au bord du court", pos: "25% 55%" },
    { age: 7, src: "images/galerie/arthur-07-vieux-piano.jpg", legende: "Concerto au vieux piano", pos: "40% 20%" },
    { age: 7, src: "images/galerie/arthur-07-calin-collectif.jpg", legende: "Câlin collectif", pos: "60% 45%" },
    { age: 7, src: "images/galerie/arthur-07-pouce-leve.jpg", legende: "Pouce levé dans la piscine", pos: "25% 70%" },
    { age: 7, src: "images/galerie/arthur-07-les-devoirs.jpg", legende: "L'heure des devoirs", pos: "50% 30%" },
    { age: 8, src: "images/galerie/arthur-08-tee-shirt-rouge.jpg", legende: "Sourire malicieux", pos: "50% 35%" },
    { age: 7, src: "images/galerie/arthur-07-canape-pyjama.jpg", legende: "En pyjama sur le canapé", pos: "60% 40%" },
    { age: 7, src: "images/galerie/arthur-07-gateau-entre-cousins.jpg", legende: "Moustaches de chantilly", pos: "85% 50%" },
    { age: 7, src: "images/galerie/arthur-07-tee-shirt-new-york.jpg", legende: "Tee-shirt New York", pos: "40% 25%" },
    { age: 7, src: "images/galerie/arthur-07-en-route.jpg", legende: "En route !", pos: "50% 45%" },
    { age: 7, src: "images/galerie/arthur-07-lecon-de-tennis.jpg", legende: "Leçon de tennis en famille", pos: "35% 50%" },
    { age: 7, src: "images/galerie/arthur-07-capuche.jpg", legende: "Sous la capuche", pos: "50% 45%" },
    { age: 7, src: "images/galerie/arthur-07-les-homards.jpg", legende: "La pêche aux homards", pos: "15% 55%" },
    { age: 7, src: "images/galerie/arthur-07-poneys.jpg", legende: "Avec les poneys", pos: "75% 60%" },
    { age: 7, src: "images/galerie/arthur-07-calin-papa.jpg", legende: "Câlin avec papa", pos: "35% 60%" },
    { age: 17, src: "images/galerie/arthur-17-sieste-canape.jpg", legende: "Sieste réglementaire", pos: "60% 35%" },
    { age: 18, src: "", legende: "La majorité : photo du 20 décembre !" },
  ],

  // ---------- MESSAGES POUR ARTHUR (famille, amis…) ----------
  messages: [
    { auteur: "La famille", texte: "Joyeux anniversaire champion ! 18 ans, et toujours le plus beau but de notre vie. ❤️" },
    { auteur: "Les potes du foot", texte: "Majeur, vacciné, et toujours pas capable de faire une passe 😂 On t'aime frérot." },
    { auteur: "Le club de tennis", texte: "Que ton année soit pleine d'aces et sans double faute !" },
  ],

  // ---------- LE BILLET DE MATCH (au-dessus de la zone à gratter) ----------
  billet: {
    saison: "Saison 2026 - 2027",
    date: "20/12/2026 21:00",
    competition: "Ligue 1 · Journée 16",
    domicile: "PARIS",
    exterieur: "MARSEILLE",
    titulaire: "ARTHUR",
    mention: "INVITÉ D'HONNEUR",
    tarif: "TARIF MAJEUR",
    acces: "018",
    rang: "20",
    siege: "12",
  },

  // ---------- LA CARTE À GRATTER ----------
  // ⚠️ À compléter : ce qu'Arthur découvre en grattant (son cadeau, une sortie, un indice…)
  cadeau: {
    titre: "Ton cadeau",
    texte: "Une surprise t'attend… (texte à compléter)",
  },

  // ---------- LE CASIER N°18 ----------
  // verrouille: true  → fermé à clé jusqu'au 20/12/2026 (test possible avec ?jourj dans l'adresse)
  // verrouille: false → ouvert dès maintenant (réglage actuel, à remettre sur true plus tard)
  casier: {
    verrouille: false,
    titre: "Bienvenue chez les majeurs.",
    texte: "Ce message t'attendait depuis longtemps. (texte secret à compléter)",
  },
};
