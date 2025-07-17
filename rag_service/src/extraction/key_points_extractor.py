

"""
Module d'extraction automatique des points clés des programmes scolaires
"""
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import json
import os

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_community.llms import HuggingFacePipeline
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline, BitsAndBytesConfig
import torch

from src.utils.config import config


logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """
<|system|>
Tu es un expert en pédagogie spécialisé dans l'analyse et la structuration de programmes scolaires. Ta mission est d'extraire les points clés d'un programme officiel de l'Education Nationale.

INSTRUCTIONS:
1. Analyse le document fourni qui contient un programme scolaire officiel.
2. Identifie et extrais:
   - Les objectifs généraux du programme
   - Les thèmes ou chapitres principaux
   - Les notions essentielles à maîtriser
   - Les compétences à développer
   - Les méthodes d'évaluation mentionnées

IMPORTANT:
- Sois précis et fidèle au document original
- Structure ta réponse en sections claires
- N'invente pas de contenu qui n'est pas dans le document
- Garde les formulations officielles pour les compétences et objectifs

<|user|>
Voici un extrait de programme scolaire à analyser :

{document_content}

Extrais et structure les points clés de ce programme.

<|assistant|>
"""

class ProgramKeyPointsExtractor:
    def __init__(self):
        self.llm = None
        self.chain = None
        self.initialize_llm()
        
    def initialize_llm(self):
        """Initialise le modèle de langage pour l'extraction"""
        logger.info("Initialisation du modèle d'extraction de points clés")
        
        # Configuration de la quantification pour économiser la mémoire
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=config.model.load_in_4bit,
            bnb_4bit_use_double_quant=config.model.bnb_4bit_use_double_quant,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4"
        )
        
        # Chargement du modèle LLM
        tokenizer = AutoTokenizer.from_pretrained(config.model.model_name)
        model = AutoModelForCausalLM.from_pretrained(
            config.model.model_name,
            quantization_config=quantization_config,
            device_map=config.model.device_map,
            torch_dtype=torch.float16,
        )
        
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=2048,  # Plus long pour des analyses détaillées
            temperature=0.3,      # Plus faible pour plus de précision
            top_p=0.9,
            repetition_penalty=1.1,
            do_sample=True,
        )
        
        self.llm = HuggingFacePipeline(pipeline=pipe)
        
        # Configuration de la chaîne LLM
        prompt = PromptTemplate(
            template=EXTRACTION_PROMPT,
            input_variables=["document_content"],
        )
        self.chain = LLMChain(llm=self.llm, prompt=prompt)
        logger.info("✅ Modèle d'extraction initialisé")
    
    def extract_key_points(self, document_content: str) -> str:
        """
        Extrait les points clés d'un document de programme scolaire
        
        Args:
            document_content: Le contenu du document à analyser
            
        Returns:
            Une analyse structurée des points clés du programme
        """
        logger.info(f"Extraction des points clés d'un document de {len(document_content)} caractères")
        
        # Limiter la taille du document si nécessaire
        if len(document_content) > 6000:
            logger.warning(f"Document tronqué de {len(document_content)} à 6000 caractères")
            document_content = document_content[:6000] + "..."
        
        # Générer l'analyse
        result = self.chain.run(document_content=document_content)
        
        logger.info("✅ Extraction terminée")
        return result
        
    def extract_and_save(self, document_path: str, output_dir: str = "data/extracted_key_points"):
        """
        Extrait les points clés d'un fichier et les sauvegarde
        
        Args:
            document_path: Chemin vers le document à analyser
            output_dir: Répertoire où sauvegarder les résultats
        """
        # Créer le répertoire de sortie s'il n'existe pas
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        # Lire le document
        with open(document_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extraire les points clés
        key_points = self.extract_key_points(content)
        
        # Sauvegarder les résultats
        output_filename = Path(document_path).stem + "_key_points.md"
        output_path = os.path.join(output_dir, output_filename)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(key_points)
            
        logger.info(f"Points clés sauvegardés dans {output_path}")
        return output_path
