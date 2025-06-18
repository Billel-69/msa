// src/pages/Subscriptions.js
import React from 'react';
import './Subscriptions.css';

function Subscriptions() {
    // Données fictives pour les offres d'abonnement
    const plans = [
        {
            name: 'Gratuit',
            price: 0,
            recommended: false,
            features: ['Accès limité aux mondes', 'Progression basique', 'Support communautaire']
        },
        {
            name: 'Standard',
            price: 9.99,
            recommended: true,
            features: ['Accès à tous les mondes', 'Progression avancée', 'Support prioritaire']
        },
        {
            name: 'Pro',
            price: 19.99,
            recommended: false,
            features: ['Contenu exclusif', 'Progression maximale', 'Support dédié 24/7']
        }
    ];

    return (
        <div className="subscriptions">
            <h1>Abonnements</h1>
            <div className="plans">
                {plans.map((plan, index) => (
                    <div key={index} className={`plan${plan.recommended ? ' recommended' : ''}`}>
                        <h2>{plan.name}</h2>
                        <p className="price">
                            {plan.price === 0 ? '0€' : plan.price + '€'}
                            <span>/mois</span>
                        </p>
                        <ul>
                            {plan.features.map((feature, i) => (
                                <li key={i}>{feature}</li>
                            ))}
                        </ul>
                        <button>Choisir {plan.name}</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Subscriptions;
