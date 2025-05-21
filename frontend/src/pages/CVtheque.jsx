import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './css/CVtheque.css'; // Assurez-vous que ce fichier CSS est lié
import './css/DashboardResponsable.css'; // Pour Navbar si styles communs
// import '@fortawesome/fontawesome-free/css/all.min.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function CVtheque() {
  const navigate = useNavigate();

  // --- State ---
  const [allEtudiants, setAllEtudiants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Nombre d'étudiants par page
  const [selectedEtudiantId, setSelectedEtudiantId] = useState(null); // Pour détails

  // --- Logout Handler ---
  const handleLogout = useCallback((reload = true) => {
    console.log("Déconnexion...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    if (reload) { window.location.href = '/login'; }
    else { navigate('/login'); }
  }, [navigate]);

  // --- Fetch Data ---
  const fetchEtudiants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const userType = localStorage.getItem('type');
    // L'admin et le responsable peuvent voir la CVthèque
    if (userType !== 'responsable' && userType !== 'Administrateur') {
        setError("Accès non autorisé à la CVthèque.");
        setIsLoading(false);
        setTimeout(() => handleLogout(false), 1500);
        return;
    }
    try {
      console.log("CVtheque: Fetching all etudiants via /api/admin/etudiants...");
      const response = await axios.get(`${API_URL}/api/admin/etudiants`);
      if (Array.isArray(response.data)) {
        const etudiantsAvecId = response.data.map(e => ({ ...e, uniqueId: `etd-${e.id}` }));
        // Trier par nom par défaut
        etudiantsAvecId.sort((a,b) => (a.nom || "").localeCompare(b.nom || ""));
        setAllEtudiants(etudiantsAvecId);
      } else {
          setError("Format de données étudiants inattendu.");
          setAllEtudiants([]);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des étudiants:", err);
      const message = err.response?.data?.message || err.message || 'Erreur chargement des étudiants.';
      if(err.response?.status === 404) message = "L'endpoint pour récupérer les étudiants n'a pas été trouvé.";
      setError(`Erreur: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout]); // Ajouter handleLogout comme dépendance

  // --- Effet pour charger les données au montage (après vérification type user) ---
  useEffect(() => {
    const typeString = localStorage.getItem('type');
    if (typeString === 'responsable' || typeString === 'Administrateur') {
        fetchEtudiants();
    } else {
        // Si le type n'est pas bon initialement, rediriger
        handleLogout(false);
    }
  }, [fetchEtudiants, handleLogout]); // Dépendances

  // --- Filtering Logic ---
  const filteredEtudiants = useMemo(() => {
    if (!searchTerm.trim()) return allEtudiants;
    const lower = searchTerm.toLowerCase().trim();
    return allEtudiants.filter(e =>
      e.nom?.toLowerCase().includes(lower) ||
      e.prenom?.toLowerCase().includes(lower) ||
      e.email?.toLowerCase().includes(lower) ||
      e.ville?.toLowerCase().includes(lower)
      // Ajouter d'autres champs de recherche si besoin (ex: compétences si stockées)
    );
  }, [searchTerm, allEtudiants]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredEtudiants.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEtudiantsToDisplay = filteredEtudiants.slice(indexOfFirstItem, indexOfLastItem);

  // --- Event Handlers ---
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };
  const handleToggleDetails = (etudiantId) => {
    const newSelectedId = selectedEtudiantId === etudiantId ? null : etudiantId;
    setSelectedEtudiantId(newSelectedId);
    if (newSelectedId) {
        setTimeout(() => {
            const element = document.getElementById(`etudiant-row-${etudiantId}`);
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
     }
  };

  const getInitials = useCallback((fname, lname) => {
    return `${fname?.charAt(0) || ''}${lname?.charAt(0) || ''}`.toUpperCase() || "?";
  },[]);

  const handleImageError = useCallback((e, prenom, nom) => {
      e.target.onerror = null;
      e.target.style.display = 'none';
      const parent = e.target.parentNode;
      if (parent && !parent.querySelector('.etudiant-list-initials')) { // Utiliser la classe du CSS
            const initialsSpan = document.createElement('span');
            initialsSpan.className = 'etudiant-list-initials'; // Classe définie dans CVtheque.css
            initialsSpan.textContent = getInitials(prenom, nom);
            parent.appendChild(initialsSpan);
      }
  }, [getInitials]);


  // --- Render ---
  return (
    <div className="cvtheque-page">
             <header className="responsable-navbar">
                <div className="navbar-brand"><Link to="/dashboard-responsable" className="navbar-logo-link"><img src="/logo.png" alt="Logo" className="nav-logo" /></Link></div>
                <nav className="rh-navbar-links">
                    <Link to="/dashboard-responsable" className={window.location.pathname === '/dashboard-responsable' ? 'active' : ''}>Tableau de Bord</Link>
                    <Link to="/responsable/MesOffresResponsable"className={window.location.pathname.startsWith('/responsable/MesOffresResponsable') ? 'active' : ''} >Mes Offres</Link>
                    <Link to="/CandidaturesResponsable" className={window.location.pathname.startsWith('/CandidaturesResponsable') ? 'active' : ''}>Candidatures</Link>
                    <Link to="/responsable/cvtheque" className={window.location.pathname.startsWith('/responsable/cvtheque') ? 'active' : ''}>CVthèque</Link>
                </nav>
                <div className="rh-navbar-actions">
                    <div className="rh-notification-icon" title="Notifications"><i className="fas fa-bell"></i></div>
                    <button className="rh-logout-button" onClick={() => handleLogout(true)}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
                </div>
            </header>

      {/* Contenu Principal */}
      <main className="cvtheque-content">
        <h1>CVthèque des Étudiants</h1>

        {/* Barre de Recherche */}
        <div className="cvtheque-search-container">
           <i className="fas fa-search search-icon" aria-hidden="true"></i>
           <input type="search" placeholder="Rechercher un étudiant (nom, prénom, email, ville)..." value={searchTerm} onChange={handleSearchChange} className="search-input" aria-label="Rechercher des étudiants"/>
         </div>

        {isLoading && <div className="loading-indicator"><span className="spinner-large"></span> Chargement des profils...</div>}
        {error && !isLoading && <div className="error-message" role="alert">{error}</div>}

        {!isLoading && !error && (
          <>
            <div className="table-responsive">
              <table className="etudiant-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>Photo</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Email</th>
                    <th>Ville</th>
                    <th style={{textAlign: 'right'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEtudiantsToDisplay.length > 0 ? (
                    currentEtudiantsToDisplay.map(etudiant => (
                      <React.Fragment key={etudiant.uniqueId || etudiant.id}>
                        <tr id={`etudiant-row-${etudiant.id}`}>
                          <td data-label="Photo">
                             <div className="etudiant-list-photo-container">
                                {etudiant.photo_profil ? (
                                    <img src={`${API_URL}/storage/${etudiant.photo_profil}`} alt={`Profil`} className="etudiant-list-photo" onError={(e) => handleImageError(e, etudiant.prenom, etudiant.nom)}/>
                                ) : ( <span className="etudiant-list-initials">{getInitials(etudiant.prenom, etudiant.nom)}</span> )}
                             </div>
                          </td>
                          <td data-label="Nom">{etudiant.nom || 'N/A'}</td>
                          <td data-label="Prénom">{etudiant.prenom || 'N/A'}</td>
                          <td data-label="Email">{etudiant.email || 'N/A'}</td>
                          <td data-label="Ville">{etudiant.ville || 'N/A'}</td>
                          <td data-label="Actions" style={{textAlign: 'right'}}>
                            <button
                              className="details-button" // Utiliser une classe cohérente
                              onClick={() => handleToggleDetails(etudiant.id)}
                              aria-expanded={selectedEtudiantId === etudiant.id}
                              title={selectedEtudiantId === etudiant.id ? "Masquer détails" : "Voir détails"}
                            >
                              <i className={`fas ${selectedEtudiantId === etudiant.id ? 'fa-chevron-up' : 'fa-eye'}`}></i>
                              {selectedEtudiantId !== etudiant.id && <span className="button-text-details"> Détails</span>}
                            </button>
                          </td>
                        </tr>

                        {selectedEtudiantId === etudiant.id && (
                          <tr className="etudiant-detail-row">
                            <td colSpan="6"> {/* Colspan = nombre de colonnes */}
                              <div className="etudiant-detail-content card-style"> {/* Appliquer card-style */}
                                <h4>Détails pour {etudiant.prenom} {etudiant.nom}</h4>
                                <div className="detail-grid"> {/* Utiliser la grille du CSS CVtheque */}
                                    <div className="detail-info">
                                        <p><strong>Téléphone :</strong> {etudiant.telephone || 'N/A'}</p>
                                        {/* Ajouter d'autres champs si présents et pertinents */}
                                    </div>
                                    <div className="detail-docs">
                                        <p><strong>Documents :</strong></p>
                                        <p>{etudiant.cv ? (<a href={`${API_URL}/storage/${etudiant.cv}`} target="_blank" rel="noopener noreferrer" className="file-link"><i className="fas fa-file-pdf"></i> CV</a>) : ('Non fourni')}</p>
                                        <p>{etudiant.lettre_motivation ? (<a href={`${API_URL}/storage/${etudiant.lettre_motivation}`} target="_blank" rel="noopener noreferrer" className="file-link"><i className="fas fa-file-alt"></i> Lettre</a>) : ('Non fournie')}</p>
                                    </div>
                                    {/* Afficher photo en grand si elle existe dans les détails */}
                                    {etudiant.photo_profil && (
                                        <div className="detail-photo-large-container">
                                             <img src={`${API_URL}/storage/${etudiant.photo_profil}`} alt={`Profil de ${etudiant.prenom}`} className="detail-profile-img-large"/>
                                        </div>
                                     )}
                                </div>
                                <button onClick={() => handleToggleDetails(etudiant.id)} className="close-details-button">Fermer</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-results-message">
                        {searchTerm ? 'Aucun étudiant ne correspond à votre recherche.' : 'Aucun étudiant dans la CVthèque.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
              <div className="pagination-controls">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-button prev"><i className="fas fa-angle-left"></i> Préc.</button>
                <span className="page-info">Page {currentPage} sur {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button next">Suiv. <i className="fas fa-angle-right"></i></button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
export default CVtheque;