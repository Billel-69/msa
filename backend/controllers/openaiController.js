const { OpenAI } = require('openai');
require('dotenv').config();
const { generateRagAnswer } = require('../services/ragService');
const { recordAIConversation, getUserConversationHistory } = require('../services/aiConversationService');
const { recordUsage } = require('../services/usageServiceDB');

// Initialiser OpenAI avec la clé API
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } else {
    console.warn("Clé API OpenAI non trouvée dans les variables d'environnement");
  }
} catch (error) {
  console.warn("Erreur lors de l'initialisation de l'API OpenAI:", error.message);
}

const ASSISTANT_ID = process.env.ASSISTANT_ID;

// Fonction pour gérer les messages de chat avec basculement niveau 1/2
exports.processMessage = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, thread_id, history = [] } = req.body;
    const userId = req.userId;
    const sessionId = req.body.session_id || thread_id;
    
    console.log("📨 Message reçu:", message);
    console.log("🔍 Niveau déterminé:", req.isLevel2 ? "2 (RAG)" : "1 (OpenAI)");
    
    // Si cooldown actif, informer l'utilisateur
    if (req.cooldownInfo && req.cooldownInfo.isOnCooldown) {
      console.log(`⏰ Utilisateur en cooldown: ${req.cooldownInfo.remainingHours}h restantes`);
    }
    
    let response, modelUsed, finalThreadId;
    
    // NIVEAU 2 - Utilisation du RAG
    if (req.isLevel2) {
      console.log("🤖 Utilisation du RAG (niveau 2)");
      
      try {
        // NOUVEAU : Récupérer l'historique depuis la BD pour CE thread spécifique
        let conversationHistory = [];
        
        if (userId && thread_id) {
          // Importer mysql pour la requête personnalisée
          const mysql = require('mysql2/promise');
          const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'msa'
          });
          
          try {
            // Récupérer uniquement les conversations de ce thread
            const [conversations] = await connection.execute(`
              SELECT message, response, created_at 
              FROM ai_conversations 
              WHERE user_id = ? 
              AND (session_id = ? OR session_id LIKE ?)
              ORDER BY created_at ASC
              LIMIT 20
            `, [userId, thread_id, `%${thread_id}%`]);
            
            // Transformer en format attendu par le RAG
            conversationHistory = conversations.map(conv => [
              { role: 'user', content: conv.message },
              { role: 'assistant', content: conv.response }
            ]).flat();
            
            console.log(`📚 Historique récupéré: ${conversationHistory.length} messages du thread ${thread_id}`);
            
          } finally {
            await connection.end();
          }
        }
        
        // Appel au service RAG AVEC L'HISTORIQUE
        response = await generateRagAnswer(message, conversationHistory);
        modelUsed = 'rag_local';
        finalThreadId = thread_id || sessionId || `rag_session_${Date.now()}`;
        
        console.log("✅ Réponse RAG générée avec succès");
        
      } catch (ragError) {
        console.error("❌ Erreur RAG:", ragError.message);
        
        // Si le RAG échoue et qu'on n'est pas en cooldown, fallback sur OpenAI
        if (!req.cooldownInfo?.isOnCooldown) {
          console.log("🔄 Fallback sur OpenAI suite à erreur RAG");
          req.isLevel2 = false;
        } else {
          // En cooldown, on doit rester sur RAG
          return res.status(503).json({
            error: "Service temporairement indisponible. Veuillez réessayer dans quelques instants.",
            model_used: 'rag_local',
            cooldown_info: req.cooldownInfo
          });
        }
      }
    }
    
    // NIVEAU 1 - Utilisation d'OpenAI
    if (!req.isLevel2) {
      console.log("🌟 Utilisation d'OpenAI (niveau 1)");
      
      if (!openai) {
        throw new Error("Service OpenAI non configuré");
      }
      
      // Créer un nouveau thread si nécessaire ou si le thread n'existe pas
      let threadId = thread_id;
      let threadExists = false;
      
      if (threadId) {
        try {
          // Vérifier si le thread existe côté OpenAI
          await openai.beta.threads.retrieve(threadId);
          threadExists = true;
          console.log("Thread existant trouvé:", threadId);
        } catch (error) {
          console.log("Thread inexistant ou supprimé:", threadId, "- Création d'un nouveau thread");
          threadExists = false;
        }
      }
      
      if (!threadId || !threadExists) {
        console.log("Création d'un nouveau thread");
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        console.log("Nouveau thread créé:", threadId);
      }
      
      // Ajouter le message au thread
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message
      });
      
      // Exécuter l'assistant
      console.log("Exécution de l'assistant");
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: ASSISTANT_ID
      });
      
      // Attendre la réponse
      let runStatus;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(run.id, {
          thread_id: threadId
        });
      } while (runStatus.status !== "completed" && runStatus.status !== "failed");
      
      if (runStatus.status === "failed") {
        throw new Error("L'assistant n'a pas pu générer de réponse");
      }
      
      // Récupérer la réponse
      const messages = await openai.beta.threads.messages.list(threadId);
      const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
      const lastMessage = assistantMessages[0];
      
      if (!lastMessage) {
        throw new Error("Pas de réponse de l'assistant");
      }
      
      response = lastMessage.content[0].type === "text" 
        ? lastMessage.content[0].text.value 
        : "Désolé, je n'ai pas pu générer de réponse textuelle.";
      
      modelUsed = 'openai';
      finalThreadId = threadId;
    }
    
    // Calculer le temps de réponse
    const responseTime = Date.now() - startTime;
    
    // Enregistrer la conversation dans la BD
    if (userId) {
      await recordAIConversation({
        user_id: userId,
        session_id: finalThreadId, // Utiliser le thread_id comme session_id pour la cohérence
        message: message,
        response: response,
        model_used: modelUsed,
        tokens_used: req.estimatedTokens || 0,
        response_time_ms: responseTime
      });
    }
    
    // NE PAS enregistrer les tokens ici car c'est déjà fait dans le middleware
    // Le middleware enhancedTokenMeter s'en charge déjà
    
    // Réponse finale
    const responseData = {
      answer: response,
      thread_id: finalThreadId,
      model_used: modelUsed,
      response_time_ms: responseTime
    };
    
    // Ajouter les infos de cooldown si pertinent
    if (req.cooldownInfo?.isOnCooldown) {
      responseData.cooldown_info = {
        is_active: true,
        hours_remaining: Math.ceil(req.cooldownInfo.hoursRemaining),
        can_switch_back_at: req.cooldownInfo.canSwitchBackAt
      };
    }
    
    console.log(`✅ Réponse envoyée (${modelUsed}) en ${responseTime}ms`);
    res.json(responseData);
    
  } catch (error) {
    console.error("❌ Erreur processMessage:", error.message);
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
    }
    
    res.status(500).json({ 
      error: "Une erreur s'est produite lors du traitement de votre message.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Génération de questions de quiz éducatif (fonction existante inchangée)
exports.generateQuizQuestions = async (subject, niveau, count = 5) => {
  try {
    // Vérifier si OpenAI est initialisé
    if (!openai) {
      console.warn("OpenAI API non initialisée, utilisation des questions par défaut");
      return getDefaultQuestions(subject, niveau);
    }
    
    // Ajout de logs détaillés pour le debug
    console.log(`Génération pour sujet="${subject}" (type: ${typeof subject}) et niveau="${niveau}" (type: ${typeof niveau})`);
    // Normalisation du sujet pour éviter les problèmes d'accents et de casse
    const normalizedSubject = subject ? subject.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : 'mathematiques';
    const normalizedNiveau = niveau || '3e';
    console.log(`Sujet normalisé: "${normalizedSubject}", Niveau normalisé: "${normalizedNiveau}"`);
    // Construire le prompt pour OpenAI en insistant sur le sujet et le niveau
    const prompt = `
      Tu es un professeur qui es expert dans toutes les matières de la 3ème à la Terminale,tu connais les programmes et les attendus du système francais pour chaque matières et niveau
      Génère exactement ${count} questions de quiz éducatif en français strictement sur le sujet "${normalizedSubject}" pour un niveau scolaire "${normalizedNiveau}".
      IMPORTANT: Les questions DOIVENT être spécifiquement sur ${normalizedSubject} et adaptées au niveau ${normalizedNiveau}.
      Si le sujet est "histoire-geo" ou contient "histoire" ou "geo", les questions doivent porter sur l'histoire ou la géographie, PAS sur les mathématiques ou d'autres matières.
      Aucune question ne doit être triviale ou répétée.
      Chaque question doit être originale, claire, et pédagogique.
      Chaque question doit avoir exactement 4 options de réponses et une seule réponse correcte.
      Ajoute une courte explication pour chaque réponse correcte.
      Format JSON requis:
      {
        "questions": [
          {
            "question": "Texte de la question sur ${normalizedSubject}",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option correcte (exactement comme dans les options)",
            "explanation": "Explication courte et pédagogique"
          }
        ]
      }
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es un professeur expert qui génère des questions de quiz éducatives adaptées à différents niveaux scolaires et matières."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });
    const content = response.choices[0].message.content;
    console.log("Réponse OpenAI reçue:", content.substring(0, 100) + "...");
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(content);
    } catch (e) {
      console.error("Erreur de parsing JSON OpenAI:", e);
      return getDefaultQuestions(subject, niveau);
    }
    if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions) || jsonResponse.questions.length === 0) {
      console.error("Format de réponse OpenAI invalide:", content);
      return getDefaultQuestions(subject, niveau);
    }
    const formattedQuestions = jsonResponse.questions.map(q => ({
      question: q.question,
      options: q.options && q.options.length === 4 ? q.options : generateDefaultOptions(q.correctAnswer),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || `La bonne réponse est: ${q.correctAnswer}`
    })).slice(0, count);
    return formattedQuestions;
  } catch (error) {
    console.error("Erreur lors de la génération des questions avec OpenAI:", error);
    return getDefaultQuestions(subject, niveau);
  }
};

function generateDefaultOptions(correctAnswer) {
  return [
    correctAnswer,
    `Option incorrecte A`,
    `Option incorrecte B`,
    `Option incorrecte C`
  ];
}

function getDefaultQuestions(subject, niveau) {
  const questionSets = {
    'mathématiques': {
      '6e': [
        { question: 'Combien font 5 × 8 ?', options: ['35', '40', '45', '50'], correctAnswer: '40', explanation: '5 × 8 = 40' },
        { question: 'Quel est le résultat de 12 + 9 ?', options: ['19', '21', '23', '25'], correctAnswer: '21', explanation: '12 + 9 = 21' }
      ],
      '3e': [
        { question: 'Résolvez: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 3', 'x = 7'], correctAnswer: 'x = 5', explanation: '2x = 15 - 5 = 10, donc x = 5' },
        { question: 'Quelle est la racine carrée de 64 ?', options: ['6', '7', '8', '9'], correctAnswer: '8', explanation: '8² = 64' }
      ],
      '2nde': [
        { question: 'Résolvez: x² - 4 = 0', options: ['x = 2', 'x = ±2', 'x = 4', 'x = ±4'], correctAnswer: 'x = ±2', explanation: 'x² = 4 donc x = ±2' }
      ],
      '1ère': [
        { question: 'Quelle est la dérivée de f(x) = x²?', options: ['f\'(x) = 2x', 'f\'(x) = x', 'f\'(x) = x²', 'f\'(x) = 0'], correctAnswer: 'f\'(x) = 2x', explanation: 'La dérivée de x^n est n*x^(n-1)' }
      ],
      'Terminale': [
        { question: 'Calculez la limite de (1+1/n)^n quand n tend vers l\'infini', options: ['0', '1', 'e', '∞'], correctAnswer: 'e', explanation: 'Cette limite est la définition du nombre e ≈ 2,718' }
      ]
    },
    'français': {
      '3e': [
        { question: 'Qui a écrit "Les Misérables" ?', options: ['Victor Hugo', 'Albert Camus', 'Émile Zola', 'Gustave Flaubert'], correctAnswer: 'Victor Hugo', explanation: '"Les Misérables" est une œuvre de Victor Hugo publiée en 1862' }
      ],
      'Terminale': [
        { question: 'Quelle figure de style est utilisée dans "Cette femme est une fleur" ?', options: ['Comparaison', 'Métaphore', 'Hyperbole', 'Oxymore'], correctAnswer: 'Métaphore', explanation: 'La métaphore établit une identification entre deux éléments sans utiliser de terme de comparaison' }
      ]
    },
    'anglais': {
      'Terminale': [
        { question: 'What is the past simple of "to begin"?', options: ['begun', 'began', 'beginned', 'beginning'], correctAnswer: 'began', explanation: 'Le prétérit du verbe irrégulier "to begin" est "began"' }
      ]
    },
    'histoire-géo': {
      'Terminale': [
        { question: 'Quand a eu lieu la Révolution française ?', options: ['1689', '1789', '1889', '1989'], correctAnswer: '1789', explanation: 'La Révolution française a débuté en 1789 avec la prise de la Bastille le 14 juillet' }
      ]
    },
    'physique-chimie': {
      'Terminale': [
        { question: 'Quelle est l\'unité de mesure de la force ?', options: ['Watt', 'Joule', 'Newton', 'Pascal'], correctAnswer: 'Newton', explanation: 'La force se mesure en newtons (N) dans le Système International' }
      ]
    }
  };
  const normalizedSubject = subject?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'mathématiques';
  let bestMatch = 'mathématiques';
  for (const key in questionSets) {
    if (key.includes(normalizedSubject) || normalizedSubject.includes(key)) {
      bestMatch = key;
      break;
    }
  }
  const subjectQuestions = questionSets[bestMatch] || questionSets['mathématiques'];
  const levelQuestions = subjectQuestions[niveau] || 
                        subjectQuestions['Terminale'] || 
                        subjectQuestions['3e'] || 
                        Object.values(subjectQuestions)[0];
  return levelQuestions;
}
