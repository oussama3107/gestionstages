// Exemple dans src/index.js (ou App.js avant le rendu principal)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios'; 
import '@fortawesome/fontawesome-free/css/all.min.css'; 

// Configuration globale d'Axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
axios.defaults.withCredentials = true; // Crucial pour Sanctum SPA
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'; // Indique à Laravel que c'est une requête AJAX

// Fonction pour initialiser le cookie CSRF
const getCsrfCookie = async () => {
  try {
    await axios.get('/sanctum/csrf-cookie');
    console.log("CSRF cookie initialisé globalement.");
  } catch (error) {
    console.error("Erreur d'initialisation globale du cookie CSRF:", error.response || error);
  }
};

// Appeler pour initialiser le cookie CSRF au démarrage de l'application
getCsrfCookie();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);