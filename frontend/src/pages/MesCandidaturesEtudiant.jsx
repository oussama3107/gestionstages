import React, { useEffect, useState, useCallback, useMemo } from 'react'; // useMemo pas strictement nécessaire ici
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './css/MesCandidaturesEtudiant.css'; // Fichier CSS dédié
import './css/DashboardEtudiant.css'; // Pour Navbar si styles communs
// Importer Font Awesome si pas globalement
// import '@fortawesome/fontawesome-free/css/all.min.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function MesCandidaturesEtudiant() {
  const navigate = useNavigate();

  // --- State ---
  const [myApplications, setMyApplications] = useState([]); // Stockera les VRAIES candidatures
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [isActionError, setIsActionError] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState(null); // Pour feedback bouton Retirer

  // --- Logout Handler ---
  const handleLogout = useCallback((reload = true) => {
    console.log("Déconnexion Etudiant...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    if (reload) { window.location.href = '/login'; }
    else { navigate('/login'); }
  }, [navigate]);

  // --- Fetch VRAIES Candidatures ---
  const loadMyApplications = useCallback(async () => {
    if (!studentId) {
        console.log("Chargement des candidatures en attente de l'ID étudiant...");
        return;
    }

    setIsLoading(true); setError(null); setActionMessage('');
    console.log(`MesCandidaturesEtudiant: Fetching candidatures for Etudiant ID: ${studentId}`);

    try {
      const response = await axios.get(`${API_URL}/api/etudiant/candidatures`, {
         params: { etudiant_id: studentId }
      });

      if (Array.isArray(response.data)) {
        // Trier les candidatures par date de création (plus récentes en premier)
        const sortedApplications = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setMyApplications(sortedApplications.map(c => ({ ...c, uniqueId: `cand-real-${c.id}` })));
        console.log("Vraies candidatures reçues et triées:", sortedApplications);
      } else {
        setMyApplications([]);
        console.warn("Format de réponse API candidatures inattendu:", response.data);
        setError("Format de données inattendu reçu du serveur.");
      }
    } catch (err) {
      console.error("Erreur chargement candidatures:", err);
      let message = "Erreur lors du chargement de vos candidatures.";
       if (err.response?.status === 404) message = "Endpoint API non trouvé ou aucune candidature pour cet étudiant.";
       else if (err.response?.status === 500) message = "Erreur serveur lors de la récupération des candidatures.";
       else if (err.response?.data?.message) message = err.response.data.message;
       else if (err.message) message = err.message;
      setError(`Erreur: ${message}`);
      setMyApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]); // Dépend de studentId

  // --- Effet pour récupérer l'ID étudiant au montage ---
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const typeString = localStorage.getItem('type');
    if (!userString || typeString !== 'etudiant') {
      handleLogout(false);
    } else {
      try {
        const user = JSON.parse(userString);
        if (user?.id) {
          setStudentId(user.id);
        } else { throw new Error("ID manquant dans les données utilisateur locales"); }
      } catch (e) {
        console.error("Erreur lecture user local:", e);
        handleLogout(false);
      }
    }
  }, [handleLogout]);

  // --- Effet pour charger les données une fois l'ID connu ---
  useEffect(() => {
    if (studentId) {
      loadMyApplications();
    }
  }, [studentId, loadMyApplications]);


  // --- Retirer une candidature (Appel API réel) ---
  const handleWithdrawApplication = async (candidatureId) => {
    if (!studentId || !candidatureId) return;

    const confirmWithdraw = window.confirm(`Êtes-vous sûr de vouloir retirer votre candidature (ID: ${candidatureId}) ?`);
    if (!confirmWithdraw) return;

    setActionMessage(''); setIsActionError(false);
    setWithdrawingId(candidatureId);

    console.log(`Tentative suppression candidature ID: ${candidatureId}`);
    try {
      const response = await axios.delete(`${API_URL}/api/candidatures/${candidatureId}`);
      setActionMessage(response.data?.message || `Candidature ${candidatureId} retirée avec succès.`);
      setIsActionError(false);
      setMyApplications(prev => prev.filter(app => app.id !== candidatureId));
    } catch (e) {
        console.error("Erreur lors du retrait:", e);
        setActionMessage(e.response?.data?.message || "Erreur lors du retrait de la candidature.");
        setIsActionError(true);
    } finally {
        setWithdrawingId(null);
    }
  };

   // --- Traduire statut ---
   const getStatusLabel = (status) => {
        switch(status?.toLowerCase()) {
            case 'envoyee': return 'Envoyée';
            case 'vue': return 'Consultée';
            case 'entretien': return 'Entretien Planifié';
            case 'acceptee': return 'Acceptée';
            case 'refusee': return 'Refusée';
            case 'retiree': return 'Retirée'; // Si le backend peut définir ce statut
            default: return status || 'Inconnu';
        }
   };

   // --- Classe CSS par statut ---
    const getStatusClass = (status) => {
        switch(status?.toLowerCase()) {
            case 'envoyee': return 'status-envoyee'; case 'vue': return 'status-vue';
            case 'entretien': return 'status-entretien'; case 'acceptee': return 'status-acceptee';
            case 'refusee': return 'status-refusee'; case 'retiree': return 'status-retiree';
            default: return 'status-inconnu';
        }
    };

    const isActiveLink = (path) => window.location.pathname === path || (path !== "/dashboard-etudiant" && window.location.pathname.startsWith(path));
  // --- Render ---
  return (
    <div className="mes-candidatures-page">
      {/* Navbar */}
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

                    <button className="logout-button" onClick={() => handleLogout(true)}>
                        <i className="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            </header>

      {/* Contenu Principal */}
      <main className="mes-candidatures-content">
        <h1>Mes Candidatures</h1>

         {/* Message d'action (après retrait) */}
         {actionMessage && <p className={`action-message ${isActionError ? 'error' : 'success'}`} role="alert">{actionMessage}</p>}

        {/* Affichage Chargement ou Erreur */}
        {isLoading && <div className="loading-indicator">Chargement de vos candidatures...</div>}
        {error && !isLoading && <div className="error-message" role="alert">{error}</div>}

        {/* Liste des Candidatures */}
        {!isLoading && !error && (
            <section className="candidatures-list">
                {myApplications.length > 0 ? (
                    myApplications.map(cand => (
                         <div key={cand.uniqueId || cand.id} className="candidature-card card-style">
                             <div className="candidature-card-header">
                                 <h3>{cand.offreStage?.titre || `Offre ID: ${cand.offre_stage_id || cand.stage_id}`}</h3>
                                 <span className={`application-status-badge ${getStatusClass(cand.statut)}`}>
                                      {getStatusLabel(cand.statut)}
                                 </span>
                             </div>
                             <div className="candidature-card-body">
                                 {/* Afficher le nom de l'entreprise si disponible via l'offre */}
                                 {cand.offreStage?.responsableRh?.nom_entreprise && (
                                    <p className="candidature-company">
                                        <i className="fas fa-building"></i> {cand.offreStage.responsableRh.nom_entreprise}
                                    </p>
                                 )}
                                 <p className="candidature-date">
                                     <i className="fas fa-calendar-alt"></i> Postulé le : {cand.created_at ? new Date(cand.created_at).toLocaleDateString() : (cand.date_candidature ? new Date(cand.date_candidature).toLocaleDateString() : 'Date inconnue')}
                                 </p>
                                 {cand.message_motivation &&
                                     <p className="cand-motivation-preview">
                                         <strong>Votre message :</strong> {cand.message_motivation.substring(0, 70)}{cand.message_motivation.length > 70 ? '...' : ''}
                                     </p>
                                 }
                             </div>
                             <div className="candidature-card-footer">
                                 <Link to={`/offres/${cand.offre_stage_id || cand.stage_id}`} className="view-offer-link" title="Revoir les détails de l'offre">
                                     <i className="fas fa-eye"></i> Voir l'offre
                                 </Link>
                                 {/* Bouton Retirer : conditionnel au statut */}
                                  {(cand.statut === 'envoyee' || cand.statut === 'vue') && (
                                     <button
                                        onClick={() => handleWithdrawApplication(cand.id)} // Utilise ID de la CANDIDATURE
                                        className="withdraw-button"
                                        title="Retirer ma candidature"
                                        disabled={withdrawingId === cand.id}
                                     >
                                         {withdrawingId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times-circle"></i>}
                                         {withdrawingId === cand.id ? '' : ' Retirer'}
                                     </button>
                                  )}
                             </div>
                         </div>
                    ))
                ) : (
                    <p className="no-results-message">Vous n'avez aucune candidature en cours.</p>
                )}
            </section>
        )}
      </main>
    </div>
  );
}

export default MesCandidaturesEtudiant;