import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
// Importer le NOUVEAU fichier CSS dédié
import './css/DashboardEtudiant.css';
// Importer Font Awesome si ce n'est pas déjà fait globalement
// import '@fortawesome/fontawesome-free/css/all.min.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function DashboardEtudiant() {
    const navigate = useNavigate();
    const [etudiantData, setEtudiantData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Logout Handler ---
    const handleLogout = useCallback((reload = true) => {
        localStorage.removeItem('user'); localStorage.removeItem('type');
        if (reload) window.location.href = '/login'; else navigate('/login');
    }, [navigate]);

    // --- Fetch Data ---
    const fetchEtudiantData = useCallback(async () => {
        setIsLoading(true); setError(null);
        const userDataString = localStorage.getItem('user');
        const userType = localStorage.getItem('type');

        if (userType !== 'etudiant' || !userDataString) {
            setError("Accès non autorisé ou données locales invalides. Redirection...");
            setIsLoading(false); setTimeout(() => handleLogout(false), 1500); return;
        }
        let userId = null;
        try {
            userId = JSON.parse(userDataString)?.id;
            if (!userId) throw new Error("ID utilisateur local manquant.");
        } catch (parseError) {
            setError("Erreur lecture données locales. Redirection...");
            setIsLoading(false); setTimeout(() => handleLogout(false), 1500); return;
        }

        try {
            const response = await axios.get(`${API_URL}/api/etudiants/${userId}`);
            setEtudiantData(response.data);
        } catch (err) {
            console.error("Erreur chargement profil étudiant:", err);
            const status = err.response?.status;
            let message = err.response?.data?.message || err.message || "Une erreur inconnue est survenue.";
            if (status === 404) message = `Profil étudiant (ID: ${userId}) non trouvé.`;
            else if (status === 500) message = "Erreur interne du serveur.";
            setError(`Erreur: ${message}`);
        } finally { setIsLoading(false); }
    }, [handleLogout]); // navigate est implicite via handleLogout

    useEffect(() => { fetchEtudiantData(); }, [fetchEtudiantData]);

    // --- Helpers ---
    const getInitials = (fname, lname) => `${fname?.charAt(0) || ''}${lname?.charAt(0) || ''}`.toUpperCase() || "?";
    const handleImageError = (e, prenom, nom) => {
        e.target.onerror = null; e.target.style.display = 'none';
        const parent = e.target.parentNode;
        if (parent && !parent.querySelector('.profile-initials-placeholder')) { // Classe spécifique
              const initialsSpan = document.createElement('span');
              initialsSpan.className = 'profile-initials-placeholder';
              initialsSpan.textContent = getInitials(prenom, nom);
              parent.appendChild(initialsSpan);
        }
    };
    const handleModifierProfil = () => { navigate('/modifier-profil'); };

    // --- Render Logic ---
    if (isLoading) {
        return (
            <div className="etu-dashboard-page"> {/* Classe page principale */}
                <header className="etu-navbar"> {/* Styles navbar communs */}
                     <div className="navbar-brand"><Link to="/dashboard-etudiant" className="navbar-logo-link"><img src="/logo.png" alt="Logo" className="nav-logo" /></Link></div>
                     <nav className="navbar-links-center"><span>Chargement...</span></nav>
                     <div className="navbar-actions"><button className="logout-button" disabled>Déconnexion</button></div>
                </header>
                <main className="etu-loading-container">Chargement du profil...</main>
            </div>
        );
    }
    if (error) {
        return (
           <div className="etu-dashboard-page">
                <header className="etu-navbar">
                    <div className="navbar-brand">
                        <Link to="/dashboard-etudiant" className="navbar-logo-link">
                        <img src="/logo.png" alt="Logo" className="nav-logo" /></Link></div>
                    <nav className="navbar-links-center"><span>Erreur</span></nav>
                    <div className="navbar-actions"><button className="logout-button" onClick={()=>handleLogout(true)}>Déconnexion</button></div>
               </header>
               <main className="etu-error-container">
                   <p>Une erreur est survenue :</p> <p><strong>{error}</strong></p>
                   <button onClick={fetchEtudiantData} className="etu-action-button primary">Réessayer</button>
               </main>
           </div>
        );}
    const isActiveLink = (path) => window.location.pathname === path || (path !== "/dashboard-etudiant" && window.location.pathname.startsWith(path));

    // --- Rendu Principal ---
    return (
        <div className="etu-dashboard-page">
            {/* Navbar Étudiant Moderne */}
            <header className="etu-navbar">
                <div className="navbar-brand">
                    <Link to="/dashboard-etudiant" className="navbar-logo-link">
                        <img src="/logo.png" alt="Logo Plateforme" className="nav-logo" />
                        {/* <span className="navbar-app-name">Mon Espace</span> */}
                    </Link>
                </div>
                <nav className="navbar-links-center">
                    <Link to="/dashboard-etudiant" className={isActiveLink('/dashboard-etudiant') ? 'active' : ''}>Mon Profil</Link>
                    <Link to="/OffresEtudiant" className={isActiveLink('/OffresEtudiant') ? 'active' : ''}>Offres de Stage</Link> {/* Mettre à jour chemin si OffresEtudiant.jsx est sous /etudiant/offres */}
                    <Link to="/MesCandidaturesEtudiant" className={isActiveLink('/MesCandidaturesEtudiant') ? 'active' : ''}>Mes Candidatures</Link> {/* Mettre à jour chemin */}
                    {/* <Link to="/etudiant/parametres">Paramètres</Link> */}
                </nav>
                <div className="navbar-actions">
                    <div className="navbar-user-info">
                        <span className="user-greeting">Bonjour, {etudiantData.prenom || "Étudiant"}</span>
                        {/* Optionnel: petit avatar ici aussi */}
                    </div>
                    <button className="logout-button" onClick={() => handleLogout(true)}>
                        <i className="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            </header>

            {/* Contenu Principal du Dashboard Étudiant */}
            <main className="etu-dashboard-content">
                <div className="etu-profile-header">
                    <div className="etu-profile-avatar-container">
                        {etudiantData.photo_profil ? (
                            <img
                                src={`${API_URL}/storage/${etudiantData.photo_profil}`}
                                alt={`Profil de ${etudiantData.prenom} ${etudiantData.nom}`}
                                className="etu-profile-photo"
                                onError={(e) => handleImageError(e, etudiantData.prenom, etudiantData.nom)}
                            />
                        ) : (
                            <div className="etu-profile-initials-big">{getInitials(etudiantData.prenom, etudiantData.nom)}</div>
                        )}
                    </div>
                    <div className="etu-profile-summary">
                        <h1>Bienvenue, {etudiantData.prenom || 'Étudiant'} {etudiantData.nom || ''} !</h1>
                        <p className="etu-profile-email">{etudiantData.email}</p>
                        <button onClick={handleModifierProfil} className="etu-action-button primary">
                            <i className="fas fa-edit"></i> Modifier mon Profil
                        </button>
                    </div>
                </div>

                <div className="etu-dashboard-grid">
                    {/* Colonne Informations Personnelles & Documents */}
                    <aside className="etu-info-sidebar">
                        <div className="etu-info-card etu-dashboard-card">
                            <h2><i className="fas fa-user-circle"></i> Informations Personnelles</h2>
                            <p><strong>Nom Complet :</strong> {etudiantData.nom} {etudiantData.prenom}</p>
                            <p><strong>Téléphone :</strong> {etudiantData.telephone || 'Non renseigné'}</p>
                            <p><strong>Ville :</strong> {etudiantData.ville || 'Non renseignée'}</p>
                        </div>
                        <div className="etu-documents-card etu-dashboard-card">
                            <h2><i className="fas fa-folder-open"></i> Mes Documents</h2>
                            <div className="etu-doc-link">
                                {etudiantData.cv ?
                                    <a href={`${API_URL}/storage/${etudiantData.cv}`} target="_blank" rel="noopener noreferrer"><i className="fas fa-file-pdf"></i> Voir mon CV</a>
                                    : <span><i className="fas fa-file-excel"></i> CV non fourni</span>}
                            </div>
                            <div className="etu-doc-link">
                                {etudiantData.lettre_motivation ?
                                    <a href={`${API_URL}/storage/${etudiantData.lettre_motivation}`} target="_blank" rel="noopener noreferrer"><i className="fas fa-file-word"></i> Voir ma Lettre</a>
                                    : <span><i className="fas fa-file-excel"></i> Lettre non fournie</span>}
                            </div>
                        </div>
                    </aside>

                    {/* Zone Principale des Actions */}
                    <section className="etu-main-actions-area">
                        <div className="etu-action-card etu-dashboard-card">
                            <h2><i className="fas fa-briefcase"></i> Offres de Stage</h2>
                            <p>Explorez les dernières opportunités et trouvez le stage qui vous correspond.</p>
                            <Link to="/OffresEtudiant" className="etu-action-button secondary">
                                Rechercher des Offres <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>
                        <div className="etu-action-card etu-dashboard-card">
                            <h2><i className="fas fa-paper-plane"></i> Mes Candidatures</h2>
                            <p>Suivez l'état de vos candidatures et gérez vos processus de recrutement.</p>
                            <Link to="/MesCandidaturesEtudiant" className="etu-action-button secondary">
                                Voir Mes Candidatures <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>
                        {/* Ajouter d'autres cartes d'action si besoin */}
                    </section>
                </div>
            </main>
        </div>
    );
}
export default DashboardEtudiant;