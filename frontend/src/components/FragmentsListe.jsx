import React from 'react';
function FragmentsListe({ total, debloques }) {
  const fragments = Array.from({ length: total }, (_, i) => i < debloques);
  return (
    <div className="fragments-liste">
      {fragments.map((dejaObtenu, i) => (
        <div key={i} className={dejaObtenu ? 'fragment cle' : 'fragment verrouille'}>
          {dejaObtenu ? '🗝️' : '🔒'}
        </div>
      ))}
      <div className="compteur">{debloques}/{total}</div>
    </div>
  );
}
export default FragmentsListe;
