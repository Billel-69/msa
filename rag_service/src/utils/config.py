# %load src/utils/config.py
"""Configuration pour SENS AI Niveau 2."""
import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class RagConfig:
    """Configuration pour le système RAG."""
    pdf_dir: Path = Path("data/pdfs")
    collection_name: str = "cours-multilingue"
    chunk_size: int = 512
    chunk_overlap: int = 64
    # Modèle d'embedding puissant et multilingue (excellent pour le français)
    embedding_model: str = "intfloat/multilingual-e5-small"  # au lieu de paraphrase-multilingual-mpnet-base-v2
    retriever_type: str = "hybrid"
    top_k: int = 5
    reranking_enabled: bool = True  # Toujours activé!
    reranking_model: str = "BAAI/bge-reranker-base"  # Modèle accessible publiquement
    chroma_dir: Path = Path("data/chroma_db")


@dataclass
class ModelConfig:
    use_ollama: bool = True               # NEW
    ollama_url: str = "http://127.0.0.1:11434"
    model_name: str = "llama3.2:latest"        # identique au tag dans `ollama pull`
    temperature: float = 0.3
    max_tokens: int = 4096
    top_p: float = 0.9 

@dataclass
class ApiConfig:
    """Configuration de l'API."""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    log_level: str = "info"


@dataclass
class Config:
    """Configuration globale."""
    # Utiliser default_factory au lieu d'objets directs
    rag: RagConfig = field(default_factory=RagConfig)
    model: ModelConfig = field(default_factory=ModelConfig)
    api: ApiConfig = field(default_factory=ApiConfig)
    

config = Config() 