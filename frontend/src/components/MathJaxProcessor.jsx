import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// Composant pour traiter le rendu mathématique
const MathJaxProcessor = ({ text }) => {
  // Découpe le contenu en segments: texte, math inline et math block
  const processText = () => {
    const result = [];
    let currentText = '';
    let remainingText = text;
    
    // Expression régulière améliorée pour capturer les blocs et les expressions inline
    // Utilise des lookahead/lookbehind pour éviter les faux positifs
    const regex = /(?<!\$)(\$\$[\s\S]*?\$\$)|(?<!\$)(\$[^\$\n]+?\$)(?!\$)/g;
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
          content: formula.slice(2, -2) // Enlever les $$
        });
      } else {
        // Formule inline
        result.push({
          type: 'inline-math',
          content: formula.slice(1, -1) // Enlever les $
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
            return <InlineMath key={index} math={segment.content} />;
          } catch (error) {
            console.error("Erreur de rendu MathJax inline:", error, segment.content);
            return <span key={index} style={{color: "red"}}>${segment.content}$</span>;
          }
        } else if (segment.type === 'block-math') {
          try {
            return <BlockMath key={index} math={segment.content} />;
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