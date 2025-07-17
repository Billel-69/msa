"""
Taxonomie hiérarchique des matières scolaires et leurs concepts
"""

TAXONOMY = {
    "maths": {
        "aliases": ["mathématiques", "math", "maths"],
        "subfields": {
            "algèbre": {
                "concepts": ["équation", "inéquation", "fonction", "polynôme"],
                "aliases": ["algèbre", "algebra"]
            },
            "géométrie": {
                "concepts": ["triangle", "cercle", "théorème", "pythagor", "thalès"],
                "aliases": ["géométrie", "geometry", "géométrique"]
            },
            "analyse": {
                "concepts": ["limite", "dérivée", "intégrale", "continuité", "suite"],
                "aliases": ["analyse", "calcul", "analysis"]
            },
            "probabilités": {
                "concepts": ["probabilité", "aléatoire", "statistique", "espérance", "variance"],
                "aliases": ["proba", "stats", "probabilités", "statistiques"]
            }
        },
        "niveaux_spécifiques": {
            "6ème": ["nombres et calculs", "espace et géométrie", "grandeurs et mesures", "gestion de données"],
            "5ème": ["nombres et calculs", "organisation et gestion de données", "géométrie plane", "proportionnalité"],
            "4ème": ["nombres et calculs", "calcul littéral", "transformations géométriques", "statistiques"],
            "3ème": ["calcul numérique et littéral", "fonctions", "géométrie dans l'espace", "statistiques et probabilités"],
            "Seconde": ["fonctions", "géométrie", "statistiques et probabilités", "vecteurs"],
            "Première_Spé": ["algèbre", "analyse", "géométrie", "probabilités et statistiques"],
            "Terminale_Spé": ["algèbre et géométrie", "analyse", "probabilités", "algorithmes"]
        }
    },
    # ... (le reste de la taxonomie comme fourni par l'utilisateur)
}

# Niveaux scolaires et leurs équivalents
EDUCATION_LEVELS = {
    "primaire": {
        "aliases": ["primaire", "école primaire", "elementary"],
        "sub_levels": {
            "CP": ["cp", "cours préparatoire"],
            "CE1": ["ce1", "cours élémentaire 1"],
            "CE2": ["ce2", "cours élémentaire 2"],
            "CM1": ["cm1", "cours moyen 1"],
            "CM2": ["cm2", "cours moyen 2"]
        }
    },
    "collège": {
        "aliases": ["collège", "college", "college"],
        "sub_levels": {
            "6ème": ["6ème", "6eme", "sixième", "sixieme"],
            "5ème": ["5ème", "5eme", "cinquième", "cinquieme"],
            "4ème": ["4ème", "4eme", "quatrième", "quatrieme"],
            "3ème": ["3ème", "3eme", "troisième", "troisieme"]
        }
    },
    "lycée": {
        "aliases": ["lycée", "lycee", "high school"],
        "sub_levels": {
            "Seconde": ["seconde", "2nde", "2de"],
            "Première": ["première", "1ère", "1ere", "premiere"],
            "Tle": ["terminale", "tle", "term"]
        },
        "spécialités": {
            "Mathématiques": ["spé-maths", "spécialité mathématiques"],
            "Physique-Chimie": ["spé-pc", "spécialité physique-chimie"],
            "SVT": ["spé-svt", "spécialité svt"],
            "SES": ["spé-ses", "spécialité ses"],
            "HLP": ["spé-hlp", "spécialité humanités, littérature et philosophie"],
            "HGGSP": ["spé-hggsp", "spécialité histoire-géographie, géopolitique et sciences politiques"]
        }
    }
}

# Fonction pour construire l'index inversé
def build_concept_index():
    """
    Construit un index inversé qui associe chaque concept et alias à sa matière et sous-matière
    """
    concept_index = {}
    
    # Parcourir toutes les matières
    for subject, subject_data in TAXONOMY.items():
        # Indexer les alias de matières
        for alias in subject_data["aliases"]:
            concept_index[alias] = {"subject": subject, "subfield": None}
        
        # Parcourir les sous-matières
        for subfield, subfield_data in subject_data["subfields"].items():
            # Indexer les alias de sous-matières
            for alias in subfield_data["aliases"]:
                concept_index[alias] = {"subject": subject, "subfield": subfield}
            
            # Indexer les concepts
            for concept in subfield_data["concepts"]:
                concept_index[concept] = {"subject": subject, "subfield": subfield}
    
    return concept_index

# Construction de l'index inversé des concepts
CONCEPT_INDEX = build_concept_index()

# Fonctions utilitaires
def get_subject_by_concept(concept_term):
    """
    Trouve la matière et sous-matière associées à un concept donné
    """
    # Convertir en minuscules pour la recherche
    concept_term_lower = concept_term.lower()
    
    # Recherche exacte
    if concept_term_lower in CONCEPT_INDEX:
        return CONCEPT_INDEX[concept_term_lower]
    
    # Recherche partielle
    for term, info in CONCEPT_INDEX.items():
        if concept_term_lower in term or term in concept_term_lower:
            return info
    
    # Aucune correspondance trouvée
    return None

def get_level_info(level_term):
    """
    Trouve le niveau scolaire correspondant à un terme donné
    """
    level_term_lower = level_term.lower()
    
    # Rechercher dans les niveaux et sous-niveaux
    for level, level_data in EDUCATION_LEVELS.items():
        # Vérifier les alias du niveau principal
        if level_term_lower in level_data["aliases"]:
            return {"level": level, "sub_level": None}
        
        # Vérifier les sous-niveaux
        for sub_level, sub_level_aliases in level_data["sub_levels"].items():
            if level_term_lower in sub_level_aliases:
                return {"level": level, "sub_level": sub_level}
    
    return None 