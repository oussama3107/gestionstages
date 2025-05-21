import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import './css/CandidaturesAdmin.css';    // Styles spécifiques à cette page
import './css/DashboardAdmin.css'; // Styles du layout général
// import '@fortawesome/fontawesome-free/css/all.min.css'; // Assurez-vous d'inclure Font Awesome

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function CandidaturesAdmin() {
  const navigate = useNavigate();

  // --- State ---
  const [allCandidatures, setAllCandidatures] = useState([]); // Données de la page actuelle
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminName, setAdminName] = useState("Admin");
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidatureId, setSelectedCandidatureId] = useState(null);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15); // Nombre d'items par page, doit correspondre au backend
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // --- Logout Handler ---
  const handleLogout = useCallback((reload = true) => {
    console.log("Déconnexion Admin...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    if (reload) { window.location.href = '/login'; }
    else { navigate('/login'); }
  }, [navigate]);

  // --- Fetch Data ---
  const loadAllCandidatures = useCallback(async (pageToLoad = 1) => {
    setIsLoading(true); setError(null);
    // Ne pas effacer actionMessage ici pour qu'il persiste entre les chargements de page

    const userType = localStorage.getItem('type');
    if (userType !== 'Administrateur') {
      setError("Accès non autorisé. Redirection..."); setIsLoading(false);
      setTimeout(handleLogout, 1500); return;
    }

    const params = {
        page: pageToLoad,
        per_page: itemsPerPage,
        // Pour filtrage serveur (à implémenter côté backend) :
        // ...(filterStatus && { statut: filterStatus }),
        // ...(searchTerm.trim() && { search: searchTerm.trim() }),
    };

    try {
      console.log(`CandidaturesAdmin: Fetching page ${pageToLoad} via /api/admin/candidatures with params:`, params);
      const response = await axios.get(`${API_URL}/api/admin/candidatures`, { params });
      console.log("API Response /api/admin/candidatures:", response.data);

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const candidaturesData = response.data.data;
        // Le tri par created_at devrait être géré par le backend avec paginate
        setAllCandidatures(candidaturesData); // L'uniqueId n'est plus nécessaire si cand.id est la clé
        setCurrentPage(response.data.current_page || 1);
        setTotalPages(response.data.last_page || 1);
        setTotalItems(response.data.total || 0);
      } else if (Array.isArray(response.data)) { // Fallback si réponse non paginée
        console.warn("CandidaturesAdmin: Received non-paginated array.");
        setAllCandidatures(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        setCurrentPage(1); setTotalPages(Math.ceil(response.data.length / itemsPerPage)); setTotalItems(response.data.length);
      } else {
        setAllCandidatures([]); setError("Format de données candidatures inattendu.");
        setCurrentPage(1); setTotalPages(1); setTotalItems(0);
      }
    } catch (err) {
      console.error("Erreur chargement toutes candidatures:", err.response || err);
      let message = "Erreur lors du chargement des candidatures.";
       if (err.response) {
            if(err.response.status === 404) message = `Endpoint API '/api/admin/candidatures' non trouvé. Vérifiez routes/api.php.`;
            else if (err.response.status === 401 || err.response.status === 403) { message = "Accès non autorisé ou session expirée. Redirection..."; setTimeout(handleLogout, 2000); }
            else if (err.response.status === 500) message = "Erreur interne du serveur (500). Consultez les logs Laravel.";
            else message = err.response.data?.message || `Erreur ${err.response.status}.`;
       } else { message = err.message || 'Erreur de connexion ou de configuration.'; }
      setError(message); setAllCandidatures([]); setCurrentPage(1); setTotalPages(1); setTotalItems(0);
    } finally { setIsLoading(false); }
  }, [handleLogout, itemsPerPage /* , filterStatus, searchTerm */]);


  // --- Effets ---
  useEffect(() => { // Récupérer nom admin
    const userString = localStorage.getItem('user');
    const typeString = localStorage.getItem('type');
    if (userString && typeString === 'Administrateur') {
      try { setAdminName(JSON.parse(userString)?.prenom || JSON.parse(userString)?.nom || "Admin"); }
      catch (e) { console.error("Erreur parsing user admin data"); }
    } else { handleLogout(); }
  }, [handleLogout]);

  useEffect(() => { // Charger data quand page change (ou au montage initial via currentPage=1)
    if (localStorage.getItem('type') === 'Administrateur') {
        loadAllCandidatures(currentPage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // Ne dépend que de currentPage pour la pagination serveur


  // --- Filtering Logic (Client-side sur les données de la page actuelle) ---
  const filteredCandidatures = useMemo(() => {
    let tempCandidatures = [...allCandidatures];
    if (filterStatus) { tempCandidatures = tempCandidatures.filter(c => c.statut === filterStatus); }
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      tempCandidatures = tempCandidatures.filter(c =>
        c.etudiant?.nom?.toLowerCase().includes(lowerSearchTerm) ||
        c.etudiant?.prenom?.toLowerCase().includes(lowerSearchTerm) ||
        c.etudiant?.email?.toLowerCase().includes(lowerSearchTerm) ||
        c.offreStage?.titre?.toLowerCase().includes(lowerSearchTerm) ||
        c.offreStage?.responsable_rh?.nom_entreprise?.toLowerCase().includes(lowerSearchTerm) // `responsable_rh` est le nom de la relation dans Offre.php
      );
    }
    return tempCandidatures;
  }, [searchTerm, filterStatus, allCandidatures]);

  // Les items à afficher sont ceux filtrés
  const currentItemsToDisplay = filteredCandidatures;


  // --- Event Handlers & Helpers ---
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); /* Si filtrage serveur, setCurrentPage(1); */ };
  const handleStatusFilterChange = (event) => { setFilterStatus(event.target.value); /* Si filtrage serveur, setCurrentPage(1); */ };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) { setSelectedCandidatureId(null); setCurrentPage(newPage); } };
  const handleToggleDetails = (candidatureId) => { setSelectedCandidatureId(prevId => (prevId === candidatureId ? null : candidatureId)); };
  const getInitials = (fname, lname) => `${fname?.charAt(0) || ''}${lname?.charAt(0) || ''}`.toUpperCase() || "P";
  const handleImageError = (e, prenom, nom) => { e.target.onerror = null; e.target.style.display = 'none'; const parent = e.target.parentNode; if (parent && !parent.querySelector('.cand-avatar-initials')) { const iS = document.createElement('span'); iS.className = 'cand-avatar-initials'; iS.textContent = getInitials(prenom, nom); parent.appendChild(iS);} };
  const getStatusLabel = (status) => { const l = {'envoyee': 'Reçue','vue': 'Consultée','entretien_planifie': 'Entretien Planifié','entretien_effectue': 'Entretien Effectué','acceptee': 'Acceptée','refusee': 'Refusée','archivee': 'Archivée'}; return l[status?.toLowerCase()] || status || 'Inconnu'; };
  const getStatusClass = (status) => { const c = {'envoyee': 'status-envoyee','vue': 'status-vue','entretien_planifie': 'status-entretien','entretien_effectue': 'status-entretien-ok','acceptee': 'status-acceptee','refusee': 'status-refusee','archivee': 'status-archivee'}; return c[status?.toLowerCase()] || 'status-inconnu'; };
  const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); } catch(e) { return dateString; } };

   // --- ACTIONS ADMIN : UPDATE STATUS & DELETE ---
   const handleUpdateCandidatureStatus = async (candidatureId, newStatus) => {
    setUpdatingStatusId(candidatureId); setActionMessage({ text: '', type: '' });
    const candCiblee = allCandidatures.find(c => c.id === candidatureId);
    const etudiantName = candCiblee?.etudiant?.prenom || 'l\'étudiant(e)';
    try {
        const response = await axios.patch(`${API_URL}/api/candidatures/${candidatureId}/status`, { statut: newStatus });
        if (response.data?.candidature) { loadAllCandidatures(currentPage); } // Recharger la page actuelle
        let successMsg = `Statut de la candidature ID ${candidatureId} mis à jour à '${getStatusLabel(newStatus)}'.`;
        if (newStatus === 'acceptee' && candCiblee?.etudiant?.email) successMsg += ` Email envoyé à ${etudiantName}.`;
        setActionMessage({ text: successMsg, type: 'success' });
    } catch (error) { setActionMessage({ text: error.response?.data?.message || "Erreur màj statut.", type: 'error' }); }
    finally { setUpdatingStatusId(null); }
   };

   const handleDeleteCandidature = async (candidatureId, etudiantName = 'cette') => {
        if (!window.confirm(`Supprimer la candidature de ${etudiantName} (ID: ${candidatureId}) ?`)) return;
        setActionMessage({ text: '', type: '' }); setDeletingId(candidatureId);
        try {
            const response = await axios.delete(`${API_URL}/api/candidatures/${candidatureId}`);
            setActionMessage({ text: response.data?.message || `Candidature ID ${candidatureId} supprimée.`, type: 'success' });
            loadAllCandidatures(currentPage); // Recharger
        } catch (err) { setActionMessage({ text: err.response?.data?.message || "Erreur suppression.", type: 'error' }); }
        finally { setDeletingId(null); }
   };


  // --- Render ---
  if (isLoading && !adminName && !error) { // Attente vérification admin
    return <div className="loading-indicator full-page-loader"><span className="spinner-large"></span> Vérification de session...</div>;
  }

  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar Admin */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
            <Link to="/dashboard-admin"><img src="/logo.png" alt="Logo" className="sidebar-logo" /></Link>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li><NavLink to="/dashboard-admin" className={({isActive}) => isActive ? "active" : ""}><i className="fas fa-tachometer-alt"></i> Dashboard</NavLink></li>
            <li><NavLink to="/CandidaturesAdmin" className={({isActive}) => isActive ? "active" : ""}><i className="fas fa-file-alt"></i> Candidatures</NavLink></li>
            <li><NavLink to="/AdminUtilisateurs" className={({isActive}) => isActive ? "active" : ""}><i className="fas fa-users-cog"></i> Utilisateurs</NavLink></li>
            <li><NavLink to="/PublierOffresAdmin" className={({isActive}) => isActive ? "active" : ""}><i className="fas fa-bullhorn"></i> Gestion Offres</NavLink></li>
          </ul>
        </nav>
        <div className="sidebar-footer">
            <button className="sidebar-logout-button" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Déconnexion
            </button>
        </div>
      </aside>
      {/* Conteneur Principal */}
      <div className="admin-main-container">
          <header className="admin-top-navbar">
              <div className="navbar-left"> <button className="sidebar-toggle-btn" aria-label="Basculer sidebar"><i className="fas fa-bars"></i></button> <h1 className="navbar-page-title">Gestion de Toutes les Candidatures</h1> </div>
              <div className="navbar-right"> <div className="navbar-profile"> <i className="fas fa-user-shield admin-icon"></i> <span className="navbar-username">{adminName}</span> </div> </div>
          </header>

          <main className="admin-main-content">
            <section className="filters-container admin-card">
                 <div className="filter-item search-filter"> <i className="fas fa-search"></i> <input type="search" placeholder="Filtrer étudiant, offre, entreprise..." value={searchTerm} onChange={handleSearchChange} className="table-search-input"/> </div>
                 <div className="filter-item"> <label htmlFor="cand-admin-status-filter"><i className="fas fa-filter"></i> Statut:</label> <select id="cand-admin-status-filter" value={filterStatus} onChange={handleStatusFilterChange}> <option value="">Tous</option> <option value="envoyee">Reçue</option> <option value="vue">Consultée</option> <option value="entretien">Entretien</option> <option value="acceptee">Acceptée</option> <option value="refusee">Refusée</option> <option value="archivee">Archivée</option> </select> </div>
            </section>

            {actionMessage.text && <p className={`action-message ${actionMessage.type}`} role="alert">{actionMessage.text}</p>}
            {isLoading && <div className="loading-indicator admin-card"><span className="spinner-large"></span> Chargement...</div>}
            {error && !isLoading && <div className="error-message admin-card" role="alert"><p>{error}</p><button onClick={() => loadAllCandidatures(1)} className="action-btn primary">Réessayer</button></div>}

            {!isLoading && !error && (
              <section className="admin-candidatures-table-section admin-card">
                <div className="table-header">
                     <h2> {totalItems > 0 ? `${totalItems} Candidatures au total.` : ''} {filterStatus || searchTerm ? ` (${currentItemsToDisplay.length} affichée(s) après filtres)` : (totalItems > 0 ? ` Page ${currentPage}/${totalPages}` : '')} </h2>
                </div>
                <div className="table-responsive-admin">
                    <table className="admin-data-table candidatures">
                        <thead> <tr> <th>Étudiant</th> <th>Offre Postulée</th> <th>Entreprise</th> <th>Date Réception</th> <th>Statut</th> <th style={{textAlign:'center', minWidth:'210px'}}>Actions</th> </tr> </thead>
                         <tbody>
                            {currentItemsToDisplay.length > 0 ? (
                                currentItemsToDisplay.map(cand => (
                                    <React.Fragment key={cand.id}>
                                        <tr>
                                            <td data-label="Étudiant"> <div className="user-cell"> <div className="user-avatar cand-etudiant-avatar">{cand.etudiant?.photo_profil ? (<img src={`${API_URL}/storage/${cand.etudiant.photo_profil}`} alt={`Profil ${cand.etudiant.prenom}`} onError={(e) => handleImageError(e, cand.etudiant?.prenom, cand.etudiant?.nom)} />) : (<span className="cand-avatar-initials">{getInitials(cand.etudiant?.prenom, cand.etudiant?.nom)}</span>)}</div> <div className="user-info"> <span className="user-name">{cand.etudiant?.prenom} {cand.etudiant?.nom}</span> <span className="user-email">{cand.etudiant?.email}</span> </div> </div> </td>
                                            {/* Vérifier si la relation est offre_stage ou offreStage */}
                                            <td data-label="Offre">{cand.offreStage?.titre || cand.offre_stage?.titre || `ID Offre: ${cand.offre_stage_id || cand.stage_id}`}</td>
                                            <td data-label="Entreprise">{cand.offreStage?.responsableRh?.nom_entreprise || cand.offre_stage?.responsable_rh?.nom_entreprise || 'N/A'}</td>
                                            <td data-label="Date Réception">{formatDate(cand.created_at)}</td>
                                            <td data-label="Statut"><span className={`application-status-badge ${getStatusClass(cand.statut)}`}>{getStatusLabel(cand.statut)}</span></td>
                                            <td data-label="Actions" className="admin-actions-cell">
                                                <button className="admin-action-btn view" onClick={() => handleToggleDetails(cand.id)} title="Voir Détails" disabled={updatingStatusId === cand.id || deletingId === cand.id}><i className="fas fa-eye"></i></button>
                                                {cand.statut !== 'acceptee' && cand.statut !== 'refusee' && cand.statut !== 'archivee' && (<> <button className="admin-action-btn accept" onClick={() => handleUpdateCandidatureStatus(cand.id, 'acceptee')} title="Accepter" disabled={updatingStatusId === cand.id}>{updatingStatusId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle"></i>}</button> <button className="admin-action-btn reject" onClick={() => handleUpdateCandidatureStatus(cand.id, 'refusee')} title="Refuser" disabled={updatingStatusId === cand.id}>{updatingStatusId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times-circle"></i>}</button> </>)}
                                                {cand.statut === 'envoyee' && ( <button className="admin-action-btn mark-viewed" onClick={() => handleUpdateCandidatureStatus(cand.id, 'vue')} title="Marquer Vue" disabled={updatingStatusId === cand.id}>{updatingStatusId === cand.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-eye"></i>}</button> )}
                                                 {(cand.statut === 'acceptee' || cand.statut === 'refusee') && cand.statut !== 'archivee' && (<button className="admin-action-btn archive" onClick={() => handleUpdateCandidatureStatus(cand.id, 'archivee')} title="Archiver" disabled={updatingStatusId === cand.id}><i className="fas fa-archive"></i></button> )}
                                                <button className="admin-action-btn delete" onClick={() => handleDeleteCandidature(cand.id, `${cand.etudiant?.prenom} ${cand.etudiant?.nom}`)} title="Supprimer" disabled={deletingId === cand.id || updatingStatusId === cand.id}><i className="fas fa-trash-alt"></i></button>
                                            </td>
                                        </tr>
                                        {selectedCandidatureId === cand.id && ( <tr className="admin-cand-detail-row"><td colSpan="6"><div className="admin-cand-detail-content">
                                        <h4>Détails Candidature - {cand.etudiant?.prenom} {cand.etudiant?.nom} pour "{cand.offreStage?.titre || cand.offre_stage?.titre}"</h4><div className="detail-grid"><div className="detail-info"><p><strong><i className="fas fa-briefcase"></i> Offre:</strong> {cand.offreStage?.titre || cand.offre_stage?.titre}</p><p><strong><i className="fas fa-building"></i> Entreprise:</strong> {cand.offreStage?.responsableRh?.nom_entreprise || cand.offre_stage?.responsable_rh?.nom_entreprise}</p><hr style={{margin: '10px 0', borderTop: '1px solid #eee'}}/><p><strong><i className="fas fa-user"></i> Étudiant:</strong> {cand.etudiant?.prenom} {cand.etudiant?.nom}</p><p><strong><i className="fas fa-envelope"></i> Email:</strong> {cand.etudiant?.email}</p><p><strong><i className="fas fa-phone"></i> Téléphone:</strong> {cand.etudiant?.telephone}</p><p><strong><i className="fas fa-city"></i> Ville:</strong> {cand.etudiant?.ville}</p><p><strong><i className="fas fa-comment-dots"></i> Motivation:</strong></p><pre className="cand-motivation-message">{cand.message_motivation || '(Aucun)'}</pre></div><div className="detail-docs"><p><strong><i className="fas fa-folder-open"></i> Documents:</strong></p><p>{cand.etudiant?.cv ? <a href={`${API_URL}/storage/${cand.etudiant.cv}`} target="_blank" rel="noopener noreferrer" className="file-link"><i className="fas fa-file-pdf"></i> CV</a> : '(CV N/A)'}</p>
                                        <p>{cand.etudiant?.lettre_motivation ? <a href={`${API_URL}/storage/${cand.etudiant.lettre_motivation}`} target="_blank" rel="noopener noreferrer" className="file-link"><i className="fas fa-file-alt"></i> Voir la Lettre</a> : ' (Lettre non fournie)'}</p>
                                        </div></div><button onClick={() => handleToggleDetails(null)} className="close-details-btn action-btn"><i className="fas fa-times"></i> Fermer</button></div></td></tr>)}
                                    </React.Fragment>
                                ))
                            ) : ( <tr><td colSpan="6" className="no-results-row">{isLoading ? 'Recherche...' : (searchTerm || filterStatus ? 'Aucune candidature trouvée.' : 'Aucune candidature.')}</td></tr> )}
                        </tbody>
                    </table>
                </div>
                 {!isLoading && totalPages > 1 && (
                    <div className="admin-pagination-controls">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading}><i className="fas fa-angle-left"></i> Préc.</button>
                        <span>Page <strong>{currentPage}</strong> / {totalPages} (Total: {totalItems})</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading}>Suiv. <i className="fas fa-angle-right"></i></button>
                    </div>
                 )}
              </section>
            )}
          </main>
      </div>
    </div>
  );
}
export default CandidaturesAdmin;