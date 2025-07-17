"""
Moteur RAG avec recherche prioritaire par mots-clés
"""
import logging, re
from typing import Dict, List, Tuple
from pathlib import Path

from langchain_community.llms import Ollama, HuggingFacePipeline
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    pipeline,
)
import torch
import chromadb

from src.utils.config import config


RAG_PROMPT = """
<|system|>
Tu es SENS AI, un assistant pédagogique intelligent qui aide les élèves à comprendre leurs cours. Tu agis comme un professeur spécialisé dans toutes les matières du collège à la terminale.
Tu es doté d'un système RAG avec dans cette base de vecteurs les programmes et B.O officiels.

INSTRUCTIONS IMPORTANTES:
1. Utilise les extraits de documents ci-dessous pour répondre à la question de l'élève de façon précise et complète.
2. Si les documents contiennent une liste, une énumération ou des thèmes, reproduis fidèlement cette structure dans ta réponse.
3. Si la réponse ne se trouve pas dans les documents fournis, indique-le clairement à l'élève.
4. Ne pas inventer de contenu qui ne serait pas présent dans les documents.

<|user|>
Contexte de l'élève:
{chat_history}

Documents pertinents:
{context}

Question de l'élève: {question}

<|assistant|>
"""


logger = logging.getLogger(__name__)


