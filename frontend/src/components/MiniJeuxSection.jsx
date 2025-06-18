import React from 'react';
function MiniJeuxSection() {
  return (
    <div className="mini-jeux-cartes">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="carte-mini-jeu">
          <img src="" alt="Mini jeu" />
          <button className="btn-mini-jeu">C’EST PARTI !</button>
        </div>
      ))}
    </div>
  );
}
export default MiniJeuxSection;
