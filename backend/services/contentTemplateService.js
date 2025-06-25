const { GameContent } = require('../models/mongodb/GameModels');

class ContentTemplateService {
    constructor() {
        console.log('ContentTemplateService constructor called');
        this.templateContent = {
            flash_cards: {
                mathematics: {
                    facile: [
                        {
                            question: "Combien font 7 × 8 ?",
                            correctAnswer: "56",
                            explanation: "7 × 8 = 56. Tu peux compter: 7+7+7+7+7+7+7+7 = 56",
                            category: "Tables de multiplication",
                            tags: ["multiplication", "tables", "calcul"]
                        },
                        {
                            question: "Quelle est la moitié de 24 ?",
                            correctAnswer: "12",
                            explanation: "24 ÷ 2 = 12. La moitié c'est diviser par 2",
                            category: "Division",
                            tags: ["division", "moitié", "calcul"]
                        },
                        {
                            question: "Combien font 15 + 27 ?",
                            correctAnswer: "42",
                            explanation: "15 + 27 = 42. Tu peux décomposer: 15 + 20 + 7 = 35 + 7 = 42",
                            category: "Addition",
                            tags: ["addition", "calcul", "mental"]
                        },
                        {
                            question: "Combien font 6 × 9 ?",
                            correctAnswer: "54",
                            explanation: "6 × 9 = 54. Astuce: 6 × 10 = 60, donc 6 × 9 = 60 - 6 = 54",
                            category: "Tables de multiplication",
                            tags: ["multiplication", "tables", "calcul"]
                        },
                        {
                            question: "Quelle est la somme de 8 + 7 ?",
                            correctAnswer: "15",
                            explanation: "8 + 7 = 15. Tu peux faire 8 + 2 = 10, puis 10 + 5 = 15",
                            category: "Addition",
                            tags: ["addition", "calcul", "mental"]
                        },
                        {
                            question: "Combien font 20 - 13 ?",
                            correctAnswer: "7",
                            explanation: "20 - 13 = 7. Tu peux compter de 13 à 20 : 13, 14, 15, 16, 17, 18, 19, 20 = 7 nombres",
                            category: "Soustraction",
                            tags: ["soustraction", "calcul", "mental"]
                        },
                        {
                            question: "Quel est le double de 9 ?",
                            correctAnswer: "18",
                            explanation: "Le double de 9 = 9 × 2 = 18",
                            category: "Multiplication",
                            tags: ["double", "multiplication", "calcul"]
                        },
                        {
                            question: "Combien font 5 × 4 ?",
                            correctAnswer: "20",
                            explanation: "5 × 4 = 20. Tu peux faire 5 + 5 + 5 + 5 = 20",
                            category: "Tables de multiplication",
                            tags: ["multiplication", "tables", "calcul"]
                        },
                        {
                            question: "Quelle est la différence entre 17 et 9 ?",
                            correctAnswer: "8",
                            explanation: "17 - 9 = 8. Tu peux vérifier: 9 + 8 = 17",
                            category: "Soustraction",
                            tags: ["soustraction", "différence", "calcul"]
                        },
                        {
                            question: "Combien font 12 ÷ 3 ?",
                            correctAnswer: "4",
                            explanation: "12 ÷ 3 = 4. Car 3 × 4 = 12",
                            category: "Division",
                            tags: ["division", "tables", "calcul"]
                        }
                    ],
                    moyen: [
                        {
                            question: "Quelle est l'aire d'un rectangle de 5 cm × 8 cm ?",
                            correctAnswer: "40 cm²",
                            explanation: "Aire = longueur × largeur = 5 × 8 = 40 cm²",
                            category: "Géométrie",
                            tags: ["géométrie", "aire", "rectangle"]
                        },
                        {
                            question: "Combien font 144 ÷ 12 ?",
                            correctAnswer: "12",
                            explanation: "144 ÷ 12 = 12. Tu peux vérifier: 12 × 12 = 144",
                            category: "Division",
                            tags: ["division", "tables", "calcul"]
                        },
                        {
                            question: "Quel est le périmètre d'un carré de côté 6 cm ?",
                            correctAnswer: "24 cm",
                            explanation: "Périmètre du carré = 4 × côté = 4 × 6 = 24 cm",
                            category: "Géométrie",
                            tags: ["géométrie", "périmètre", "carré"]
                        },
                        {
                            question: "Combien font 15 × 6 ?",
                            correctAnswer: "90",
                            explanation: "15 × 6 = 90. Tu peux faire 15 × 6 = (10 × 6) + (5 × 6) = 60 + 30 = 90",
                            category: "Multiplication",
                            tags: ["multiplication", "calcul", "décomposition"]
                        },
                        {
                            question: "Quelle fraction représente 50% ?",
                            correctAnswer: "1/2",
                            explanation: "50% = 50/100 = 1/2 (en simplifiant par 50)",
                            category: "Fractions et pourcentages",
                            tags: ["fraction", "pourcentage", "simplification"]
                        },
                        {
                            question: "Combien y a-t-il de minutes dans 2 heures ?",
                            correctAnswer: "120 minutes",
                            explanation: "1 heure = 60 minutes, donc 2 heures = 2 × 60 = 120 minutes",
                            category: "Mesures de temps",
                            tags: ["temps", "minutes", "heures"]
                        },
                        {
                            question: "Quel est le résultat de 8² ?",
                            correctAnswer: "64",
                            explanation: "8² = 8 × 8 = 64",
                            category: "Puissances",
                            tags: ["puissance", "carré", "calcul"]
                        },
                        {
                            question: "Combien font 236 + 178 ?",
                            correctAnswer: "414",
                            explanation: "236 + 178 = 414. Pose l'addition en colonnes pour plus de sûreté",
                            category: "Addition",
                            tags: ["addition", "grands nombres", "calcul"]
                        }
                    ],
                    difficile: [
                        {
                            question: "Quelle est la racine carrée de 169 ?",
                            correctAnswer: "13",
                            explanation: "√169 = 13 car 13 × 13 = 169",
                            category: "Puissances et racines",
                            tags: ["racine", "carré", "puissance"]
                        },
                        {
                            question: "Résolvez: 3x + 7 = 22",
                            correctAnswer: "x = 5",
                            explanation: "3x + 7 = 22 → 3x = 22 - 7 → 3x = 15 → x = 15 ÷ 3 = 5",
                            category: "Équations",
                            tags: ["équation", "algèbre", "inconnue"]
                        },
                        {
                            question: "Quel est le volume d'un cube de côté 4 cm ?",
                            correctAnswer: "64 cm³",
                            explanation: "Volume du cube = côté³ = 4³ = 4 × 4 × 4 = 64 cm³",
                            category: "Géométrie dans l'espace",
                            tags: ["volume", "cube", "géométrie"]
                        },
                        {
                            question: "Quelle est la valeur de π (pi) arrondie à 2 décimales ?",
                            correctAnswer: "3,14",
                            explanation: "π ≈ 3,14159... donc arrondi à 2 décimales : 3,14",
                            category: "Nombres décimaux",
                            tags: ["pi", "décimales", "arrondi"]
                        },
                        {
                            question: "Combien font 2⁵ ?",
                            correctAnswer: "32",
                            explanation: "2⁵ = 2 × 2 × 2 × 2 × 2 = 32",
                            category: "Puissances",
                            tags: ["puissance", "exposant", "calcul"]
                        }
                    ]
                },
                french: {
                    facile: [
                        {
                            question: "Quel est le pluriel de 'cheval' ?",
                            correctAnswer: "chevaux",
                            explanation: "Cheval fait chevaux au pluriel (comme les mots en -al deviennent -aux)",
                            category: "Orthographe",
                            tags: ["orthographe", "pluriel", "grammaire"]
                        },
                        {
                            question: "Comment s'écrit le son [o] dans 'beau' ?",
                            correctAnswer: "eau",
                            explanation: "Le son [o] s'écrit 'eau' dans beau, eau, bateau...",
                            category: "Orthographe",
                            tags: ["orthographe", "sons", "phonétique"]
                        },
                        {
                            question: "Quel est le féminin de 'boulanger' ?",
                            correctAnswer: "boulangère",
                            explanation: "Boulanger → boulangère (on ajoute un 'e' et l'accent grave)",
                            category: "Grammaire",
                            tags: ["féminin", "métiers", "grammaire"]
                        },
                        {
                            question: "Comment écrit-on le nombre 'vingt' ?",
                            correctAnswer: "vingt",
                            explanation: "Le nombre 20 s'écrit V-I-N-G-T",
                            category: "Orthographe",
                            tags: ["nombres", "orthographe", "écriture"]
                        },
                        {
                            question: "Quel est le contraire de 'grand' ?",
                            correctAnswer: "petit",
                            explanation: "Le contraire (antonyme) de grand est petit",
                            category: "Vocabulaire",
                            tags: ["contraire", "antonyme", "vocabulaire"]
                        },
                        {
                            question: "Comment se termine un nom féminin qui finit par le son [té] ?",
                            correctAnswer: "-té",
                            explanation: "Les noms féminins en [té] s'écrivent -té (liberté, beauté, bonté...)",
                            category: "Orthographe",
                            tags: ["orthographe", "terminaison", "féminin"]
                        },
                        {
                            question: "Quel est le présent de 'je' avec le verbe 'être' ?",
                            correctAnswer: "je suis",
                            explanation: "Le verbe être au présent : je suis, tu es, il/elle est...",
                            category: "Conjugaison",
                            tags: ["être", "présent", "conjugaison"]
                        },
                        {
                            question: "Comment s'écrit le son [k] dans 'école' ?",
                            correctAnswer: "c",
                            explanation: "Dans école, le son [k] s'écrit avec la lettre 'c'",
                            category: "Orthographe",
                            tags: ["orthographe", "sons", "lettre c"]
                        }
                    ],
                    moyen: [
                        {
                            question: "Quel est le passé composé de 'je vais' ?",
                            correctAnswer: "je suis allé(e)",
                            explanation: "Le verbe aller se conjugue avec l'auxiliaire être au passé composé",
                            category: "Conjugaison",
                            tags: ["conjugaison", "passé composé", "verbe"]
                        },
                        {
                            question: "Accordez : 'Les filles que j'ai (voir)' ?",
                            correctAnswer: "vues",
                            explanation: "Les filles que j'ai vues. Le participe passé s'accorde avec le COD placé avant (que = les filles)",
                            category: "Accord du participe passé",
                            tags: ["accord", "participe passé", "COD"]
                        },
                        {
                            question: "Quel est le groupe du verbe 'finir' ?",
                            correctAnswer: "2ème groupe",
                            explanation: "Finir appartient au 2ème groupe (infinitif en -ir et participe présent en -issant)",
                            category: "Conjugaison",
                            tags: ["groupe", "verbe", "classification"]
                        },
                        {
                            question: "Comment s'écrit 'tout' dans 'elle est tout(e) contente' ?",
                            correctAnswer: "toute",
                            explanation: "Devant un adjectif féminin commençant par une consonne, 'tout' s'accorde : toute",
                            category: "Orthographe",
                            tags: ["tout", "accord", "adverbe"]
                        },
                        {
                            question: "Quel est le subjonctif présent de 'il faut que je (faire)' ?",
                            correctAnswer: "fasse",
                            explanation: "Il faut que je fasse. Le verbe faire au subjonctif : que je fasse, que tu fasses...",
                            category: "Conjugaison",
                            tags: ["subjonctif", "faire", "mode"]
                        }
                    ],
                    difficile: [
                        {
                            question: "Quelle figure de style y a-t-il dans 'Ses yeux sont des étoiles' ?",
                            correctAnswer: "une métaphore",
                            explanation: "C'est une métaphore car on compare directement les yeux à des étoiles sans 'comme'",
                            category: "Figures de style",
                            tags: ["métaphore", "comparaison", "poésie"]
                        },
                        {
                            question: "Quel est le passé simple de 'nous vinmes' ?",
                            correctAnswer: "venir",
                            explanation: "'Nous vinmes' est le passé simple du verbe venir",
                            category: "Conjugaison",
                            tags: ["passé simple", "venir", "temps"]
                        },
                        {
                            question: "Qu'est-ce qu'un alexandrin ?",
                            correctAnswer: "un vers de 12 syllabes",
                            explanation: "Un alexandrin est un vers de 12 syllabes, très utilisé en poésie classique",
                            category: "Versification",
                            tags: ["alexandrin", "vers", "syllabe", "poésie"]
                        },
                        {
                            question: "Que signifie l'expression 'avoir du pain sur la planche' ?",
                            correctAnswer: "avoir beaucoup de travail",
                            explanation: "Cette expression signifie avoir beaucoup de travail, beaucoup de choses à faire",
                            category: "Expressions",
                            tags: ["expression", "idiomatique", "sens figuré"]
                        }
                    ]
                },
                history: {
                    facile: [
                        {
                            question: "En quelle année a commencé la Révolution française ?",
                            correctAnswer: "1789",
                            explanation: "La Révolution française a commencé en 1789 avec la prise de la Bastille le 14 juillet",
                            category: "Révolution française",
                            tags: ["révolution", "1789", "histoire moderne"]
                        },
                        {
                            question: "Qui a découvert l'Amérique en 1492 ?",
                            correctAnswer: "Christophe Colomb",
                            explanation: "Christophe Colomb a découvert l'Amérique le 12 octobre 1492",
                            category: "Grandes découvertes",
                            tags: ["colomb", "amérique", "1492", "découverte"]
                        },
                        {
                            question: "Comment s'appelle la période avant l'invention de l'écriture ?",
                            correctAnswer: "la Préhistoire",
                            explanation: "La Préhistoire est la période avant l'invention de l'écriture (vers 3300 av. J.-C.)",
                            category: "Préhistoire",
                            tags: ["préhistoire", "écriture", "périodes"]
                        },
                        {
                            question: "Quel empereur français a été exilé à Sainte-Hélène ?",
                            correctAnswer: "Napoléon",
                            explanation: "Napoléon Bonaparte a été exilé sur l'île de Sainte-Hélène en 1815",
                            category: "Empire",
                            tags: ["napoléon", "exil", "sainte-hélène"]
                        },
                        {
                            question: "En quelle année l'homme a-t-il marché sur la Lune ?",
                            correctAnswer: "1969",
                            explanation: "Neil Armstrong a marché sur la Lune le 21 juillet 1969",
                            category: "Histoire contemporaine",
                            tags: ["lune", "armstrong", "1969", "espace"]
                        }
                    ],
                    moyen: [
                        {
                            question: "Qui était le roi de France pendant la Révolution ?",
                            correctAnswer: "Louis XVI",
                            explanation: "Louis XVI était roi de France de 1774 à 1792, guillotiné en 1793",
                            category: "Révolution française",
                            tags: ["louis XVI", "roi", "révolution"]
                        },
                        {
                            question: "Quelle guerre a duré de 1914 à 1918 ?",
                            correctAnswer: "la Première Guerre mondiale",
                            explanation: "La Première Guerre mondiale (ou Grande Guerre) a duré de 1914 à 1918",
                            category: "XXe siècle",
                            tags: ["guerre mondiale", "1914", "1918"]
                        },
                        {
                            question: "Qui a écrit la Déclaration d'Indépendance américaine ?",
                            correctAnswer: "Thomas Jefferson",
                            explanation: "Thomas Jefferson est le principal rédacteur de la Déclaration d'Indépendance (1776)",
                            category: "Histoire américaine",
                            tags: ["jefferson", "indépendance", "amérique"]
                        },
                        {
                            question: "Quel roi a construit le château de Versailles ?",
                            correctAnswer: "Louis XIV",
                            explanation: "Louis XIV (le Roi-Soleil) a fait construire et agrandir le château de Versailles",
                            category: "Monarchie absolue",
                            tags: ["louis XIV", "versailles", "roi-soleil"]
                        }
                    ],
                    difficile: [
                        {
                            question: "Quel traité a mis fin à la Première Guerre mondiale ?",
                            correctAnswer: "Le traité de Versailles",
                            explanation: "Le traité de Versailles (1919) a officiellement mis fin à la guerre entre l'Allemagne et les Alliés",
                            category: "Première Guerre mondiale",
                            tags: ["versailles", "traité", "1919"]
                        },
                        {
                            question: "Qui était Périclès ?",
                            correctAnswer: "un homme politique athénien",
                            explanation: "Périclès était un stratège et homme politique athénien du Ve siècle av. J.-C., symbole de la démocratie",
                            category: "Antiquité",
                            tags: ["périclès", "athènes", "démocratie", "grèce"]
                        },
                        {
                            question: "Quel événement marque le début de la guerre froide ?",
                            correctAnswer: "la doctrine Truman (1947)",
                            explanation: "La doctrine Truman (1947) marque le début officiel de la guerre froide entre les USA et l'URSS",
                            category: "Guerre froide",
                            tags: ["guerre froide", "truman", "1947", "urss"]
                        }
                    ]
                },
                sciences: {
                    facile: [
                        {
                            question: "Quelle est la formule chimique de l'eau ?",
                            correctAnswer: "H₂O",
                            explanation: "L'eau est composée de 2 atomes d'hydrogène (H) et 1 atome d'oxygène (O)",
                            category: "Chimie",
                            tags: ["chimie", "eau", "formule"]
                        },
                        {
                            question: "Quel organe pompe le sang dans le corps ?",
                            correctAnswer: "le cœur",
                            explanation: "Le cœur est le muscle qui pompe le sang dans tout le corps via les vaisseaux sanguins",
                            category: "Corps humain",
                            tags: ["cœur", "sang", "circulation"]
                        },
                        {
                            question: "Quelle planète est la plus proche du Soleil ?",
                            correctAnswer: "Mercure",
                            explanation: "Mercure est la planète la plus proche du Soleil dans notre système solaire",
                            category: "Astronomie",
                            tags: ["mercure", "soleil", "planète"]
                        },
                        {
                            question: "Combien de pattes a un insecte ?",
                            correctAnswer: "6",
                            explanation: "Tous les insectes ont 6 pattes (3 paires), c'est leur caractéristique principale",
                            category: "Biologie",
                            tags: ["insecte", "pattes", "anatomie"]
                        },
                        {
                            question: "Que produit un arbre grâce à la photosynthèse ?",
                            correctAnswer: "de l'oxygène",
                            explanation: "Les arbres produisent de l'oxygène grâce à la photosynthèse, en utilisant la lumière du soleil",
                            category: "Botanique",
                            tags: ["photosynthèse", "oxygène", "arbres"]
                        },
                        {
                            question: "Quel est l'état de l'eau à 0°C ?",
                            correctAnswer: "solide (glace)",
                            explanation: "À 0°C, l'eau se transforme en glace (état solide)",
                            category: "Physique",
                            tags: ["eau", "température", "états"]
                        }
                    ],
                    moyen: [
                        {
                            question: "Combien y a-t-il de planètes dans notre système solaire ?",
                            correctAnswer: "8",
                            explanation: "Il y a 8 planètes depuis que Pluton n'est plus considérée comme une planète (2006)",
                            category: "Astronomie",
                            tags: ["planètes", "système solaire", "astronomie"]
                        },
                        {
                            question: "Quel gaz les plantes absorbent-elles pour la photosynthèse ?",
                            correctAnswer: "le dioxyde de carbone (CO₂)",
                            explanation: "Les plantes absorbent le CO₂ et rejettent de l'oxygène lors de la photosynthèse",
                            category: "Botanique",
                            tags: ["co2", "photosynthèse", "plantes"]
                        },
                        {
                            question: "Quelle est la température d'ébullition de l'eau ?",
                            correctAnswer: "100°C",
                            explanation: "L'eau bout à 100°C au niveau de la mer (pression normale)",
                            category: "Physique",
                            tags: ["ébullition", "température", "eau"]
                        },
                        {
                            question: "Quel est l'organe de la digestion qui produit la bile ?",
                            correctAnswer: "le foie",
                            explanation: "Le foie produit la bile qui aide à digérer les graisses",
                            category: "Corps humain",
                            tags: ["foie", "bile", "digestion"]
                        },
                        {
                            question: "Comment s'appelle le changement d'état de liquide à gaz ?",
                            correctAnswer: "la vaporisation",
                            explanation: "La vaporisation est le passage de l'état liquide à l'état gazeux",
                            category: "Physique",
                            tags: ["vaporisation", "états", "physique"]
                        }
                    ],
                    difficile: [
                        {
                            question: "Quelle est la vitesse de la lumière dans le vide ?",
                            correctAnswer: "300 000 km/s",
                            explanation: "La vitesse de la lumière dans le vide est d'environ 299 792 458 m/s, soit ~300 000 km/s",
                            category: "Physique",
                            tags: ["lumière", "vitesse", "physique"]
                        },
                        {
                            question: "Quel scientifique a établi la théorie de l'évolution ?",
                            correctAnswer: "Charles Darwin",
                            explanation: "Charles Darwin a développé la théorie de l'évolution par sélection naturelle",
                            category: "Biologie",
                            tags: ["darwin", "évolution", "sélection naturelle"]
                        },
                        {
                            question: "Quelle particule subatomique a une charge positive ?",
                            correctAnswer: "le proton",
                            explanation: "Le proton est une particule du noyau atomique qui porte une charge électrique positive",
                            category: "Physique",
                            tags: ["proton", "atome", "charge positive"]
                        },
                        {
                            question: "Quel est le nom de la force qui maintient les planètes en orbite ?",
                            correctAnswer: "la gravitation",
                            explanation: "La gravitation (ou force gravitationnelle) maintient les planètes en orbite autour du Soleil",
                            category: "Physique",
                            tags: ["gravitation", "orbite", "force"]
                        }
                    ]
                },
                geography: {
                    facile: [
                        {
                            question: "Quelle est la capitale de la France ?",
                            correctAnswer: "Paris",
                            explanation: "Paris est la capitale et la plus grande ville de France",
                            category: "Capitales",
                            tags: ["capitale", "france", "paris"]
                        },
                        {
                            question: "Sur quel continent se trouve l'Égypte ?",
                            correctAnswer: "l'Afrique",
                            explanation: "L'Égypte se trouve au nord-est de l'Afrique",
                            category: "Continents",
                            tags: ["égypte", "afrique", "continent"]
                        },
                        {
                            question: "Quel est le plus grand océan du monde ?",
                            correctAnswer: "l'océan Pacifique",
                            explanation: "L'océan Pacifique couvre environ 1/3 de la surface de la Terre",
                            category: "Océans",
                            tags: ["pacifique", "océan", "plus grand"]
                        },
                        {
                            question: "Comment appelle-t-on une étendue d'eau entourée de terre ?",
                            correctAnswer: "un lac",
                            explanation: "Un lac est une étendue d'eau douce ou salée entourée de terres",
                            category: "Relief",
                            tags: ["lac", "eau", "géographie physique"]
                        },
                        {
                            question: "Quel fleuve traverse Paris ?",
                            correctAnswer: "la Seine",
                            explanation: "La Seine traverse Paris d'est en ouest",
                            category: "Fleuves de France",
                            tags: ["seine", "paris", "fleuve"]
                        }
                    ],
                    moyen: [
                        {
                            question: "Quelle est la capitale de l'Australie ?",
                            correctAnswer: "Canberra",
                            explanation: "Canberra est la capitale de l'Australie (et non Sydney ou Melbourne)",
                            category: "Capitales",
                            tags: ["canberra", "australie", "capitale"]
                        },
                        {
                            question: "Quel est le plus long fleuve du monde ?",
                            correctAnswer: "le Nil",
                            explanation: "Le Nil (6 650 km) est considéré comme le plus long fleuve du monde",
                            category: "Fleuves",
                            tags: ["nil", "fleuve", "plus long"]
                        },
                        {
                            question: "Dans quel pays se trouve le mont Everest ?",
                            correctAnswer: "le Népal",
                            explanation: "Le mont Everest se trouve à la frontière entre le Népal et le Tibet",
                            category: "Montagnes",
                            tags: ["everest", "népal", "montagne"]
                        },
                        {
                            question: "Combien y a-t-il de continents ?",
                            correctAnswer: "7",
                            explanation: "Il y a 7 continents : Afrique, Amérique du Nord, Amérique du Sud, Antarctique, Asie, Europe, Océanie",
                            category: "Continents",
                            tags: ["continents", "nombre", "géographie"]
                        }
                    ],
                    difficile: [
                        {
                            question: "Quelle est la capitale du Kazakhstan ?",
                            correctAnswer: "Nur-Sultan",
                            explanation: "Nur-Sultan (anciennement Astana) est la capitale du Kazakhstan depuis 1997",
                            category: "Capitales",
                            tags: ["nur-sultan", "kazakhstan", "capitale"]
                        },
                        {
                            question: "Quel détroit sépare l'Europe de l'Afrique ?",
                            correctAnswer: "le détroit de Gibraltar",
                            explanation: "Le détroit de Gibraltar sépare l'Espagne (Europe) du Maroc (Afrique)",
                            category: "Détroits",
                            tags: ["gibraltar", "détroit", "europe", "afrique"]
                        },
                        {
                            question: "Quel pays a le plus de fuseaux horaires ?",
                            correctAnswer: "la France",
                            explanation: "La France a 12 fuseaux horaires grâce à ses territoires d'outre-mer",
                            category: "Fuseaux horaires",
                            tags: ["france", "fuseaux horaires", "territoires"]
                        }
                    ]
                },
                english: {
                    facile: [
                        {
                            question: "Comment dit-on 'bonjour' en anglais ?",
                            correctAnswer: "hello",
                            explanation: "'Hello' est la traduction de 'bonjour' en anglais",
                            category: "Salutations",
                            tags: ["salutation", "bonjour", "hello"]
                        },
                        {
                            question: "Quel est le pluriel de 'cat' ?",
                            correctAnswer: "cats",
                            explanation: "Pour la plupart des noms en anglais, on ajoute 's' au pluriel : cat → cats",
                            category: "Pluriel",
                            tags: ["pluriel", "cat", "grammaire"]
                        },
                        {
                            question: "Comment dit-on 'rouge' en anglais ?",
                            correctAnswer: "red",
                            explanation: "'Red' signifie rouge en anglais",
                            category: "Couleurs",
                            tags: ["couleur", "rouge", "red"]
                        },
                        {
                            question: "Que signifie 'thank you' ?",
                            correctAnswer: "merci",
                            explanation: "'Thank you' signifie 'merci' en français",
                            category: "Politesse",
                            tags: ["politesse", "merci", "thank you"]
                        },
                        {
                            question: "Comment dit-on 'eau' en anglais ?",
                            correctAnswer: "water",
                            explanation: "'Water' signifie eau en anglais",
                            category: "Vocabulaire de base",
                            tags: ["eau", "water", "vocabulaire"]
                        }
                    ],
                    moyen: [
                        {
                            question: "Quel est le prétérit de 'go' ?",
                            correctAnswer: "went",
                            explanation: "Le prétérit du verbe 'go' est 'went' (verbe irrégulier)",
                            category: "Verbes irréguliers",
                            tags: ["prétérit", "go", "went", "verbe irrégulier"]
                        },
                        {
                            question: "Comment forme-t-on le present continuous ?",
                            correctAnswer: "be + verbe-ing",
                            explanation: "Le present continuous se forme avec BE + verbe-ING (ex: I am working)",
                            category: "Temps",
                            tags: ["present continuous", "be", "ing", "temps"]
                        },
                        {
                            question: "Que signifie 'comfortable' ?",
                            correctAnswer: "confortable",
                            explanation: "'Comfortable' signifie confortable, à l'aise",
                            category: "Adjectifs",
                            tags: ["comfortable", "confortable", "adjectif"]
                        }
                    ],
                    difficile: [
                        {
                            question: "Quel est le participe passé de 'write' ?",
                            correctAnswer: "written",
                            explanation: "Le participe passé de 'write' est 'written' (write-wrote-written)",
                            category: "Verbes irréguliers",
                            tags: ["participe passé", "write", "written", "verbe irrégulier"]
                        },
                        {
                            question: "Que signifie l'expression 'break a leg' ?",
                            correctAnswer: "bonne chance",
                            explanation: "'Break a leg' est une expression qui signifie 'bonne chance' (ironie)",
                            category: "Expressions",
                            tags: ["expression", "break a leg", "bonne chance", "idiome"]
                        }
                    ]
                }
            }
        };
    }

