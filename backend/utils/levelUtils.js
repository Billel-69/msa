// Fonctions utilitaires pour les calculs de niveaux

/**
 * Calculer le niveau de l'utilisateur basé sur l'XP total
 * Niveau 1 à 2: 35 XP
 * Chaque niveau suivant: exigence précédente + 10%
 * @param {number} totalXP - XP total gagné par l'utilisateur
 * @returns {object} - {level: number, currentLevelXP: number, nextLevelXP: number, xpToNextLevel: number}
 */
function calculateLevel(totalXP) {
    if (totalXP < 35) {
        return {
            level: 1,
            currentLevelXP: totalXP,
            nextLevelXP: 35,
            xpToNextLevel: 35 - totalXP
        };
    }

    let level = 1;
    let totalXPUsed = 0; // XP total utilisé pour atteindre le niveau actuel
    let currentLevelRequirement = 35; // XP requis pour passer au niveau suivant
    
    // Calculer le niveau en parcourant les exigences
    while (totalXPUsed + currentLevelRequirement <= totalXP) {
        level++;
        totalXPUsed += currentLevelRequirement;
        currentLevelRequirement = Math.round(currentLevelRequirement * 1.1);
    }
    
    // Calculer le progrès dans le niveau actuel
    const currentLevelXP = totalXP - totalXPUsed;
    const nextLevelXP = currentLevelRequirement;
    const xpToNextLevel = nextLevelXP - currentLevelXP;
    
    return {
        level,
        currentLevelXP,
        nextLevelXP,
        xpToNextLevel: Math.max(0, xpToNextLevel)
    };
}

/**
 * Calculer l'XP requis pour atteindre un niveau spécifique
 * @param {number} targetLevel - Niveau cible
 * @returns {number} - XP total requis pour atteindre le niveau cible
 */
function calculateXPForLevel(targetLevel) {
    if (targetLevel <= 1) return 0;
    if (targetLevel === 2) return 35;
    
    let totalXP = 35;
    let xpRequired = 35;
    
    for (let level = 3; level <= targetLevel; level++) {
        xpRequired = Math.round(xpRequired * 1.1);
        totalXP += xpRequired;
    }
    
    return totalXP;
}

module.exports = {
    calculateLevel,
    calculateXPForLevel
};