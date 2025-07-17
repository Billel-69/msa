"""
Micro-service FastAPI pour SENSAI RAG
------------------------------------

POST /generate
  body : {
    "question": "Texte de l'élève",
    "history": [
      {"role": "user", "content": "..."},
      {"role": "assistant", "content": "..."}
    ]
  }

Retour : { "answer": "Réponse SENSAI" }
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

# — 1. Charger ton moteur RAG -------------------------------------------------
from src.rag.enhanced_engine import create_enhanced_rag_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("sensai-rag")

logger.info("🚀 Initialisation du moteur RAG…")
engine = create_enhanced_rag_engine()
logger.info("✅ Moteur prêt")

# — 2. FastAPI app ------------------------------------------------------------
app = FastAPI(title="SENSAI-RAG", version="0.1")

# Autorise les appels depuis le front React en localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str
    history: list[dict] = []

@app.post("/generate")
def generate(query: Query):
    try:
        answer = engine.generate_response(query.question, query.history)
        return {"answer": answer}
    except Exception as e:
        logger.exception("Erreur génération")
        raise HTTPException(status_code=500, detail=str(e))

# — 3. Point d'entrée (python main.py) ---------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9100) 