    async initializeTemplateContent() {
        try {
            console.log('Initializing template content in MongoDB...');
            
            // Check if content already exists
            const existingCount = await GameContent.countDocuments({ 'metadata.isTemplate': true });
            if (existingCount > 0) {
                console.log(`Template content already exists (${existingCount} items)`);
                return;
            }

            // Insert template content
            const contentToInsert = [];
            
            for (const [gameType, subjects] of Object.entries(this.templateContent)) {
                for (const [subject, difficulties] of Object.entries(subjects)) {
                    for (const [difficulty, questions] of Object.entries(difficulties)) {
                        questions.forEach((questionData, index) => {
                            contentToInsert.push({
                                gameId: `template_${gameType}_${subject}_${difficulty}_${index}`,
                                gameType: gameType,
                                contentType: 'question',
                                subject: subject,
                                difficulty: difficulty,
                                cycle: 'cycle_4', // Default cycle
                                theme: 'default',
                                content: {
                                    question: questionData.question,
                                    correctAnswer: questionData.correctAnswer,
                                    explanation: questionData.explanation,
                                    category: questionData.category
                                },
                                tags: questionData.tags,
                                metadata: {
                                    isTemplate: true,
                                    isAIGenerated: false,
                                    validatedBy: 'system'
                                }
                            });
                        });
                    }
                }
            }

            await GameContent.insertMany(contentToInsert);
            console.log(`Inserted ${contentToInsert.length} template content items`);
            
        } catch (error) {
            console.error('Error initializing template content:', error);
        }
    }    async getContentForGame(gameType, subject, difficulty, cycle = 'cycle_4', quantity = 10) {
        console.log('getContentForGame called with:', {gameType, subject, difficulty, cycle, quantity});
        
        try {
            console.log('Attempting DB query for content...');
            
            // First try to get template content
            const templateContent = await GameContent.find({
                gameType: gameType,
                subject: subject,
                difficulty: difficulty,
                'metadata.isTemplate': true
            }).limit(quantity);
            
            console.log(`DB query returned ${templateContent.length} items`);
            
            if (templateContent.length >= quantity) {
                // Update usage count
                await this.incrementUsageCount(templateContent.map(c => c._id));
                return templateContent;
            }
            
            console.log('Not enough content from DB, getting additional content...');

            // If not enough template content, pad with random content from same subject
            const additionalContent = await GameContent.find({
                gameType: gameType,
                subject: subject,
                'metadata.isTemplate': true
            }).limit(quantity - templateContent.length);
            
            console.log(`Additional query returned ${additionalContent.length} items`);

            const allContent = [...templateContent, ...additionalContent];
            
            if (allContent.length === 0) {
                console.log('No content found in DB, using fallback');
                return this.getFallbackContent(gameType, subject, difficulty, quantity);
            }
            
            // Shuffle the content
            for (let i = allContent.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allContent[i], allContent[j]] = [allContent[j], allContent[i]];
            }

            await this.incrementUsageCount(allContent.map(c => c._id));
            return allContent;

        } catch (error) {
            console.error('Error getting content for game:', error);
            // Return fallback content
            console.log('Error occurred, using fallback content');
            return this.getFallbackContent(gameType, subject, difficulty, quantity);
        }
    }    getFallbackContent(gameType, subject, difficulty, quantity = 10) {
        console.log('Using fallback content for:', {gameType, subject, difficulty});
        console.log('Template availability check:', {
            hasGameType: !!this.templateContent[gameType],
            hasSubject: !!(this.templateContent[gameType] && this.templateContent[gameType][subject]),
            hasDifficulty: !!(this.templateContent[gameType] && this.templateContent[gameType][subject] && this.templateContent[gameType][subject][difficulty])
        });
        console.log('Available subjects:', this.templateContent[gameType] ? Object.keys(this.templateContent[gameType]) : 'none');
        console.log('Available difficulties:', this.templateContent[gameType] && this.templateContent[gameType][subject] ? Object.keys(this.templateContent[gameType][subject]) : 'none');
        
        // Use in-memory template content if available
        if (this.templateContent[gameType] && 
            this.templateContent[gameType][subject] && 
            this.templateContent[gameType][subject][difficulty]) {
            
            const availableContent = this.templateContent[gameType][subject][difficulty];
            console.log(`Found ${availableContent.length} template items for ${subject}/${difficulty}`);
            
            // Return random selection if we have more than needed
            if (availableContent.length > quantity) {
                // Shuffle and select
                const shuffled = [...availableContent].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, quantity);
                
                // Format as expected by the controller
                return selected.map(item => ({
                    _id: `template_${Math.random().toString(36).substring(2, 9)}`,
                    content: item,
                    difficulty: difficulty,
                    subject: subject,
                    metadata: { isTemplate: true }
                }));
            }
            
            // If we have fewer than needed, use all and possibly duplicate
            return Array(quantity).fill(null).map((_, index) => {
                const templateItem = availableContent[index % availableContent.length];
                return {
                    _id: `template_${Math.random().toString(36).substring(2, 9)}`,
                    content: templateItem,
                    difficulty: difficulty,
                    subject: subject,
                    metadata: { isTemplate: true }
                };
            });
        }
        
        // Absolute last resort fallback
        console.log('No template content found, using generic fallback');
        const fallbackQuestions = [
            {
                content: {
                    question: "Question de révision sur " + subject,
                    correctAnswer: "Réponse correcte",
                    explanation: "Explication de base pour cette question de " + subject,
                    category: "Révision générale"
                },
                difficulty: difficulty,
                subject: subject
            }
        ];

        return Array(quantity).fill(null).map((_, index) => ({
            ...fallbackQuestions[0],
            _id: `fallback_${index}`,
            gameId: `fallback_${gameType}_${subject}_${index}`
        }));
    }

    async incrementUsageCount(contentIds) {
        try {
            await GameContent.updateMany(
                { _id: { $in: contentIds } },
                { $inc: { 'metadata.usageCount': 1 } }
            );
        } catch (error) {
            console.error('Error incrementing usage count:', error);
        }
    }

    async updateContentPerformance(contentId, isCorrect, responseTime) {
        try {
            const content = await GameContent.findById(contentId);
            if (!content) return;

            const currentPerf = content.metadata.avgPerformance || 0;
            const currentCount = content.metadata.usageCount || 1;
            
            // Simple performance calculation: correct answers weighted by response time
            const performanceScore = isCorrect ? Math.max(0, 100 - (responseTime / 100)) : 0;
            const newPerformance = ((currentPerf * (currentCount - 1)) + performanceScore) / currentCount;

            await GameContent.findByIdAndUpdate(contentId, {
                'metadata.avgPerformance': newPerformance,
                'metadata.lastUpdated': new Date()
            });

        } catch (error) {
            console.error('Error updating content performance:', error);
        }
    }

    // AI Integration placeholder methods
    async requestAIContent(gameType, subject, difficulty, cycle, quantity = 10) {
        // TODO: This will be implemented by your AI engineer
        console.log('AI content request:', { gameType, subject, difficulty, cycle, quantity });
        
        // For now, return template content
        return this.getContentForGame(gameType, subject, difficulty, cycle, quantity);
    }

    async validateAIContent(content) {
        // TODO: Implement AI content validation
        return {
            isValid: true,
            qualityScore: 85,
            suggestions: []
        };
    }
}

module.exports = ContentTemplateService;
