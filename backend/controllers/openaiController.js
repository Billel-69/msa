//openaiController.js
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialiser OpenAI avec la clé API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;

// Fonction pour gérer les messages de chat
exports.processMessage = async (req, res) => {
  try {
    // Récupérer le message de l'utilisateur
    const { message, thread_id } = req.body;
    
    console.log("Message reçu:", message);
    console.log("Thread ID existant:", thread_id);
    
    // Créer un nouveau thread si aucun n'existe
    let threadId = thread_id;
    if (!threadId) {
      console.log("Création d'un nouveau thread");
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      console.log("Nouveau thread créé:", threadId);
    }
    
    // Ajouter le message au thread
    console.log("Ajout du message au thread");
    await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: message
      }
    );
    
    // Exécuter l'assistant sur le thread
    console.log("Exécution de l'assistant");
    const run = await openai.beta.threads.runs.create(
      threadId,
      {
        assistant_id: ASSISTANT_ID
      }
    );
    
    // Attendre que l'assistant termine
    console.log("En attente de la réponse de l'assistant");
    let runStatus;
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      runStatus = await openai.beta.threads.runs.retrieve(
        run.id,
        {
          thread_id: threadId
        }
      );
      
      console.log("Statut:", runStatus.status);
    } while (runStatus.status !== "completed" && runStatus.status !== "failed");
    
    // Si l'exécution a échoué
    if (runStatus.status === "failed") {
      console.error("L'exécution a échoué:", runStatus);
      throw new Error("L'assistant n'a pas pu générer de réponse");
    }
    
    // Récupérer les messages du thread
    console.log("Récupération des messages");
    const messages = await openai.beta.threads.messages.list(
      threadId
    );
    
    // Trouver la dernière réponse de l'assistant
    const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
    const lastMessage = assistantMessages[0];
    
    if (!lastMessage) {
      throw new Error("Pas de réponse de l'assistant");
    }
    
    // Extraire le texte de la réponse
    const response = lastMessage.content[0].type === "text" 
      ? lastMessage.content[0].text.value 
      : "Désolé, je n'ai pas pu générer de réponse textuelle.";
    
    console.log("Réponse envoyée");
    
    // Envoyer la réponse au client
    res.json({
      answer: response,
      thread_id: threadId
    });
    
  } catch (error) {
    console.error("Erreur:", error.message);
    if (error.response) {
      console.error("Détails de l'erreur OpenAI:", error.response.data);
    }
    res.status(500).json({ error: "Une erreur s'est produite lors du traitement de votre message." });
  }
};