class KeywordRagEngine:
    def __init__(self):
        self.llm = None
        self.chain = None
        self.vector_store = None
        self.chromadb_client = None
        self.collection = None
        self.initialize()

    # --------------------------------------------------------------------- #
    # INITIALISATION
    # --------------------------------------------------------------------- #
    def initialize(self):
        logger.info("Initialisation du moteur RAG (Ollama ou HuggingFace)")

        # ────────────────────────────────────────────────────────────────────
        # 1) CHARGER LE LLM -------------------------------------------------
        # ────────────────────────────────────────────────────────────────────
        if getattr(config.model, "use_ollama", False):
            # LLM local via Ollama
            self.llm = Ollama(
                model=config.model.model_name,
                base_url=getattr(config.model, "ollama_url", "http://127.0.0.1:11434"),
                temperature=config.model.temperature,
                top_p=config.model.top_p,
                num_ctx=config.model.max_tokens,
            )
        else:
            # Fallback HuggingFace (4-bit)
            q_cfg = BitsAndBytesConfig(
                load_in_4bit=getattr(config.model, "load_in_4bit", True),
                bnb_4bit_use_double_quant=getattr(
                    config.model, "bnb_4bit_use_double_quant", True
                ),
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
            )

            tokenizer = AutoTokenizer.from_pretrained(config.model.model_name)
            model = AutoModelForCausalLM.from_pretrained(
                config.model.model_name,
                quantization_config=q_cfg,
                device_map=getattr(config.model, "device_map", "auto"),
                torch_dtype=torch.float16,
            )
            pipe = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                max_new_tokens=config.model.max_tokens,
                temperature=config.model.temperature,
                top_p=config.model.top_p,
                repetition_penalty=1.1,
                do_sample=True,
            )
            self.llm = HuggingFacePipeline(pipeline=pipe)

        # ────────────────────────────────────────────────────────────────────
        # 2) VECTOR-STORE & EMBEDDINGS --------------------------------------
        # ────────────────────────────────────────────────────────────────────
        embeddings = HuggingFaceEmbeddings(
            model_name=config.rag.embedding_model,
            model_kwargs={"device": "cpu"},
        )

        self.vector_store = Chroma(
            collection_name=config.rag.collection_name,
            embedding_function=embeddings,
            persist_directory=str(config.rag.chroma_dir),
        )

        self.chromadb_client = chromadb.PersistentClient(
            path=str(config.rag.chroma_dir)
        )
        self.collection = self.chromadb_client.get_collection(
            config.rag.collection_name
        )

        # ────────────────────────────────────────────────────────────────────
        # 3) CHAÎNE LLM ------------------------------------------------------
        # ────────────────────────────────────────────────────────────────────
        prompt = PromptTemplate(
            template=RAG_PROMPT,
            input_variables=["chat_history", "context", "question"],
        )
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            input_key="question",
        )
        self.chain = LLMChain(llm=self.llm, prompt=prompt, memory=memory)
        logger.info("✅ Moteur RAG prêt")

    # --------------------------------------------------------------------- #
    # UTILITAIRES DE RECHERCHE
    # --------------------------------------------------------------------- #
    def _extract_keywords(self, query: str) -> Tuple[str, str, List[str]]:
        """Extrait matière, niveau et mots-clés"""
        query_lower = query.lower()

        subjects = {
            "HGGSP": ["hggsp", "histoire-géo", "géopolitique", "sciences politiques", "histoire géographie"],
            "maths": ["math", "maths", "mathématiques", "géométrie", "algèbre"],
            "français": ["français", "francais", "littérature", "grammaire"],
            "SVT": ["svt", "sciences de la vie", "biologie", "géologie"],
            "physique-chimie": ["physique", "chimie", "pc", "sciences physiques"],
            "philosophie": ["philo", "philosophie"],
            "SES": ["ses", "sciences économiques", "économie", "sociologie"],
            "HLP": ["hlp", "humanités", "littérature et philosophie"],
        }

        levels = {
            "Tle": ["terminale", "tle", "term"],
            "Première": ["première", "1ère", "1ere", "premiere"],
            "Seconde": ["seconde", "2nde", "2de"],
            "3ème": ["3ème", "3eme", "troisième", "troisieme"],
            "4ème": ["4ème", "4eme", "quatrième", "quatrieme"],
            "5ème": ["5ème", "5eme", "cinquième", "cinquieme"],
            "6ème": ["6ème", "6eme", "sixième", "sixieme"],
        }

        detected_subject = next(
            (s for s, kw in subjects.items() if any(k in query_lower for k in kw)), None
        )
        detected_level = next(
            (l for l, kw in levels.items() if any(k in query_lower for k in kw)), None
        )

        stopwords = {"le", "la", "les", "un", "une", "des", "ce", "ces", "est", "sont", "quels", "quelles"}
        words = re.findall(r"\b\w+\b", query_lower)
        additional_keywords = [w for w in words if len(w) > 2 and w not in stopwords]

        return detected_subject, detected_level, additional_keywords

    def _find_documents_by_keyword(self, keyword: str):
        """Recherche directe via ChromaDB"""
        try:
            all_docs = self.collection.get()
            filtered = {"ids": [], "documents": [], "metadatas": []}
            for i, (doc, meta) in enumerate(zip(all_docs["documents"], all_docs["metadatas"])):
                if keyword.lower() in meta.get("source", "").lower() and len(filtered["ids"]) < config.rag.top_k:
                    filtered["ids"].append(all_docs["ids"][i])
                    filtered["documents"].append(doc)
                    filtered["metadatas"].append(meta)
            return filtered
        except Exception as e:
            logger.warning(f"Recherche par mot-clé impossible : {e}")
            return {"ids": [], "documents": [], "metadatas": []}

    # --------------------------------------------------------------------- #
    # PIPELINE DE RECHERCHE
    # --------------------------------------------------------------------- #
    def search(self, query: str) -> List[Tuple[Dict, float]]:
        subject, level, _ = self._extract_keywords(query)

        # 1) pattern sujet_niveau
        if subject and level:
            docs = self._find_documents_by_keyword(f"{subject}_{level}")
            if docs["documents"]:
                return [({"page_content": d, "metadata": m}, 1.0) for d, m in zip(docs["documents"], docs["metadatas"])]

        # 2) sujet seul
        if subject:
            docs = self._find_documents_by_keyword(subject)
            if docs["documents"]:
                return [({"page_content": d, "metadata": m}, 0.9) for d, m in zip(docs["documents"], docs["metadatas"])]

        # 3) niveau seul
        if level:
            docs = self._find_documents_by_keyword(level)
            if docs["documents"]:
                return [({"page_content": d, "metadata": m}, 0.8) for d, m in zip(docs["documents"], docs["metadatas"])]

        # 4) sémantique
        semantic = self.vector_store.similarity_search_with_score(query, k=config.rag.top_k)
        return [({"page_content": d.page_content, "metadata": d.metadata}, s) for d, s in semantic]

    # --------------------------------------------------------------------- #
    # MISE EN FORME & RÉPONSE
    # --------------------------------------------------------------------- #
    def _format_context_for_llm(self, docs_with_scores):
        if not docs_with_scores:
            return "Aucun document pertinent trouvé."

        out = []
        for i, (doc, score) in enumerate(docs_with_scores):
            fname = Path(doc["metadata"].get("source", "doc")).name
            mat, niv, *_ = fname.split("_") + ["inconnue"] * 2
            norm = 1.0 - score if score <= 1.0 else 0.0
            out.append(
                f"---Document {i+1}: {fname} (pertinence : {norm:.2f}, matière : {mat}, niveau : {niv})---\n"
                f"{doc['page_content'].strip()}\n"
            )
        return "\n\n".join(out)

    def generate_response(self, query: str, messages: List[Dict]) -> str:
        docs = self.search(query)
        ctx = self._format_context_for_llm(docs)
        history = "\n\n".join(
            ("Élève: " if m["role"] == "user" else "SENS AI: ") + m["content"]
            for m in messages[:-1]
        )
        return self.chain.run(question=query, context=ctx, chat_history=history)


def create_rag_engine():
    """Crée une instance du moteur RAG amélioré"""
    return KeywordRagEngine()
