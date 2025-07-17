import React from 'react';
import Magicien from '../components/Magicien';
import BoutonQuete from '../components/BoutonQuete';
import ListeMatieres from '../components/ListeMatieres';
import FragmentsListe from '../components/FragmentsListe';
import MiniJeuxSection from '../components/MiniJeuxSection';
import '../styles/PageAccueil.css';

function PageAccueil() {
  console.log("page charge")
  return (
    <div className="page-accueil">
      <header className="banniere">
        <Magicien />
        <div className="texte-banniere">
          <h1>AMÉLIORES TES CONNAISSANCES</h1>
          <BoutonQuete texte="ENTRE DANS TA QUÊTE" />
        </div>
      </header>

      <section className="multiverse">
        <h2>Multiverse</h2>
        <ListeMatieres />
      </section>

      <section className="fragments">
        <h2>Fragments à récupérer</h2>
        <FragmentsListe total={15} debloques={1} />
      </section>

      <section className="mini-jeux">
        <h2>Mini-jeux</h2>
        <MiniJeuxSection />
      </section>
    </div>
  );
}

export default PageAccueil;
