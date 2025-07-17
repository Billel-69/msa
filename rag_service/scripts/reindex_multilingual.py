"""
Script de réindexation avec modèle multilingue pour les documents français.
"""
import os
os.environ["ANONYMIZED_TELEMETRY"] = "FALSE"
import argparse
import logging
from pathlib import Path

import fitz  # PyMuPDF
import torch
from langchain.text_splitter import TokenTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain_ollama import OllamaEmbeddings
from tqdm import tqdm

# Configuration logging
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("reindex")

def extract_text_from_pdf(pdf_path: Path):
    """Extrait le texte d'un PDF page par page avec métadonnées."""
    logger.info(f"Extraction du texte de {pdf_path}")
    document_name = pdf_path.stem
    documents = []

    try:
        doc = fitz.open(pdf_path)
        for page_num, page in enumerate(doc):
            text = page.get_text()
            if text.strip():
                documents.append({
                    "text": text,
                    "metadata": {
                        "source": str(pdf_path),
                        "page": page_num + 1,
                        "document": document_name,
                    },
                })
        return documents
    except Exception as e:
        logger.error(f"Erreur d'extraction {pdf_path}: {e}")
        return []

def reindex_pdfs():
    # Paramètres
    pdf_dir = Path("data/pdfs")
    chroma_dir = Path("data/chroma_db")
    collection_name = "cours-multilingue"  # Nouvelle collection
    
    # Configuration améliorée
    config = {
        "chunk_size": 512,
        "chunk_overlap": 128,  # Augmenté pour une meilleure cohérence
        "embedding_model": "intfloat/multilingual-e5-small",  # Modèle multilingue
    }
    
    # Vérifier répertoires
    if not pdf_dir.exists():
        logger.error(f"Répertoire {pdf_dir} introuvable")
        return
    
    # Trouver les PDFs
    pdf_files = list(pdf_dir.glob("**/*.pdf"))
    if not pdf_files:
        logger.error("Aucun PDF trouvé")
        return
    
    # Extraction
    logger.info(f"📚 {len(pdf_files)} PDF à traiter")
    all_documents = []
    for pdf_file in tqdm(pdf_files, desc="Extraction des PDFs"):
        all_documents.extend(extract_text_from_pdf(pdf_file))
    
    if not all_documents:
        logger.error("Aucun texte extrait")
        return
    
    # Découpage
    logger.info(f"🔪 Découpage en chunks (taille: {config['chunk_size']}, chevauchement: {config['chunk_overlap']})")
    splitter = TokenTextSplitter(
        encoding_name="cl100k_base",
        chunk_size=config["chunk_size"],
        chunk_overlap=config["chunk_overlap"],
    )
    
    chunks, metadatas, ids = [], [], []
    for i, doc in enumerate(tqdm(all_documents, desc="Découpage")):
        for chunk in splitter.create_documents([doc["text"]], [doc["metadata"]]):
            chunks.append(chunk.page_content)
            metadatas.append(chunk.metadata)
            ids.append(f"doc_{i}_{len(ids)}")
    
    # Embeddings avec modèle multilingue via Ollama
    device = "cpu"
    logger.info(f"🧠 Embeddings via Ollama avec multilingual-e5-small")
    embeddings = OllamaEmbeddings(
        model="qllama/multilingual-e5-small"
    )
    
    # Indexation
    chroma_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"💾 Indexation de {len(chunks)} chunks dans {collection_name}")
    logger.info("[DEBUG] Début appel Chroma.from_texts ...")
    vect = Chroma.from_texts(
        chunks,
        embedding=embeddings,
        metadatas=metadatas,
        ids=ids,
        collection_name=collection_name,
        persist_directory=str(chroma_dir),
    )
    logger.info("[DEBUG] Fin appel Chroma.from_texts, début persist ...")
    vect.persist()
    logger.info("[DEBUG] Fin persist, indexation terminée.")
    logger.info(f"✅ {len(chunks)} chunks indexés dans {collection_name}")
    print('🎉 Indexation terminée avec succès !')

if __name__ == "__main__":
    reindex_pdfs() 