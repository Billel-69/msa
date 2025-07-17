import React from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

// Composant pour traiter le rendu mathématique
const MathJaxProcessor = ({ text }) => {
  // Fonction pour nettoyer et corriger le texte avant traitement
  const cleanText = (rawText) => {
    let cleaned = rawText;
    
    // Corriger les patterns mal formatés courants
    // Pattern 1: *a*2 ou *a*² → $a^2$
    cleaned = cleaned.replace(/\*([a-zA-Z0-9]+)\*(\d+|²)/g, '$$$1^2$');
    
    // Pattern 2: un2+b2=c2 → $a^2 + b^2 = c^2$
    cleaned = cleaned.replace(/un2\+b2=c2/g, '$a^2 + b^2 = c^2$');
    
    // Pattern 3: \( ... \) → $ ... $
    cleaned = cleaned.replace(/\\\((.*?)\\\)/g, '$$1$');
    
    // Pattern 4: \[ ... \] → $$ ... $$
    cleaned = cleaned.replace(/\\\[(.*?)\\\]/g, '$$$$1$$');
    
    // Pattern 5: Nettoyer les doubles backslashes
    cleaned = cleaned.replace(/\\\\([a-zA-Z])/g, '\\$1');
    
    return cleaned;
  };
  
  // Découpe le contenu en segments: texte, math inline et math block
  const processText = () => {
    const result = [];
    // Nettoyer le texte avant traitement
    const cleanedText = cleanText(text);
    let remainingText = cleanedText;
    
    // Expression régulière améliorée pour capturer les blocs et les expressions inline
    // Utilise des lookahead/lookbehind pour éviter les faux positifs
    const regex = /(?<!\$)(\$\$[\s\S]*?\$\$)|(?<!\$)(\$[^$\n]+?\$)(?!\$)/g;
    let match;
    let lastIndex = 0;
    
    while ((match = regex.exec(remainingText)) !== null) {
      // Ajouter le texte avant la formule
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: remainingText.substring(lastIndex, match.index)
        });
      }
      
      // Déterminer si c'est une formule bloc ou inline
      const formula = match[0];
      if (formula.startsWith('$$') && formula.endsWith('$$')) {
        // Formule bloc
        result.push({
          type: 'block-math',
          content: formula.slice(2, -2).trim() // Enlever les $$ et trim
        });
      } else {
        // Formule inline
        result.push({
          type: 'inline-math',
          content: formula.slice(1, -1).trim() // Enlever les $ et trim
        });
      }
      
      lastIndex = match.index + formula.length;
    }
    
    // Ajouter le texte restant
    if (lastIndex < remainingText.length) {
      result.push({
        type: 'text',
        content: remainingText.substring(lastIndex)
      });
    }
    
    return result;
  };
  
  // Fonction pour nettoyer le LaTeX avant de le rendre
  const cleanLatex = (latex) => {
    let cleaned = latex;
    
    // Supprimer les espaces en trop
    cleaned = cleaned.trim();
    
    // S'assurer que les commandes LaTeX sont correctes
    cleaned = cleaned
      .replace(/\\frac\s+/g, '\\frac')
      .replace(/\\sqrt\s+/g, '\\sqrt')
      .replace(/\\int\s+/g, '\\int')
      .replace(/\\sum\s+/g, '\\sum')
      .replace(/\\lim\s+/g, '\\lim');
    
    return cleaned;
  };
  
  // Traiter les sauts de ligne dans le texte
  const renderTextWithLineBreaks = (textContent) => {
    return textContent.split('\n').map((line, i, array) => (
      <React.Fragment key={i}>
        {line}
        {i < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };
  
  // Rendu du contenu traité
  const segments = processText();
  
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{renderTextWithLineBreaks(segment.content)}</span>;
        } else if (segment.type === 'inline-math') {
          try {
            const cleanedMath = cleanLatex(segment.content);
            return <InlineMath key={index} math={cleanedMath} />;
          } catch (error) {
            console.error("Erreur de rendu MathJax inline:", error, segment.content);
            return <span key={index} style={{color: "red"}}>${segment.content}$</span>;
          }
        } else if (segment.type === 'block-math') {
          try {
            const cleanedMath = cleanLatex(segment.content);
            return <BlockMath key={index} math={cleanedMath} />;
          } catch (error) {
            console.error("Erreur de rendu MathJax block:", error, segment.content);
            return <div key={index} style={{color: "red"}}>$${segment.content}$$</div>;
          }
        }
        return null;
      })}
    </>
  );
};

export default MathJaxProcessor;