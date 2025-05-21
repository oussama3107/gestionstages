// Filename: OffresEtudiant.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link, NavLink } from 'react-router-dom'; // Added NavLink
import './css/OffresEtudiant.css';
import './css/DashboardEtudiant.css';
// import '@fortawesome/fontawesome-free/css/all.min.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function OffresEtudiant() {
  const navigate = useNavigate();

  // --- State ---
  const [allOffers, setAllOffers] = useState([]);
  const [etudiantApplications, setEtudiantApplications] = useState([]); // To track applied offers
  const [availableServices, setAvailableServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterVille, setFilterVille] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [expandedOfferId, setExpandedOfferId] = useState(null);
  const [etudiantInfo, setEtudiantInfo] = useState(null); // Store full etudiant object
  const [applyingOfferId, setApplyingOfferId] = useState(null);
  const [applyMessage, setApplyMessage] = useState({ text: '', type: '' }); // type: 'success' or 'error'
  const [motivationMessage, setMotivationMessage] = useState(''); // For custom motivation on apply


  // --- Logout Handler ---
  const handleLogout = useCallback(() => {
    console.log("Déconnexion Etudiant...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    // localStorage.removeItem('etudiantToken'); // If specific token
    navigate('/login');
  }, [navigate]);

  // --- Fetch Initial Data (User, Offers, Services, Applications) ---
  const loadInitialData = useCallback(async () => {
    setIsLoading(true); setError(null); setApplyMessage({ text: '', type: '' });

    let etudiantDataFromStorage;
    try {
      const userString = localStorage.getItem('user');
      const typeString = localStorage.getItem('type');
      if (!userString || typeString !== 'etudiant') {
        throw new Error("Utilisateur non authentifié ou type incorrect.");
      }
      etudiantDataFromStorage = JSON.parse(userString);
      if (!etudiantDataFromStorage?.id) {
        throw new Error("ID utilisateur manquant dans les données locales.");
      }
      setEtudiantInfo(etudiantDataFromStorage);
    } catch (e) {
      setError(`Erreur d'authentification: ${e.message} Redirection...`);
      setIsLoading(false);
      setTimeout(handleLogout, 2000);
      return;
    }

    try {
      // Fetch offers (backend should ideally filter by 'publiee' and not expired)
      // Fetch services
      // Fetch student's current applications to mark offers they've already applied to
      const [offersRes, servicesRes, applicationsRes] = await Promise.all([
        axios.get(`${API_URL}/api/offres`), // Assumes backend sends only public, active offers
        axios.get(`${API_URL}/api/services`),
        axios.get(`${API_URL}/api/candidatures/etudiant`, { params: { etudiant_id: etudiantDataFromStorage.id } })
      ]);

      // Process Offers
      const offersData = offersRes.data?.data || offersRes.data; // Handle pagination or direct array
      if (Array.isArray(offersData)) {
        setAllOffers(offersData); // No client-side uniqueId mapping, use offer.id as key
      } else {
        setAllOffers([]); console.warn("Format offres inattendu:", offersRes.data);
      }

      // Process Services
      if (Array.isArray(servicesRes.data)) {
        setAvailableServices(servicesRes.data);
      } else {
        setAvailableServices([]); console.warn("Format services inattendu:", servicesRes.data);
      }

      // Process Applications
      if (Array.isArray(applicationsRes.data)) {
        setEtudiantApplications(applicationsRes.data.map(app => app.stage_id)); // Store only applied offer IDs
      } else {
        setEtudiantApplications([]); console.warn("Format candidatures inattendu:", applicationsRes.data);
      }

    } catch (err) {
      console.error("Erreur chargement données initiales (offres/services/candidatures):", err.response || err);
      let message = "Une erreur est survenue lors du chargement des données.";
       if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          message = "Session expirée ou accès non autorisé. Redirection...";
          setTimeout(handleLogout, 2000);
      } else if (err.response?.data?.message) {
          message = err.response.data.message;
      } else if (err.message) {
          message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout]); // API_URL is stable

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  // --- Filtering Logic with Applied Status ---
  const offersWithAppliedStatus = useMemo(() => {
    return allOffers.map(offer => ({
        ...offer,
        hasApplied: etudiantApplications.includes(offer.id)
    }));
  }, [allOffers, etudiantApplications]);

  const filteredOffers = useMemo(() => {
    let tempOffers = [...offersWithAppliedStatus]; // Start with offers that have the 'hasApplied' flag
    if (filterService) {
      tempOffers = tempOffers.filter(offer => String(offer.service_id) === String(filterService));
    }
    if (filterVille.trim()) {
      const lowerVille = filterVille.toLowerCase().trim();
      tempOffers = tempOffers.filter(offer => offer.ville?.toLowerCase().includes(lowerVille));
    }
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase().trim();
      tempOffers = tempOffers.filter(offer =>
        offer.titre?.toLowerCase().includes(lowerSearch) ||
        offer.description?.toLowerCase().includes(lowerSearch) ||
        offer.responsable_rh?.nom_entreprise?.toLowerCase().includes(lowerSearch) ||
        offer.ville?.toLowerCase().includes(lowerSearch) ||
        offer.departement?.toLowerCase().includes(lowerSearch) ||
        (offer.service?.nom_service && offer.service.nom_service.toLowerCase().includes(lowerSearch))
      );
    }
    return tempOffers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by most recent
  }, [searchTerm, filterService, filterVille, offersWithAppliedStatus]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOffers = filteredOffers.slice(indexOfFirstItem, indexOfLastItem);

  // --- Event Handlers ---
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setCurrentPage(1); };
  const handleServiceFilterChange = (event) => { setFilterService(event.target.value); setCurrentPage(1); };
  const handleVilleFilterChange = (event) => { setFilterVille(event.target.value); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };

  const handleToggleDetails = (offerId) => {
    const previouslyExpanded = expandedOfferId === offerId;
    setExpandedOfferId(previouslyExpanded ? null : offerId);
    setMotivationMessage(''); // Clear motivation message when toggling details

    if (!previouslyExpanded) { // If opening details
        setTimeout(() => {
            const element = document.getElementById(`offer-card-${offerId}`);
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100); // Timeout for DOM update
    }
  };

  // --- Handler pour Postuler ---
  const handlePostuler = async (offreId) => {
    if (!etudiantInfo?.id) {
      setApplyMessage({ text: "Erreur: Informations étudiant non disponibles. Veuillez vous reconnecter.", type: 'error' });
      return;
    }
    // Check if CV and Lettre de motivation exist in profile
    if (!etudiantInfo.cv || !etudiantInfo.lettre_motivation) {
        setApplyMessage({ text: "Veuillez compléter votre profil avec un CV et une lettre de motivation avant de postuler.", type: 'error'});
        // Optionally navigate to profile page:
        // setTimeout(() => navigate('/dashboard-etudiant'), 3000);
        return;
    }

    setApplyingOfferId(offreId);
    setApplyMessage({ text: '', type: '' });

    const postData = {
      etudiant_id: etudiantInfo.id,
      stage_id: offreId,
      message_motivation: motivationMessage || null, // Send custom message if provided
    };
    console.log("Envoi candidature:", postData);

    try {
        const response = await axios.post(`${API_URL}/api/candidatures`, postData/*, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('etudiantToken')}` }
        }*/);
        setApplyMessage({ text: response.data?.message || "Candidature envoyée avec succès !", type: 'success' });
        setExpandedOfferId(null); // Close details after successful application
        setMotivationMessage(''); // Clear motivation message
        // Update applied status locally
        setEtudiantApplications(prev => [...prev, offreId]);
        // Optionally reload all data or just applications:
        // loadInitialData();
    } catch (err) {
        console.error(`Erreur postuler offre ID ${offreId}:`, err.response || err.message);
        let errorMessage = "Une erreur est survenue lors de l'envoi de votre candidature.";
        if (err.response?.data?.errors) {
            errorMessage = Object.values(err.response.data.errors).flat().join(' ');
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        }
        setApplyMessage({ text: errorMessage, type: 'error' });
    } finally {
        setApplyingOfferId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return dateString; }
  };

  // --- Render ---
  if (isLoading && !etudiantInfo) { // Initial loading before user info is confirmed
    return <div className="etu-loading-indicator full-page-loader"><span className="spinner-large"></span> Chargement de votre session...</div>;
  }
  if (error && !isLoading && !etudiantInfo) { // Critical auth error
    return (
        <div className="etu-offres-page error-page">
            <div className="etu-error-message" role="alert" style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Erreur Critique</h2>
                <p>{error}</p>
                <button onClick={handleLogout} className="etu-apply-btn-card" style={{marginTop: '20px'}}>Se reconnecter</button>
            </div>
        </div>
    );
  }

  return (
    <div className="etu-offres-page">
      <header className="etu-navbar">
          <div className="navbar-brand">
              <Link to="/dashboard-etudiant" className="navbar-logo-link">
                  <img src="/logo.png" alt="Logo Plateforme" className="nav-logo" />
              </Link>
          </div>
          <nav className="navbar-links-center">
              <NavLink to="/dashboard-etudiant" className={({isActive}) => isActive ? 'active' : ''}>Mon Profil</NavLink>
              <NavLink to="/OffresEtudiant" className={({isActive}) => isActive ? 'active' : ''}>Offres de Stage</NavLink>
              <NavLink to="/MesCandidaturesEtudiant" className={({isActive}) => isActive ? 'active' : ''}>Mes Candidatures</NavLink>
          </nav>
          <div className="navbar-actions">
              {etudiantInfo && (
                  <span className="navbar-welcome-user">
                      Bonjour, {etudiantInfo.prenom || etudiantInfo.nom || 'Étudiant'}!
                  </span>
              )}
              <button className="logout-button" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Déconnexion
              </button>
          </div>
      </header>

      <main className="etu-offres-content">
        <h1>Trouvez Votre Prochaine Opportunité de Stage</h1>
        <p className="etu-page-subtitle">Parcourez les dernières offres et postulez directement.</p>

        <section className="etu-filters-bar">
           <div className="etu-filter-item etu-search-main">
             <i className="fas fa-search"></i>
             <input type="search" placeholder="Rechercher par mot-clé, entreprise, ville..." value={searchTerm} onChange={handleSearchChange} />
           </div>
           <div className="etu-filter-item">
             <label htmlFor="service-filter-v2"><i className="fas fa-briefcase"></i> Domaine:</label>
             <select id="service-filter-v2" value={filterService} onChange={handleServiceFilterChange}>
               <option value="">Tous les Domaines</option>
               {availableServices.map(s => (<option key={s.id} value={s.id}>{s.nom_service || s.nom}</option>))}
             </select>
           </div>
           <div className="etu-filter-item">
             <label htmlFor="ville-filter-v2"><i className="fas fa-map-marker-alt"></i> Ville:</label>
             <input type="text" id="ville-filter-v2" placeholder="Filtrer par ville" value={filterVille} onChange={handleVilleFilterChange} />
           </div>
        </section>

        {applyMessage.text && (<p className={`etu-apply-message ${applyMessage.type}`} role="alert">{applyMessage.text}</p>)}
        {isLoading && <div className="etu-loading-indicator"><span className="spinner-large"></span> Chargement des offres...</div>}
        {!isLoading && error && <div className="etu-error-message" role="alert">{error} <button onClick={loadInitialData} className="etu-retry-btn">Réessayer</button></div>}

        {!isLoading && !error && (
          <>
            <section className="etu-offers-list-container">
              {currentOffers.length > 0 ? (
                currentOffers.map(offer => (
                   <React.Fragment key={offer.id}>
                     <div id={`offer-card-${offer.id}`} className={`etu-offer-card ${expandedOfferId === offer.id ? 'expanded' : ''}`}>
                       <div className="etu-offer-card-main">
                            <div className="etu-offer-logo-company">
                                <div className="etu-offer-company-logo-placeholder">
                                    <i className="fas fa-building"></i>
                                </div>
                                <span className="etu-offer-company-name">{offer.responsable_rh?.nom_entreprise || 'Entreprise'}</span>
                            </div>
                           <div className="etu-offer-content">
                               <h3>{offer.titre || 'Offre de Stage'}</h3>
                               <div className="etu-offer-meta">
                                   <span><i className="fas fa-map-marker-alt"></i> {offer.ville || 'N/A'}</span>
                                   <span><i className="fas fa-clock"></i> {offer.duree ? `${offer.duree} ${offer.unite_duree || 'mois'}` : 'N/A'}</span>
                                   {offer.service?.nom_service && <span><i className="fas fa-briefcase"></i> {offer.service.nom_service}</span>}
                               </div>
                               <p className="etu-offer-description-snippet">
                                   {(offer.description || '').substring(0, 120)}{ (offer.description || '').length > 120 ? '...' : ''}
                               </p>
                           </div>
                           <div className="etu-offer-actions">
                               <button onClick={() => handleToggleDetails(offer.id)} className="etu-details-toggle-btn" aria-expanded={expandedOfferId === offer.id}>
                                   {expandedOfferId === offer.id ? 'Moins de détails' : 'Plus de détails'}
                                   <i className={`fas ${expandedOfferId === offer.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                               </button>
                               <button
                                    className={`etu-apply-btn-card ${offer.hasApplied ? 'applied' : ''}`}
                                    onClick={() => !offer.hasApplied && handleToggleDetails(offer.id)} // Open details to apply, or just show applied
                                    disabled={applyingOfferId === offer.id || offer.hasApplied}
                                >
                                   {applyingOfferId === offer.id ? <><span className="spinner-small-light"></span> Envoi...</> : (offer.hasApplied ? <><i className="fas fa-check-circle"></i> Postulé</> : 'Postuler')}
                                </button>
                           </div>
                       </div>

                        {expandedOfferId === offer.id && (
                             <div className="etu-offer-details-expanded">
                                <h4>Détails Complets de l'Offre</h4>
                                <p><strong>Description :</strong></p>
                                <pre className="etu-offer-full-description">{offer.description || 'Non spécifiée'}</pre>
                                <div className="etu-offer-details-grid">
                                    <div><strong><i className="fas fa-building"></i> Entreprise :</strong> {offer.responsable_rh?.nom_entreprise || 'N/A'}</div>
                                    <div><strong><i className="fas fa-map-marker-alt"></i> Ville :</strong> {offer.ville || 'N/A'}</div>
                                    <div><strong><i className="fas fa-clock"></i> Durée :</strong> {offer.duree ? `${offer.duree} ${offer.unite_duree || 'mois'}` : 'N/A'}</div>
                                    <div><strong><i className="fas fa-users"></i> Places :</strong> {offer.nombre_places || 'N/A'}</div>
                                    <div><strong><i className="fas fa-briefcase"></i> Service :</strong> {offer.service?.nom_service || 'N/A'}</div>
                                    <div><strong><i className="fas fa-sitemap"></i> Pôle/Département :</strong> {offer.departement || 'N/A'}</div>
                                    {offer.date_debut && <div><strong><i className="fas fa-calendar-alt"></i> Début prévu :</strong> {formatDate(offer.date_debut)}</div>}
                                    {offer.date_expiration && <div><strong><i className="fas fa-calendar-times"></i> Expire le :</strong> {formatDate(offer.date_expiration)}</div>}
                                </div>
                                {!offer.hasApplied && (
                                    <>
                                        <div className="etu-motivation-section">
                                            <label htmlFor={`motivation-${offer.id}`}>Message de motivation (Optionnel) :</label>
                                            <textarea
                                                id={`motivation-${offer.id}`}
                                                rows="3"
                                                placeholder="Ajoutez un message personnalisé pour cette candidature..."
                                                value={motivationMessage}
                                                onChange={(e) => setMotivationMessage(e.target.value)}
                                            ></textarea>
                                        </div>
                                        <div className="etu-details-actions-footer">
                                            <button
                                                className="etu-apply-btn-details"
                                                onClick={() => handlePostuler(offer.id)}
                                                disabled={applyingOfferId === offer.id}
                                            >
                                                <i className="fas fa-paper-plane"></i> 
                                                {applyingOfferId === offer.id ? 'Confirmation en cours...' : 'Confirmer et Envoyer Candidature'}
                                            </button>
                                        </div>
                                    </>
                                )}
                                {offer.hasApplied && (
                                    <p className="etu-already-applied-message">
                                        <i className="fas fa-info-circle"></i> Vous avez déjà postulé à cette offre. Consultez <Link to="/MesCandidaturesEtudiant">Mes Candidatures</Link> pour suivre son statut.
                                    </p>
                                )}
                                <button onClick={() => handleToggleDetails(null)} className="etu-close-details-btn">Fermer les détails</button>
                             </div>
                         )}
                     </div>
                    </React.Fragment>
                ))
              ) : (
                <div className="etu-no-results-container card-style">
                    <i className="fas fa-folder-open fa-3x"></i>
                    <p>
                    {isLoading ? 'Recherche en cours...' : (searchTerm || filterService || filterVille ? 'Aucune offre ne correspond à vos critères de recherche actuels.' : 'Il n\'y a aucune offre de stage publiée pour le moment. Revenez bientôt !')}
                    </p>
                    {(searchTerm || filterService || filterVille) && !isLoading && (
                        <button onClick={() => { setSearchTerm(''); setFilterService(''); setFilterVille(''); setCurrentPage(1); }} className="etu-clear-filters-btn">
                            Effacer les filtres
                        </button>
                    )}
                </div>
              )}
            </section>

            {totalPages > 1 && (
              <div className="etu-pagination-controls">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="etu-pagination-button"><i className="fas fa-chevron-left"></i> Précédent</button>
                <span className="etu-page-info">Page {currentPage} sur {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="etu-pagination-button">Suivant <i className="fas fa-chevron-right"></i></button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
export default OffresEtudiant;