import { useEffect, useRef } from 'react';
import { startBanc2Touche } from './banc/banc2touche.mjs';
import './banc/banc2touche.css';
import './cloud.css';
import CloudSync from './CloudSync';
import { DEFAULT_API } from './api';

// React pose la structure de la page puis démarre l'appli Banc2Touche dedans.
// Ce composant ne se redessine jamais : l'appli gère elle-même le contenu de ces zones,
// y compris l'écran de connexion et la page « Compte » (comptes gérés par le responsable).
export default function App() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    window.B2T_CLOUD = true; // affiche la carte « Serveur du club » dans Sauvegarde
    window.B2T_AUTH = true; // connexion obligatoire avant d'ouvrir l'appli
    window.B2T_API = DEFAULT_API; // serveur des comptes et des sauvegardes
    startBanc2Touche();
  }, []);

  return (
    <>
      <div className="app">
        <div className="top" id="top" />
        <nav className="rail" id="rail" aria-label="Outils" />
        <header className="head" id="head" />
        <main className="main" id="main"><div className="pane" id="view" /></main>
      </div>
      <div id="toast-root" />
      <div id="modal-root" />
      <CloudSync />
    </>
  );
}
