import React, { useState } from 'react';
import { FaCheck, FaCrown, FaRocket, FaHeart, FaStar, FaInfinity } from 'react-icons/fa';
import { MdWorkspacePremium, MdSupport, MdPeople } from 'react-icons/md';
import { BiSupport } from 'react-icons/bi';
import './Subscriptions.css';

function Subscriptions() {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or yearly

    // Données des offres d'abonnement avec plus de détails
    const plans = [
        {
            id: 'free',
            name: 'Gratuit',
            price: { monthly: 0, yearly: 0 },
            recommended: false,
            icon: <FaHeart />,
            color: '#6c757d',
            gradient: 'linear-gradient(135deg, #6c757d, #495057)',
            badge: null,
            features: [
                { text: 'Accès limité aux mondes', icon: <FaCheck /> },
                { text: 'Progression basique', icon: <FaCheck /> },
                { text: 'Support communautaire', icon: <MdPeople /> },
                { text: '3 quêtes par jour', icon: <FaCheck /> },
                { text: 'Fragments basiques', icon: <FaCheck /> }
            ],
            limitations: ['Publicités', 'Fonctionnalités limitées', 'Pas de sauvegarde cloud'],
            buttonText: 'Commencer gratuitement'
        },
        {
            id: 'standard',
            name: 'Standard',
            price: { monthly: 9.99, yearly: 99.99 },
            recommended: true,
            icon: <FaStar />,
            color: '#00e0ff',
            gradient: 'linear-gradient(135deg, #00e0ff, #0099cc)',
            badge: 'Le plus populaire',
            features: [
                { text: 'Accès à tous les mondes', icon: <FaCheck /> },
                { text: 'Progression avancée', icon: <FaRocket /> },
                { text: 'Support prioritaire', icon: <BiSupport /> },
                { text: 'Quêtes illimitées', icon: <FaInfinity /> },
                { text: 'Tous les fragments', icon: <FaCheck /> },
                { text: 'Mode hors-ligne', icon: <FaCheck /> },
                { text: 'Sauvegarde cloud', icon: <FaCheck /> }
            ],
            limitations: [],
            buttonText: 'Choisir Standard'
        },
        {
            id: 'pro',
            name: 'Pro',
            price: { monthly: 19.99, yearly: 199.99 },
            recommended: false,
            icon: <FaCrown />,
            color: '#ff8c00',
            gradient: 'linear-gradient(135deg, #ff8c00, #ff6b35)',
            badge: 'Expérience ultime',
            features: [
                { text: 'Contenu exclusif', icon: <MdWorkspacePremium /> },
                { text: 'Progression maximale', icon: <FaRocket /> },
                { text: 'Support dédié 24/7', icon: <MdSupport /> },
                { text: 'Accès anticipé', icon: <FaCheck /> },
                { text: 'Personnalisation avancée', icon: <FaCheck /> },
                { text: 'Sessions de coaching', icon: <FaCheck /> },
                { text: 'Badge exclusif', icon: <FaCrown /> },
                { text: 'Communauté VIP', icon: <FaCheck /> }
            ],
            limitations: [],
            buttonText: 'Choisir Pro'
        }
    ];

    const handlePlanSelect = (planId) => {
        setSelectedPlan(planId);
        // Ici vous pourriez déclencher le processus de paiement
        console.log(`Plan sélectionné: ${planId}, Cycle: ${billingCycle}`);
    };

    const getPrice = (plan) => {
        const price = plan.price[billingCycle];
        if (price === 0) return 'Gratuit';
        return `${price}€`;
    };

    const getSavings = (plan) => {
        if (billingCycle === 'yearly' && plan.price.monthly > 0) {
            const monthlyCost = plan.price.monthly * 12;
            const savings = monthlyCost - plan.price.yearly;
            return savings > 0 ? `Économisez ${savings.toFixed(0)}€/an` : null;
        }
        return null;
    };

    return (
        <div className="subscriptions">
            {/* Header Section */}
            <div className="subscriptions-header">
                <h1>Choisissez votre aventure</h1>
                <p>Débloquez tout le potentiel du Kaizenverse avec nos formules d'abonnement</p>

                {/* Billing Toggle */}
                <div className="billing-toggle">
                    <label className={billingCycle === 'monthly' ? 'active' : ''}>
                        <input
                            type="radio"
                            value="monthly"
                            checked={billingCycle === 'monthly'}
                            onChange={(e) => setBillingCycle(e.target.value)}
                        />
                        Mensuel
                    </label>
                    <label className={billingCycle === 'yearly' ? 'active' : ''}>
                        <input
                            type="radio"
                            value="yearly"
                            checked={billingCycle === 'yearly'}
                            onChange={(e) => setBillingCycle(e.target.value)}
                        />
                        Annuel
                        <span className="savings-badge">-17%</span>
                    </label>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="plans">
                {plans.map((plan, index) => (
                    <div
                        key={plan.id}
                        className={`plan ${plan.recommended ? 'recommended' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
                        style={{
                            '--plan-color': plan.color,
                            '--plan-gradient': plan.gradient,
                            animationDelay: `${index * 0.2}s`
                        }}
                    >
                        {plan.badge && (
                            <div className="plan-badge">
                                {plan.badge}
                            </div>
                        )}

                        <div className="plan-header">
                            <div className="plan-icon">
                                {plan.icon}
                            </div>
                            <h2>{plan.name}</h2>
                            <div className="plan-price">
                                <span className="price-amount">{getPrice(plan)}</span>
                                {plan.price[billingCycle] > 0 && (
                                    <span className="price-period">
                                        /{billingCycle === 'monthly' ? 'mois' : 'an'}
                                    </span>
                                )}
                            </div>
                            {getSavings(plan) && (
                                <div className="savings-info">{getSavings(plan)}</div>
                            )}
                        </div>

                        <div className="plan-features">
                            <h4>Fonctionnalités incluses :</h4>
                            <ul>
                                {plan.features.map((feature, i) => (
                                    <li key={i}>
                                        <span className="feature-icon">{feature.icon}</span>
                                        <span className="feature-text">{feature.text}</span>
                                    </li>
                                ))}
                            </ul>

                            {plan.limitations.length > 0 && (
                                <div className="plan-limitations">
                                    <h5>Limitations :</h5>
                                    <ul>
                                        {plan.limitations.map((limitation, i) => (
                                            <li key={i}>{limitation}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button
                            className="plan-button"
                            onClick={() => handlePlanSelect(plan.id)}
                        >
                            {plan.buttonText}
                        </button>
                    </div>
                ))}
            </div>

            {/* Additional Info */}
            <div className="subscription-info">
                <div className="info-grid">
                    <div className="info-item">
                        <h3>🔒 Sécurisé</h3>
                        <p>Paiements 100% sécurisés avec cryptage SSL</p>
                    </div>
                    <div className="info-item">
                        <h3>↩️ Garantie</h3>
                        <p>Remboursement sous 30 jours, sans questions</p>
                    </div>
                    <div className="info-item">
                        <h3>🎯 Support</h3>
                        <p>Équipe disponible 7j/7 pour vous accompagner</p>
                    </div>
                </div>

                <div className="faq-preview">
                    <h3>Questions fréquentes</h3>
                    <div className="faq-item">
                        <strong>Puis-je changer de formule à tout moment ?</strong>
                        <p>Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment depuis votre profil.</p>
                    </div>
                    <div className="faq-item">
                        <strong>Que se passe-t-il si j'annule mon abonnement ?</strong>
                        <p>Vous gardez l'accès aux fonctionnalités premium jusqu'à la fin de votre période de facturation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Subscriptions;