"""
Moteur RAG amélioré intégrant la taxonomie et l'extraction de points clés
"""
import logging
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import re

from src.rag.keyword_engine import KeywordRagEngine
from src.taxonomy.subjects_taxonomy import TAXONOMY, EDUCATION_LEVELS, get_subject_by_concept
from src.extraction.key_points_extractor import ProgramKeyPointsExtractor

logger = logging.getLogger(__name__)

class EnhancedRagEngine(KeywordRagEngine):
    """
    Version améliorée du moteur RAG avec:
    1. Taxonomie de matières et concepts
    2. Extraction avancée de points clés
    3. Recherche conceptuelle intelligente
    """
    
    def __init__(self):
        super().__init__()  # Initialiser le moteur de base
        self.extractor = None  # Initialisation paresseuse pour économiser de la mémoire
        logger.info("✅ Moteur RAG amélioré initialisé")
    
    def _get_extractor(self):
        """Initialisation paresseuse de l'extracteur de points clés"""
        if self.extractor is None:
            logger.info("Initialisation de l'extracteur de points clés")
            self.extractor = ProgramKeyPointsExtractor()
        return self.extractor
    
    def extract_educational_concepts(self, query: str) -> List[str]:
        """
        Extrait les concepts éducatifs à partir de la requête
        """
        query_lower = query.lower()
        concepts = []
        
        # Parcourir toutes les matières et sous-matières de la taxonomie
        for subject_name, subject_data in TAXONOMY.items():
            # Vérifier les concepts dans chaque sous-matière
            for subfield_name, subfield_data in subject_data["subfields"].items():
                for concept in subfield_data["concepts"]:
                    if concept in query_lower:
                        concepts.append(concept)
        
        return concepts
    
    def _extract_query_metadata(self, query: str) -> Dict:
        """
        Analyse avancée de la requête pour extraire:
        - Matière(s)
        - Sous-matière(s)
        - Niveau scolaire
        - Concepts éducatifs
        """
        query_lower = query.lower()
        extracted_info = {
            "subjects": [],
            "subfields": [],
            "levels": [],
            "concepts": self.extract_educational_concepts(query)
        }
        
        # Extraction de matières et sous-matières
        for subject_name, subject_data in TAXONOMY.items():
            # Vérifier les alias de matières
            for alias in subject_data["aliases"]:
                if alias in query_lower:
                    if subject_name not in extracted_info["subjects"]:
                        extracted_info["subjects"].append(subject_name)
            
            # Vérifier les sous-matières
            for subfield_name, subfield_data in subject_data["subfields"].items():
                for alias in subfield_data["aliases"]:
                    if alias in query_lower:
                        if subfield_name not in extracted_info["subfields"]:
                            extracted_info["subfields"].append(subfield_name)
                        # Ajouter aussi la matière parente si pas déjà fait
                        if subject_name not in extracted_info["subjects"]:
                            extracted_info["subjects"].append(subject_name)
        
        # Extraction de niveaux scolaires
        for level_name, level_data in EDUCATION_LEVELS.items():
            # Vérifier les alias de niveaux principaux
            for alias in level_data["aliases"]:
                if alias in query_lower:
                    extracted_info["levels"].append(level_name)
            
            # Vérifier les sous-niveaux
            for sublevel_name, sublevel_aliases in level_data["sub_levels"].items():
                for alias in sublevel_aliases:
                    if alias in query_lower:
                        extracted_info["levels"].append(sublevel_name)
        
        # Si des concepts ont été trouvés mais pas de matières, essayer de déduire les matières
        if not extracted_info["subjects"] and extracted_info["concepts"]:
            for concept in extracted_info["concepts"]:
                subject_info = get_subject_by_concept(concept)
                if subject_info and subject_info["subject"] not in extracted_info["subjects"]:
                    extracted_info["subjects"].append(subject_info["subject"])
                if subject_info and subject_info["subfield"] and subject_info["subfield"] not in extracted_info["subfields"]:
                    extracted_info["subfields"].append(subject_info["subfield"])
        
        # Extraction de mots-clés supplémentaires
        stopwords = ["le", "la", "les", "un", "une", "des", "ce", "ces", "est", "sont", "quels", "quelles"]
        words = re.findall(r'\b\w+\b', query_lower)
        extracted_info["keywords"] = [word for word in words if len(word) > 2 and word not in stopwords]
        
        logger.info(f"Analyse de la requête: {extracted_info}")
        return extracted_info
    
    def search(self, query: str) -> List[Tuple[Dict, float]]:
        """
        Recherche améliorée avec taxonomie et concepts
        """
        # Extraire les métadonnées de la requête
        query_info = self._extract_query_metadata(query)
        logger.info(f"Recherche conceptuelle - Matières: {query_info['subjects']}, Niveaux: {query_info['levels']}")
        
        documents = []
        
        # Stratégie 1: Utiliser la recherche par mot-clé du moteur original si matière et niveau sont détectés
        if query_info["subjects"] and query_info["levels"]:
            subject = query_info["subjects"][0]
            level = query_info["levels"][0]
            pattern = f"{subject}_{level}"
            logger.info(f"Recherche par pattern: {pattern}")
            
            # Appeler la méthode de recherche du moteur parent
            # Note: Nous utilisons la méthode search du parent, mais avec notre pattern généré
            parent_docs = super().search(pattern)
            
            if parent_docs:
                logger.info(f"✅ {len(parent_docs)} documents trouvés par recherche exacte")
                return parent_docs
        
        # Stratégie 2: Utiliser la recherche par matière seulement
        if query_info["subjects"] and not documents:
            subject = query_info["subjects"][0]
            logger.info(f"Recherche par matière: {subject}")
            
            # Appeler la méthode de recherche du moteur parent
            parent_docs = super().search(subject)
            
            if parent_docs:
                logger.info(f"✅ {len(parent_docs)} documents trouvés par recherche de matière")
                return parent_docs
        
        # Stratégie 3: Enrichir la requête avec les concepts détectés
        if query_info["concepts"]:
            # Construire une requête enrichie
            enhanced_query = " ".join(query_info["concepts"]) + " " + query
            logger.info(f"Requête enrichie avec concepts: {enhanced_query}")
            
            # Utiliser cette requête enrichie avec la méthode de recherche du parent
            parent_docs = super().search(enhanced_query)
            
            if parent_docs:
                logger.info(f"✅ {len(parent_docs)} documents trouvés par recherche conceptuelle")
                return parent_docs
        
        # Si aucune des stratégies précédentes n'a fonctionné, utiliser la recherche standard
        logger.info(f"Recherche standard avec la requête originale")
        return super().search(query)
    
    def _extract_key_points_if_needed(self, docs_with_scores):
        """Extrait les points clés du premier document trouvé"""
        if not docs_with_scores:
            return ""
            
        # Ne traiter que le premier document pour l'instant
        doc, _ = docs_with_scores[0]
        content = doc["page_content"]
        
        # Si le document est trop court, ne pas extraire les points clés
        if len(content) < 100:
            return ""
            
        # Extraire les points clés
        extractor = self._get_extractor()
        try:
            key_points = extractor.extract_key_points(content)
            return "\n\n📌 Points clés du programme:\n" + key_points
        except Exception as e:
            logger.warning(f"Erreur lors de l'extraction des points clés: {e}")
            return ""
    
    def generate_response(self, query: str, messages: List[Dict]) -> str:
        """
        Génère une réponse améliorée avec points clés extraits
        """
        # Recherche avec taxonomie et concepts
        docs_with_scores = self.search(query)
        
        # Format du contexte
        ctx = self._format_context_for_llm(docs_with_scores)
        
        # Enrichissement avec points clés (seulement pour les requêtes non triviales)
        if len(query.split()) > 3 and any(word in query.lower() for word in ["explique", "programme", "thème", "concept", "notion", "chapitre"]):
            key_points = self._extract_key_points_if_needed(docs_with_scores)
            if key_points:
                ctx += key_points
        
        # Historique du chat
        history = "\n\n".join(
            ("Élève: " if m["role"] == "user" else "SENS AI: ") + m["content"]
            for m in messages[:-1]
        )
        
        # Génération de la réponse avec le modèle
        return self.chain.run(question=query, context=ctx, chat_history=history)


def create_enhanced_rag_engine():
    """Crée une instance du moteur RAG amélioré"""
    return EnhancedRagEngine()