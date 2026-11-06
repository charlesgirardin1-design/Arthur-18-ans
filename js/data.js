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
  photoProfil: "",

  // ---------- CARTE JOUEUR ----------
  carte: {
    note: 99,
    poste: "ATT",
    club: "Paris",
    stats: [
      { label: "VIT", valeur: 92 }, // vitesse
      { label: "TIR", valeur: 88 }, // tir
      { label: "REV", valeur: 95 }, // revers (tennis)
      { label: "END", valeur: 90 }, // endurance
      { label: "PSG", valeur: 100 }, // amour du club
      { label: "FÊT", valeur: 99 }, // niveau de fête
    ],
    sports: ["Foot ⚽", "Tennis 🎾", "Multisport 🏅"],
  },

  // ---------- LA CARRIÈRE (frise chronologique) ----------
  // Ajoute / modifie librement. "photo" est optionnelle.
  carriere: [
    { annee: "2008", titre: "Le coup d'envoi", texte: "20 décembre 2008 : tu entres sur le terrain. Premier cri, premier transfert… vers les bras de tes parents.", photo: "" },
    { annee: "2010", titre: "Premiers dribbles", texte: "À peine debout, tu shootais déjà dans tout ce qui roule. Les meubles du salon s'en souviennent.", photo: "" },
    { annee: "2014", titre: "Signature en club", texte: "Ton premier maillot, tes premiers crampons, tes premiers buts (et tes premières glissades dans la boue).", photo: "" },
    { annee: "2016", titre: "La raquette entre en jeu", texte: "Tu découvres le tennis. Coup droit, revers, et une passion qui ne te lâchera plus.", photo: "" },
    { annee: "2020", titre: "L'athlète complet", texte: "Foot, tennis, et tous les sports qui passent : tu ne tiens pas en place.", photo: "" },
    { annee: "2026", titre: "18 ans — Statut de légende", texte: "20 décembre 2026 : ta majorité. Le meilleur reste à jouer.", photo: "" },
  ],

  // ---------- QUIZ (scoré comme au tennis : 15, 30, 40, JEU…) ----------
  // "bonne" = index de la bonne réponse (0 = première).
  quiz: [
    { q: "Quel est le club de cœur d'Arthur ?", choix: ["L'OM", "Le PSG", "Le Real Madrid", "L'équipe du quartier"], bonne: 1 },
    { q: "Quel jour est né Arthur ?", choix: ["Le 25 décembre", "Le 1er janvier", "Le 20 décembre", "Le 14 juillet"], bonne: 2 },
    { q: "Quel est le sport de raquette préféré d'Arthur ?", choix: ["Le badminton", "Le ping-pong", "Le padel", "Le tennis"], bonne: 3 },
    { q: "Quel est le signe astrologique d'Arthur ?", choix: ["Sagittaire", "Capricorne", "Scorpion", "Lion"], bonne: 0 },
    { q: "En quelle année Arthur est-il né ?", choix: ["2007", "2008", "2009", "2010"], bonne: 1 },
    { q: "Combien de bougies cette année ?", choix: ["17", "18", "19", "Trop pour les compter"], bonne: 1 },
  ],

  // ---------- GALERIE PHOTOS ----------
  // Dépose les photos dans images/galerie/ puis liste-les ici :
  // { src: "images/galerie/vacances.jpg", legende: "Été 2019" }
  photos: [],
  nbEmplacementsVides: 8, // nombre de cases "photo à venir" affichées tant qu'il n'y a pas de photos

  // ---------- MESSAGES POUR ARTHUR (famille, amis…) ----------
  messages: [
    { auteur: "La famille", texte: "Joyeux anniversaire champion ! 18 ans, et toujours le plus beau but de notre vie. ❤️" },
    { auteur: "Les potes du foot", texte: "Majeur, vacciné, et toujours pas capable de faire une passe 😂 On t'aime frérot." },
    { auteur: "Le club de tennis", texte: "Que ton année soit pleine d'aces et sans double faute !" },
      ],
};
