// Filename: CandidaturesResponsable.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link, NavLink } from 'react-router-dom'; // Added NavLink
import './css/CandidaturesResponsable.css';
import './css/DashboardResponsable.css';
// import '@fortawesome/fontawesome-free/css/all.min.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function CandidaturesResponsable() {
  const navigate = useNavigate();

  // --- State ---
  const [candidaturesRecues, setCandidaturesRecues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responsableInfo, setResponsableInfo] = useState(null); // Store full RH info
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidatureId, setSelectedCandidatureId] = useState(null);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // --- Logout Handler ---
  const handleLogout = useCallback(() => {
    console.log("Déconnexion Responsable...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    // localStorage.removeItem('rhAuthToken'); // If using specific token
    navigate('/login');
  }, [navigate]);

  // --- Fetch Data ---
  const loadCandidaturesRecues = useCallback(async () => {
    if (!responsableInfo?.id) { // Check for responsableInfo.id
      console.log("loadCandidaturesRecues: responsableId non encore défini.");
      // setIsLoading(false); // Don't set loading to false here if auth is still pending
      return;
    }
    setIsLoading(true); setError(null); setActionMessage({ text: '', type: '' });

    try {
      console.log(`CandidaturesResponsable: Fetching candidatures for RH ID: ${responsableInfo.id}`);
      // *** PRIMARY CORRECTION: API URL PATH ***
      const response = await axios.get(`${API_URL}/api/candidatures/responsable`, {
        params: { responsable_id: responsableInfo.id },
        // headers: { 'Authorization': `Bearer ${localStorage.getItem('rhAuthToken')}` } // If auth needed
      });

      // Handle if data is paginated (response.data.data) or direct array (response.data)
      const candidaturesData = response.data?.data || response.data;
      if (Array.isArray(candidaturesData)) {
        setCandidaturesRecues(candidaturesData); // Use cand.id as key directly
        console.log("Candidatures reçues:", candidaturesData.length);
      } else {
        setCandidaturesRecues([]);
        // setError("Format de données des candidatures inattendu."); // Don't set error if it's just an empty array
        console.warn("Format candidatures inattendu ou vide:", response.data);
      }
    } catch (err) {
      console.error("Erreur chargement candidatures reçues:", err.response || err);
      if (err.response && err.response.status === 404) {
        setError("Le service de candidatures est actuellement indisponible ou la route est incorrecte (404).");
      } else if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Session expirée ou accès non autorisé. Redirection...");
        setTimeout(handleLogout, 2000);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Une erreur technique est survenue lors du chargement des candidatures.");
      }
      setCandidaturesRecues([]);
    } finally {
      setIsLoading(false);
    }
  }, [responsableInfo, handleLogout]); // Depend on responsableInfo

  // --- Effect for user auth and setting responsableId ---
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const typeString = localStorage.getItem('type');
    if (!userString || typeString !== 'responsable') {
      setError("Accès non autorisé. Redirection...");
      setTimeout(handleLogout, 1500);
    } else {
      try {
        const user = JSON.parse(userString);
        if (user?.id) {
          setResponsableInfo(user); // Store full user info
        } else {
          throw new Error("ID du responsable manquant dans les données locales.");
        }
      } catch (e) {
        console.error("Erreur lecture données utilisateur local:", e);
        setError("Erreur de session. Redirection...");
        setTimeout(handleLogout, 1500);
      }
    }
  }, [handleLogout]);

  // --- Effect to load data once responsableId is known ---
  useEffect(() => {
    if (responsableInfo?.id) { // Check if responsableInfo and its id are set
      loadCandidaturesRecues();
    }
  }, [responsableInfo, loadCandidaturesRecues]);

  // --- Filtering Logic ---
  const filteredCandidatures = useMemo(() => {
    let tempCandidatures = [...candidaturesRecues];
    if (filterStatus) {
      tempCandidatures = tempCandidatures.filter(c => c.statut === filterStatus);
    }
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      tempCandidatures = tempCandidatures.filter(c =>
        c.etudiant?.nom?.toLowerCase().includes(lowerSearchTerm) ||
        c.etudiant?.prenom?.toLowerCase().includes(lowerSearchTerm) ||
        c.etudiant?.email?.toLowerCase().includes(lowerSearchTerm) ||
        c.offre_stage?.titre?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return tempCandidatures.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [searchTerm, filterStatus, candidaturesRecues]);

  // --- Event Handlers & Helpers ---
  const handleSearchChange = (event) => { setSearchTerm(event.target.value);};
  const handleStatusFilterChange = (event) => { setFilterStatus(event.target.value);};
  const handleToggleDetails = (candidatureId) => {
    setSelectedCandidatureId(prevId => (prevId === candidatureId ? null : candidatureId));
  };
  const getInitials = (fname, lname) => `${fname?.charAt(0) || ''}${lname?.charAt(0) || ''}`.toUpperCase() || "P";
  const handleImageError = (e, prenom, nom) => {
      e.target.onerror = null; e.target.style.display = 'none';
      const parent = e.target.parentNode;
      if (parent && !parent.querySelector('.cand-avatar-initials')) {
            const initialsSpan = document.createElement('span');
            initialsSpan.className = 'cand-avatar-initials';
            initialsSpan.textContent = getInitials(prenom, nom);
            parent.appendChild(initialsSpan);
      }
  };
  const getStatusLabel = (status) => {
      const labels = {'envoyee': 'Reçue','vue': 'Consultée','entretien_planifie': 'Entretien Planifié','entretien_effectue': 'Entretien Effectué','acceptee': 'Acceptée','refusee': 'Refusée','archivee': 'Archivée'};
      return labels[status?.toLowerCase()] || status || 'Inconnu';
  };
  const getStatusClass = (status) => {
      const classes = {'envoyee': 'status-envoyee','vue': 'status-vue','entretien_planifie': 'status-entretien','entretien_effectue': 'status-entretien-ok','acceptee': 'status-acceptee','refusee': 'status-refusee','archivee': 'status-archivee'};
      return classes[status?.toLowerCase()] || 'status-inconnu';
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch(e) { return dateString; }
  };

   // --- ACTIONS RH : MISE À JOUR STATUT CANDIDATURE ---
   const handleUpdateCandidatureStatus = async (candidatureId, newStatus) => {
    setUpdatingStatusId(candidatureId);
    setActionMessage({ text: '', type: '' });

    const candidatureCiblee = candidaturesRecues.find(c => c.id === candidatureId);
    const etudiantName = candidatureCiblee?.etudiant?.prenom || 'L\'étudiant(e)';

    console.log(`RH Action: Updating status for candidature ID ${candidatureId} to '${newStatus}'`);

    try {
        const response = await axios.patch(`${API_URL}/api/candidatures/${candidatureId}/status`, {
            statut: newStatus
        }/*, { headers: { 'Authorization': `Bearer ${localStorage.getItem('rhAuthToken')}` } }*/);

        console.log("API response for candidature status update:", response.data);

        if (response.data && response.data.candidature) {
            setCandidaturesRecues(prev => prev.map(c =>
                c.id === candidatureId ? { ...c, ...response.data.candidature } : c // Merge full updated candidature
            ));
            setActionMessage({ text: `Statut de la candidature de ${etudiantName} mis à jour à '${getStatusLabel(response.data.candidature.statut)}'.`, type: 'success' });
        } else {
             setCandidaturesRecues(prev => prev.map(c => // Fallback
                c.id === candidatureId ? { ...c, statut: newStatus } : c
            ));
            setActionMessage({ text: `Statut mis à jour (réponse API partielle).`, type: 'success' });
        }

        if (newStatus === 'acceptee') {
            console.log(`SIMULATION: Email de confirmation d'acceptation envoyé à ${etudiantName}.`);
        }
    } catch (error) {
         console.error(`Erreur màj statut cand. ID ${candidatureId}:`, error.response || error);
         let errorMessage = "Erreur lors de la mise à jour du statut de la candidature.";
         if (error.response?.data?.errors) errorMessage = Object.values(error.response.data.errors).flat().join(' ');
         else if (error.response?.data?.message) errorMessage = error.response.data.message;
         else if (error.message) errorMessage = error.message;
         setActionMessage({ text: errorMessage, type: 'error' });
    } finally {
        setUpdatingStatusId(null);
    }
};

  // --- Render ---
  if (!responsableInfo && !error) { // Initial state before auth check completes
    return <div className="loading-indicator full-page-loader"><span className="spinner-large"></span> Vérification de la session...</div>;
  }

  if (error && !isLoading) { // If auth failed or critical error during initial load
     return (
        <div className="candidatures-responsable-page error-page">
             <header className="responsable-navbar">
                 <div className="navbar-brand"><Link to="/dashboard-responsable" className="navbar-logo-link"><img src="/logo.png" alt="Logo" className="nav-logo" /></Link></div>
                 <nav className="rh-navbar-links"><span></span></nav> {/* Keep structure */}
                 <div className="rh-navbar-actions"><button className="rh-logout-button" onClick={handleLogout}>Déconnexion</button></div>
            </header>
            <main className="candidatures-responsable-content" style={{ textAlign: 'center', paddingTop: '50px' }}>
                <div className="error-message" role="alert">
                    <h2>Erreur</h2>
                    <p>{error}</p>
                    <button onClick={error.includes("Redirection") ? handleLogout : loadCandidaturesRecues} className="action-btn primary" style={{marginTop: '20px'}}>
                        {error.includes("Redirection") ? "Se reconnecter" : "Réessayer"}
                    </button>
                </div>
            </main>
        </div>
     );
  }

  return (
    <div className="candidatures-responsable-page">
             <header className="responsable-navbar">
                <div className="navbar-brand"><Link to="/dashboard-responsable" className="navbar-logo-link"><img src="/logo.png" alt="Logo" className="nav-logo" /></Link></div>
                <nav className="rh-navbar-links">
                    <NavLink to="/dashboard-responsable" className={({isActive}) => isActive ? 'active' : ''}>Tableau de Bord</NavLink>
                    <NavLink to="/responsable/MesOffresResponsable" className={({isActive}) => isActive ? 'active' : ''}>Mes Offres</NavLink>
                    <NavLink to="/CandidaturesResponsable"  className={({isActive}) => isActive ? 'active' : ''}>Candidatures</NavLink>
                    <NavLink to="/responsable/cvtheque" className={({isActive}) => isActive ? 'active' : ''}>CVthèque</NavLink>
                </nav>
                <div className="rh-navbar-actions">
                    <div className="rh-notification-icon" title="Notifications"><i className="fas fa-bell"></i><span className="rh-notif-count">{candidaturesRecues.filter(c=>c.statut === 'envoyee').length || ''}</span></div>
                    <button className="rh-logout-button" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
                </div>
            </header>

      <main className="candidatures-responsable-content">
        <h1>Candidatures Reçues ({filteredCandidatures.length})</h1>

        <section className="filters-container card-style">
             <div className="filter-item search-filter">
                <i className="fas fa-search"></i>
                <input type="search" placeholder="Rechercher (étudiant, offre...)" value={searchTerm} onChange={handleSearchChange} />
             </div>
             <div className="filter-item">
                <label htmlFor="cand-status-filter-rh"><i className="fas fa-filter"></i> Filtrer par Statut:</label>
                <select id="cand-status-filter-rh" value={filterStatus} onChange={handleStatusFilterChange}>
                    <option value="">Tous les Statuts</option>
                    <option value="envoyee">Reçue</option>
                    <option value="vue">Consultée</option>
                    <option value="entretien_planifie">Entretien Planifié</option>
                    <option value="entretien_effectue">Entretien Effectué</option>
                    <option value="acceptee">Acceptée</option>
                    <option value="refusee">Refusée</option>
                    <option value="archivee">Archivée</option>
                </select>
             </div>
        </section>

        {actionMessage.text && <p className={`action-message ${actionMessage.type}`} role="alert">{actionMessage.text}</p>}
        {isLoading && <div className="loading-indicator"><span className="spinner-large"></span> Chargement des candidatures...</div>}

        {!isLoading && !error && (
            <section className="candidatures-recues-list">
                {filteredCandidatures.length > 0 ? (
                    filteredCandidatures.map(cand => (
                        <React.Fragment key={cand.id}>
                            <div className={`candidature-recue-entry card-style ${selectedCandidatureId === cand.id ? 'expanded' : ''}`}>
                                <div className="cand-main-info">
                                    <div className="cand-etudiant-photo">
                                        <div className="cand-etudiant-avatar">
                                            {cand.etudiant?.photo_profil ? (
                                                <img src={`${API_URL}/storage/${cand.etudiant.photo_profil}`} alt={`Profil de ${cand.etudiant.prenom}`} onError={(e) => handleImageError(e, cand.etudiant?.prenom, cand.etudiant?.nom)} />
                                            ) : (
                                                <span className="cand-avatar-initials">{getInitials(cand.etudiant?.prenom, cand.etudiant?.nom)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="cand-etudiant-offre">
                                        <span className="cand-etudiant-name">{cand.etudiant?.prenom || ''} {cand.etudiant?.nom || 'Étudiant Inconnu'}</span>
                                        <span className="cand-offre-title">Pour : <strong>{cand.offre_stage?.titre || 'Offre Non Spécifiée'}</strong></span>
                                        <span className="cand-date"><i className="fas fa-calendar-alt"></i> Reçue le: {formatDate(cand.created_at)}</span>
                                    </div>
                                    <div className="cand-status">
                                        <span className={`application-status-badge ${getStatusClass(cand.statut)}`}>{getStatusLabel(cand.statut)}</span>
                                    </div>
                                </div>
                                <div className="cand-actions">
                                    <button className="action-btn view-details-btn" onClick={() => handleToggleDetails(cand.id)} title="Voir Détails Candidature" aria-expanded={selectedCandidatureId === cand.id}>
                                        <i className={`fas ${selectedCandidatureId === cand.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                    </button>
                                    {/* Action buttons based on status */}
                                    {cand.statut === 'envoyee' && (
                                        <button className="action-btn mark-viewed-btn" onClick={() => handleUpdateCandidatureStatus(cand.id, 'vue')} title="Marquer comme Consultée" disabled={updatingStatusId === cand.id}>{updatingStatusId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-eye"></i> </>}</button>
                                    )}
                                    {(cand.statut === 'vue' || cand.statut === 'envoyee') && (
                                        <button className="action-btn plan-interview-btn" onClick={() => handleUpdateCandidatureStatus(cand.id, 'entretien_planifie')} title="Planifier un Entretien" disabled={updatingStatusId === cand.id}>{updatingStatusId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-calendar-check"></i> </>}</button>
                                    )}
                                    {cand.statut === 'entretien_planifie' && (
                                          <button className="action-btn mark-interview-done-btn" onClick={() => handleUpdateCandidatureStatus(cand.id, 'entretien_effectue')} title="Marquer Entretien comme Effectué" disabled={updatingStatusId === cand.id}>{updatingStatusId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-user-check"></i> Entretien Fait</>}</button>
                                    )}
                                    {(cand.statut !== 'acceptee' && cand.statut !== 'refusee' && cand.statut !== 'archivee') && (
                                        <>
                                            <button className="action-btn accept-btn" onClick={() => handleUpdateCandidatureStatus(cand.id, 'acceptee')} title="Accepter Candidature" disabled={updatingStatusId === cand.id}>{updatingStatusId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check-circle"></i> </>}</button>
                                            <button className="action-btn refuse-btn" onClick={() => handleUpdateCandidatureStatus(cand.id, 'refusee')} title="Refuser Candidature" disabled={updatingStatusId === cand.id}>{updatingStatusId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-times-circle"></i> </>}</button>
                                        </>
                                    )}
                                     {(cand.statut === 'acceptee' || cand.statut === 'refusee') && cand.statut !== 'archivee' && (
                                        <button className="action-btn archive-btn" onClick={() => handleUpdateCandidatureStatus(cand.id, 'archivee')} title="Archiver cette candidature" disabled={updatingStatusId === cand.id}>{updatingStatusId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-archive"></i> </>}</button>
                                    )}
                                </div>
                            </div>
                            {selectedCandidatureId === cand.id && (
                                <div className="candidature-details-expanded card-style">
                                    <h4>Détails Candidature - {cand.etudiant?.prenom} {cand.etudiant?.nom} pour "{cand.offre_stage?.titre}"</h4>
                                    <div className="detail-grid">
                                        <div className="detail-info">
                                            <p><strong><i className="fas fa-envelope"></i> Email Étudiant:</strong> {cand.etudiant?.email || 'N/A'}</p>
                                            <p><strong><i className="fas fa-phone"></i> Téléphone:</strong> {cand.etudiant?.telephone || 'N/A'}</p>
                                            <p><strong><i className="fas fa-city"></i> Ville Étudiant:</strong> {cand.etudiant?.ville || 'N/A'}</p>
                                            <p><strong><i className="fas fa-comment-dots"></i> Message de Motivation:</strong></p>
                                            <pre className="cand-motivation-message">{cand.message_motivation || '(Aucun message personnalisé fourni)'}</pre>
                                        </div>
                                        <div className="detail-docs">
                                            <p><strong><i className="fas fa-folder-open"></i> Documents de l'Étudiant:</strong></p>
                                            <p>{cand.etudiant?.cv ? <a href={`${API_URL}/storage/${cand.etudiant.cv}`} target="_blank" rel="noopener noreferrer" className="file-link"><i className="fas fa-file-pdf"></i> Voir le CV</a> : ' (CV non fourni)'}</p>
                                            <p>{cand.etudiant?.lettre_motivation ? <a href={`${API_URL}/storage/${cand.etudiant.lettre_motivation}`} target="_blank" rel="noopener noreferrer" className="file-link"><i className="fas fa-file-alt"></i> Voir la Lettre</a> : ' (Lettre non fournie)'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleToggleDetails(null)} className="close-details-btn action-btn">Fermer les détails</button>
                                </div>
                            )}
                        </React.Fragment>
                    ))
                ) : (
                    <div className="no-results-container card-style">
                        <i className="fas fa-inbox fa-3x"></i>
                        <p>
                            {isLoading ? 'Chargement...' : (searchTerm || filterStatus ? 'Aucune candidature ne correspond à vos filtres.' : 'Vous n\'avez reçu aucune candidature pour le moment.')}
                        </p>
                    </div>
                )}
            </section>
         )}
      </main>
    </div>
  );
}
export default CandidaturesResponsable;