// Filename: PublierOffresAdmin.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate, NavLink } from 'react-router-dom'; // Added NavLink
import './css/PublierOffresAdmin.css';
import './css/DashboardAdmin.css';
// import '@fortawesome/fontawesome-free/css/all.min.css'; // Uncomment if not globally included

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function PublierOffresAdmin() {
  const navigate = useNavigate();

  // --- State ---
  const [allOffers, setAllOffers] = useState([]);
  const [newStatusPending, setnewStatusPending] = useState([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true); // Specific loading for offers
  const [pageIsLoading, setPageIsLoading] = useState(true); // Overall page/auth loading
  const [error, setError] = useState(null);
  const [adminName, setAdminName] = useState("Admin");
  const [filterStatus, setFilterStatus] = useState('en_attente');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [isActionError, setIsActionError] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // --- Logout Handler ---
  const handleLogout = useCallback(() => {
    console.log("Déconnexion Admin...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    // localStorage.removeItem('adminToken'); // If you store an admin-specific token
    navigate('/login');
  }, [navigate]);

  // --- Fetch Data ---
  const fetchAllOffers = useCallback(async () => {
    setIsLoadingOffers(true); // Use specific loader for this async action
    setError(null); // Clear previous errors before fetching
    // setActionMessage(''); // Action messages are separate

    try {
      console.log("PublierOffresAdmin: Fetching all offers for Admin...");
      // IMPORTANT: This endpoint should be ADMIN-SPECIFIC or able to detect admin
      // to return ALL offers without public filters (e.g., only 'publiee').
      // Option 1: Dedicated Admin Endpoint (Preferred)
      // const response = await axios.get(`${API_URL}/api/admin/offres`, {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      // });
      // Option 2: General endpoint that backend modifies for admin
      const response = await axios.get(`${API_URL}/api/offres`, {
        params: { admin_view: true }, // Example: Tell backend this is an admin request
        // headers: { 'Authorization': `Bearer ${localStorage.getItem('adminAuthToken')}` } // If using tokens
      });


      // Handle if data is paginated (response.data.data) or a direct array (response.data)
      const offersData = Array.isArray(response.data?.data) ? response.data.data :
                         Array.isArray(response.data) ? response.data : null;

      if (offersData) {
        const sortedOffers = offersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAllOffers(sortedOffers);
        console.log("Admin: Offres reçues:", sortedOffers.length);
      } else {
        console.warn("PublierOffresAdmin: Format de données des offres inattendu ou aucune offre.", response.data);
        setError("Aucune offre à afficher ou format de données incorrect.");
        setAllOffers([]);
      }
    } catch (err) {
      console.error("PublierOffresAdmin: Erreur récupération offres:", err.response || err);
      let message = "Erreur lors du chargement des offres.";
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
            message = "Accès non autorisé pour récupérer les offres. Redirection...";
            setTimeout(handleLogout, 2000);
        } else if (err.response.status === 404) message = "Endpoint API pour les offres non trouvé (404).";
        else if (err.response.status === 500) message = "Erreur interne du serveur lors de la récupération des offres (500).";
        else if (err.response.data?.message) message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setAllOffers([]);
    } finally {
      setIsLoadingOffers(false);
    }
  }, [handleLogout]); // API_URL should be stable, handleLogout if auth fails

  // --- Effects ---
  useEffect(() => { // Auth check and Admin Name
    setPageIsLoading(true);
    const userString = localStorage.getItem('user');
    const typeString = localStorage.getItem('type');

    if (userString && typeString === 'Administrateur') {
      try {
        const adminData = JSON.parse(userString);
        setAdminName(adminData?.prenom || adminData?.nom || "Admin");
      } catch (e) {
        console.error("Erreur parsing user admin data from localStorage", e);
        setAdminName("Admin"); // Fallback name
      }
      setPageIsLoading(false); // Auth check passed (client-side)
    } else {
      setError("Accès réservé aux administrateurs. Redirection...");
      setPageIsLoading(false);
      setTimeout(handleLogout, 1500);
    }
  }, [handleLogout]);

  useEffect(() => { // Fetch offers after successful auth check
    if (!pageIsLoading && localStorage.getItem('type') === 'Administrateur' && !error) {
      fetchAllOffers();
    }
  }, [pageIsLoading, fetchAllOffers, error]); // Depend on pageIsLoading to ensure auth check is done


  // --- Filtering Logic ---
  const filteredOffers = useMemo(() => {
    let tempOffers = [...allOffers]; // Create a new array for manipulation
    if (filterStatus) {
      tempOffers = tempOffers.filter(offer => offer.statut === filterStatus);
    }
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      tempOffers = tempOffers.filter(offer =>
        Object.values(offer).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerSearchTerm);
          }
          if (typeof value === 'object' && value !== null) { // Check nested objects like responsableRh or service
            return Object.values(value).some(nestedValue =>
              typeof nestedValue === 'string' && nestedValue.toLowerCase().includes(lowerSearchTerm)
            );
          }
          return false;
        }) ||
        (offer.responsable_rh?.nom_entreprise?.toLowerCase().includes(lowerSearchTerm)) ||
        (offer.service?.nom_service?.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return tempOffers;
  }, [searchTerm, filterStatus, allOffers]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOffersToDisplay = filteredOffers.slice(indexOfFirstItem, indexOfLastItem);

  // --- Event Handlers ---
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setCurrentPage(1); };
  const handleStatusFilterChange = (event) => { setFilterStatus(event.target.value); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };
  const handleToggleDetails = (offerId) => { setSelectedOfferId(prevId => (prevId === offerId ? null : offerId)); };

  // --- Status Translation ---
  const getStatusLabel = (status) => {
    const labels = {
      en_attente: 'En attente', publiee: 'Publiée', brouillon: 'Brouillon',
      refusee: 'Refusée', archivee: 'Archivée', expirée: 'Expirée'
    };
    return labels[status?.toLowerCase()] || status || 'Inconnu';
  };
  const getStatusClass = (status) => {
    const classes = {
      en_attente: 'status-en_attente', publiee: 'status-publiee', brouillon: 'status-brouillon',
      refusee: 'status-refusee', archivee: 'status-archivee', expirée: 'status-expirée'
    };
    return classes[status?.toLowerCase()] || 'status-inconnu';
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return dateString; }
  };


   // --- ACTIONS ADMIN : MISE À JOUR STATUT Offre ---
   const handleUpdateOfferStatus = async (offerId, newStatus) => {
        setUpdatingStatusId(offerId);
        setActionMessage(''); setIsActionError(false);

        const offreCiblee = allOffers.find(o => o.id === offerId);
        const responsableName = offreCiblee?.responsable_rh?.prenom || offreCiblee?.responsable_rh?.nom || 'Le responsable RH';
        const offerTitle = offreCiblee?.titre || `l'offre ID ${offerId}`;

        console.log(`Admin Action: Attempting to update status of offer ID ${offerId} to '${newStatus}'`);

        try {
            // IMPORTANT: Use PUT/PATCH for updates. Ensure backend route accepts this.
            const response = await axios.put(`${API_URL}/api/offres/${offerId}`, {
                statut: newStatus,
                // Only send 'statut'. Backend should handle partial updates (e.g. 'sometimes' validation).
            }/*, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminAuthToken')}` } } */);

            console.log("API response for offer status update:", response.data);

            if (response.data && response.data.offre) {
                 setAllOffers(prevOffers => prevOffers.map(offer =>
                    offer.id === offerId ? { ...offer, ...response.data.offre } : offer // Merge with full updated offer
                ));
                setActionMessage(`Statut de l'offre '${offerTitle}' mis à jour à '${getStatusLabel(response.data.offre.statut)}'.`);
            } else { // Fallback if API response structure is different
                 setAllOffers(prevOffers => prevOffers.map(offer =>
                    offer.id === offerId ? { ...offer, statut: newStatus } : offer
                ));
                setActionMessage(`Statut de l'offre '${offerTitle}' mis à jour à '${getStatusLabel(newStatus)}'. (Réponse API partielle)`);
            }
            setIsActionError(false);
            // Simulate notifications (replace with actual backend email logic)
            if (newStatus === 'publiee') {
                console.log(`SIMULATION: Notification envoyée à ${responsableName} pour publication de "${offerTitle}".`);
            } else if (newStatus === 'refusee') {
                console.log(`SIMULATION: Notification envoyée à ${responsableName} pour refus de "${offerTitle}".`);
            }

        } catch (error) {
             console.error(`Erreur màj statut offre ID ${offerId}:`, error.response || error);
             let errorMessage = "Erreur lors de la mise à jour du statut de l'offre.";
             if (error.response?.data?.errors) errorMessage = Object.values(error.response.data.errors).flat().join(' ');
             else if (error.response?.data?.message) errorMessage = error.response.data.message;
             else if (error.message) errorMessage = error.message;
             setActionMessage(errorMessage);
             setIsActionError(true);
        } finally {
            setUpdatingStatusId(null);
        }
   };

   // --- ACTION ADMIN : SUPPRIMER OFFRE ---
   const handleDeleteOffer = async (offerId, offerTitle = 'cette offre') => {
        const confirmDelete = window.confirm(`ADMIN : Êtes-vous sûr de vouloir supprimer définitivement l'offre "${offerTitle}" (ID: ${offerId}) ?`);
        if (!confirmDelete) return;

        setActionMessage(''); setIsActionError(false); setDeletingId(offerId);
        console.log(`Admin Action: Attempting to delete offer ID ${offerId}`);

         try {
            const response = await axios.delete(`${API_URL}/api/offres/${offerId}`/*, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminAuthToken')}` }
            }*/);
            setActionMessage(response.data?.message || `Offre ID ${offerId} ("${offerTitle}") supprimée avec succès.`);
            setIsActionError(false);
            setAllOffers(prev => prev.filter(offer => offer.id !== offerId));
        } catch (err) {
             console.error(`Erreur suppression offre ID ${offerId}:`, err.response || err);
             setActionMessage(err.response?.data?.message || "Impossible de supprimer l'offre. Elle pourrait avoir des candidatures associées.");
             setIsActionError(true);
        } finally {
            setDeletingId(null);
        }
   };


  // --- Render Logic ---
  if (pageIsLoading) {
     return <div className="loading-indicator full-page-loader"><span className="spinner-large"></span> Vérification de la session administrateur...</div>;
  }

  if (error && !isLoadingOffers && !allOffers.length) { // Critical error preventing display
    return (
      <div className="admin-dashboard-layout error-page">
        <div className="admin-main-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <main className="admin-main-content">
            <div className="error-message" role="alert" style={{ textAlign: 'center' }}>
              <h2>Erreur de chargement</h2>
              <p>{error}</p>
              <button onClick={handleLogout} className="admin-action-btn" style={{marginTop: '20px'}}>Retour à la connexion</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
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

      <div className="admin-main-container">
          <header className="admin-top-navbar">
              <div className="navbar-left">
                {/* <button className="sidebar-toggle-btn" aria-label="Ouvrir sidebar"><i className="fas fa-bars"></i></button> */}
                <h1 className="navbar-page-title">Gestion & Publication des Offres</h1>
              </div>
              <div className="navbar-right">
                <div className="navbar-profile">
                    <i className="fas fa-user-shield admin-icon"></i>
                    <span className="navbar-username">{adminName}</span>
                </div>
              </div>
          </header>

          <main className="admin-main-content">
            <section className="filters-container admin-card">
                 <div className="filter-item search-filter">
                    <i className="fas fa-search"></i>
                    <input type="search" placeholder="Rechercher (titre, entreprise, ville...)" value={searchTerm} onChange={handleSearchChange} className="table-search-input"/>
                 </div>
                 <div className="filter-item">
                    <label htmlFor="status-filter"><i className="fas fa-filter"></i> Filtrer par Statut:</label>
                    <select id="status-filter" value={filterStatus} onChange={handleStatusFilterChange}>
                        <option value="">Tous les statuts</option>
                        <option value="en_attente">En attente de validation</option>
                        <option value="publiee">Publiée</option>
                        <option value="refusee">Refusée</option>
                        <option value="brouillon">Brouillon (non soumis)</option>
                        <option value="archivee">Archivée</option>
                        <option value="expirée">Expirée (logique)</option>
                    </select>
                 </div>
            </section>

            {actionMessage && <p className={`action-message ${isActionError ? 'error' : 'success'}`} role="alert">{actionMessage}</p>}
            {isLoadingOffers && <div className="loading-indicator"><span className="spinner-large"></span> Chargement des offres...</div>}
            {!isLoadingOffers && error && <div className="error-message" role="alert">{error} <button onClick={fetchAllOffers}>Réessayer</button></div>}

            {!isLoadingOffers && !error && (
              <>
                <section className="admin-offre-table-section admin-card">
                    <div className="table-header">
                        <h2>{filteredOffers.length} Offre(s) {filterStatus ? `(${getStatusLabel(filterStatus)})` : ''} {searchTerm ? 'correspondant à la recherche' : ''}</h2>
                    </div>
                    <div className="table-responsive-admin">
                        <table className="admin-data-table offres">
                            <thead><tr>
                              <th>Titre de l'Offre</th>
                              <th>Entreprise (RH)</th>
                              <th>Ville</th>
                              <th>Statut Actuel</th>
                              <th>Date Création</th>
                              <th style={{textAlign:'center', minWidth: '220px'}}>Actions Administrateur</th></tr></thead>
                            <tbody>
                                {currentOffersToDisplay.length > 0 ? (
                                    currentOffersToDisplay.map(offer => (
                                        <React.Fragment key={offer.id}>
                                            <tr>
                                                <td data-label="Titre">{offer.titre || 'N/A'}</td>
                                                <td data-label="Entreprise">{offer.responsable_rh?.nom_entreprise || 'N/A'} <small>({offer.responsable_rh?.nom || 'RH non spécifié'})</small></td>
                                                <td data-label="Ville">{offer.ville || 'N/A'}</td>
                                                <td data-label="Statut"><span className={`offer-status-badge ${getStatusClass(offer.statut)}`}>{getStatusLabel(offer.statut)}</span></td>
                                                <td data-label="Créée le">{formatDate(offer.created_at)}</td>
                                                <td data-label="Actions" className="admin-actions-cell1">
                                                    <button className="admin-action-btn view" onClick={() => handleToggleDetails(offer.id)} title="Voir Détails" disabled={updatingStatusId === offer.id || deletingId === offer.id}><i className="fas fa-eye"></i></button>

                                                    {offer.statut === 'en_attente' && (
                                                        <button className="admin-action-btn publish" onClick={() => handleUpdateOfferStatus(offer.id, 'publiee')} title="Valider et Publier" disabled={updatingStatusId === offer.id || deletingId === offer.id}>{updatingStatusId === offer.id && newStatusPending === 'publiee' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle"></i>}</button>
                                                    )}
                                                    {offer.statut === 'publiee' && (
                                                        <button className="admin-action-btn archive" onClick={() => handleUpdateOfferStatus(offer.id, 'archivee')} title="Archiver (ne plus afficher publiquement)" disabled={updatingStatusId === offer.id || deletingId === offer.id}>{updatingStatusId === offer.id && newStatusPending === 'archivee' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-archive"></i>}</button>
                                                    )}
                                                     {(offer.statut === 'en_attente' || offer.statut === 'brouillon') && ( // Can refuse if pending or draft
                                                        <button className="admin-action-btn reject" onClick={() => handleUpdateOfferStatus(offer.id, 'refusee')} title="Refuser la publication" disabled={updatingStatusId === offer.id || deletingId === offer.id}> {updatingStatusId === offer.id && newStatusPending === 'refusee' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times-circle"></i>} </button>
                                                     )}
                                                     {(offer.statut === 'refusee' || offer.statut === 'archivee' || offer.statut === 'expirée') && ( // Can re-evaluate if refused/archived
                                                        <button className="admin-action-btn review" onClick={() => handleUpdateOfferStatus(offer.id, 'en_attente')} title="Ré-évaluer (remettre en attente)" disabled={updatingStatusId === offer.id || deletingId === offer.id}> {updatingStatusId === offer.id && newStatusPending === 'en_attente' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-undo"></i>} </button>
                                                     )}
                                                    <button className="admin-action-btn delete" onClick={() => handleDeleteOffer(offer.id, offer.titre)} title="Supprimer Définitivement" disabled={updatingStatusId === offer.id || deletingId === offer.id}>{deletingId === offer.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}</button>
                                                </td>
                                            </tr>
                                            {selectedOfferId === offer.id && (
                                                <tr className="admin-offre-detail-row">
                                                    <td colSpan="6">
                                                        <div className="admin-offre-detail-content">
                                                            <h4>Détails de l'offre : {offer.titre}</h4>
                                                            <p><strong>ID Offre :</strong> {offer.id}</p>
                                                            <p><strong>Description :</strong> <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'inherit'}}>{offer.description || 'N/A'}</pre></p>
                                                            <p><strong>Entreprise :</strong> {offer.responsable_rh?.nom_entreprise || 'Non spécifié'} (Contact RH: {offer.responsable_rh?.nom || ''} {offer.responsable_rh?.prenom || ''} - {offer.responsable_rh?.email || 'Email non disponible'})</p>
                                                            <p><strong>Service :</strong> {offer.service?.nom_service || 'N/A'}</p>
                                                            <p><strong>Département/Pôle :</strong> {offer.departement || 'N/A'}</p>
                                                            <p><strong>Ville :</strong> {offer.ville || 'N/A'}</p>
                                                            <p><strong>Durée :</strong> {offer.duree ? `${offer.duree} ${offer.unite_duree || 'mois'}` : 'N/A'}</p>
                                                            <p><strong>Nombre de Places :</strong> {offer.nombre_places || 'N/A'}</p>
                                                            <p><strong>Date de début souhaitée :</strong> {offer.date_debut ? formatDate(offer.date_debut) : 'Non spécifiée'}</p>
                                                            <p><strong>Date d'expiration de l'offre :</strong> {offer.date_expiration ? formatDate(offer.date_expiration) : 'Non spécifiée'}</p>
                                                            <p><strong>Créée le :</strong> {formatDate(offer.created_at)} | <strong>Dernière MàJ :</strong> {formatDate(offer.updated_at)}</p>
                                                            <button onClick={() => handleToggleDetails(null)} className="close-details-btn admin-action-btn">Fermer les détails</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : ( <tr><td colSpan="6" className="no-results-row">{!isLoadingOffers && (searchTerm || filterStatus) ? 'Aucune offre ne correspond à vos filtres.' : 'Aucune offre à gérer pour le moment.'}</td></tr> )}
                            </tbody>
                        </table>
                    </div>
                    {!isLoadingOffers && totalPages > 1 && (
                        <div className="admin-pagination-controls">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><i className="fas fa-angle-left"></i> Précédent</button>
                            <span>Page <strong>{currentPage}</strong> sur {totalPages}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Suivant <i className="fas fa-angle-right"></i></button>
                        </div>
                    )}
                </section>
              </>
            )}
          </main>
      </div>
    </div>
  );
}
export default PublierOffresAdmin;