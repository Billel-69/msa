// Fichier: src/config/agora.js
// Configuration Agora avec votre NOUVEL App ID

export const agoraConfig = {
    // Votre NOUVEAU App ID Agora (sans certificat)
    appId: "0b17dfbaa0e444ae8616069fbd5a7080",
    tempToken: null, // Pas de token nécessaire

    // Configuration des médias
    videoConfig: {
        teacher: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
            facingMode: 'user'
        },
        student: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 15, max: 30 }
        },
        screenShare: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 15, max: 30 }
        }
    },

    audioConfig: {
        teacher: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
        },
        student: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
        }
    }
};

// Fonction pour obtenir l'App ID avec validation
export const getAgoraAppId = () => {
    // D'abord essayer les variables d'environnement
    const envAppId = process.env.REACT_APP_AGORA_APP_ID_DEV ||
        process.env.REACT_APP_AGORA_APP_ID ||
        process.env.REACT_APP_AGORA_APP_ID_PROD;

    // Ensuite utiliser la configuration par défaut
    const appId = envAppId || agoraConfig.appId;

    console.log('🔑 Using Agora App ID:', appId ? `${appId.substring(0, 8)}...` : 'MISSING');

    // Validation de l'App ID
    if (!appId || appId === 'YOUR_AGORA_APP_ID' || appId.length !== 32) {
        console.error('❌ Invalid Agora App ID:', appId);
        throw new Error(`App ID Agora invalide. App ID: ${appId}`);
    }

    return appId;
};

// Fonction pour générer un nom de canal valide
export const generateChannelName = (sessionId) => {
    // Les noms de canaux Agora doivent être alphanumériques
    const cleanSessionId = sessionId.toString().replace(/[^a-zA-Z0-9]/g, '');
    return `msa${cleanSessionId}`;
};

// Fonction pour générer un UID valide
export const generateUID = (userId) => {
    // Agora UID doit être un entier entre 1 et (2^32-1)
    if (!userId) {
        return Math.floor(Math.random() * 1000000) + 1;
    }

    // Créer un UID basé sur l'ID utilisateur
    const userIdNum = parseInt(userId.toString().replace(/[^0-9]/g, '')) || 1;
    const timestamp = Date.now() % 100000; // Prendre les 5 derniers chiffres
    const uid = (userIdNum * 1000 + timestamp) % 2147483647; // Max 32-bit integer

    console.log('🆔 Generated UID:', uid, 'for user:', userId);
    return uid;
};

// Fonction de test de connectivité
export const testAgoraConnection = async (AgoraRTC) => {
    try {
        console.log('🧪 Testing Agora connection with new App ID...');

        const appId = getAgoraAppId();

        // Test simple de création de client
        const testClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

        // Tester la connexion avec un canal temporaire
        const testChannel = `test_${Date.now()}`;
        const testUid = Math.floor(Math.random() * 10000);

        console.log('🔗 Testing join with NEW App ID:', {
            appId: appId.substring(0, 8) + '...',
            testChannel,
            testUid
        });

        await testClient.join(appId, testChannel, null, testUid);
        console.log('✅ Agora connection test successful with new App ID!');

        await testClient.leave();
        console.log('✅ Agora disconnection test successful');

        return { success: true, appId };
    } catch (error) {
        console.error('❌ Agora connection test failed:', error);
        return { success: false, error };
    }
};