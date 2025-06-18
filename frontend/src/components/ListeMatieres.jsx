import React from 'react';
const matieres = ['Mathématiques', 'Français', 'Histoire', 'Anglais', 'Espagnol', 'Multiverse'];
function ListeMatieres() {
  return (
    <div className="liste-matieres">
      {matieres.map((nom, i) => (
        <div key={i} className="carte-matiere">
          <div className="icone-matiere">🎮</div>
          <span>{nom}</span>
        </div>
      ))}
    </div>
  );
}
export default ListeMatieres;
