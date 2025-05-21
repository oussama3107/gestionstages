import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
// Importer les DEUX fichiers CSS nécessaires
import './css/DashboardAdmin.css'; // Styles généraux du layout admin
import './css/AdminUtilisateurs.css';     // Styles spécifiques à cette page (tableau, détails)
// Importer Font Awesome si nécessaire
// import '@fortawesome/fontawesome-free/css/all.min.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function AdminUtilisateurs() {
  const navigate = useNavigate();

  // --- State ---
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminName, setAdminName] = useState("Admin");
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isActionError, setIsActionError] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [detailedUser, setDetailedUser] = useState(null); // Utilisateur affiché en détail
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Nombre d'utilisateurs par page

  // --- Logout Handler ---
  const handleLogout = useCallback((reload = true) => {
    console.log("Déconnexion Admin...");
    localStorage.removeItem('user'); localStorage.removeItem('type');
    if (reload) window.location.href = '/login'; else navigate('/login');
  }, [navigate]);

  // --- Fetch Data ---
  const fetchAllUsers = useCallback(async () => { // Renommé pour clarté
    setIsLoading(true); setError(null); setActionMessage('');

    const userType = localStorage.getItem('type');
    if (userType !== 'Administrateur') {
      setError("Accès refusé. Redirection..."); setIsLoading(false);
      setTimeout(() => handleLogout(false), 1500); return;
    }

    try {
      console.log("AdminUtilisateurs: Fetching lists...");
      const [etudiantsRes, responsablesRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/etudiants`).catch(err => { console.error("Err Etudiants:", err); return { data: [] }; }),
        axios.get(`${API_URL}/api/admin/responsables`).catch(err => { console.error("Err Responsables:", err); return { data: [] }; })
      ]);

      const etudiantsData = Array.isArray(etudiantsRes?.data) ? etudiantsRes.data : [];
      const responsablesData = Array.isArray(responsablesRes?.data) ? responsablesRes.data : [];

      const combined = [
        ...etudiantsData.map(u => ({ ...u, type: 'Etudiant', uniqueId: `etu-${u.id}` })),
        ...responsablesData.map(u => ({ ...u, type: 'Responsable', uniqueId: `res-${u.id}` }))
      ];
      combined.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setAllUsers(combined);

    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
      setError(err.message || 'Erreur chargement données.');
      setAllUsers([]);
    } finally { setIsLoading(false); }
  }, [handleLogout]); // Dépendance

  // --- Effets ---
  useEffect(() => { // Récupérer nom admin
    const userString = localStorage.getItem('user');
    const typeString = localStorage.getItem('type');
    if (userString && typeString === 'Administrateur') {
      try { setAdminName(JSON.parse(userString)?.prenom || JSON.parse(userString)?.nom || "Admin"); }
      catch (e) { console.error("Erreur parsing user admin"); }
      fetchAllUsers(); // Charger utilisateurs seulement si admin est confirmé localement
    } else {
      handleLogout(false);
    }
  }, [handleLogout, fetchAllUsers]); // Ajouter fetchAllUsers

  // --- Filtering Logic ---
  const filteredUsers = useMemo(() => {
    let tempUsers = allUsers;
    if (filterType) { tempUsers = tempUsers.filter(user => user.type === filterType); }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase().trim();
      tempUsers = tempUsers.filter(user =>
        user.nom?.toLowerCase().includes(lower) ||
        user.prenom?.toLowerCase().includes(lower) ||
        user.email?.toLowerCase().includes(lower) ||
        (user.type === 'Responsable' && user.nom_entreprise?.toLowerCase().includes(lower)) ||
        user.ville?.toLowerCase().includes(lower)
      );
    }
    return tempUsers;
  }, [searchTerm, filterType, allUsers]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsersToDisplay = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // --- Event Handlers ---
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setCurrentPage(1); };
  const handleTypeFilterChange = (event) => { setFilterType(event.target.value); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };

  // Afficher/Masquer détails sur la page
  const handleShowUserDetails = (user) => {
    console.log("Affichage détails pour:", user);
    setDetailedUser(prevUser => (prevUser?.uniqueId === user.uniqueId ? null : user));
    if (!detailedUser || detailedUser.uniqueId !== user.uniqueId) {
        setTimeout(() => document.getElementById('user-details-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };
  const handleCloseDetails = () => { setDetailedUser(null); };

  // Fonctions Helper pour avatar/initiales
  const getInitials = useCallback((fname, lname) => `${fname?.charAt(0) || ''}${lname?.charAt(0) || ''}`.toUpperCase() || "?", []);
  const handleImageError = useCallback((e, prenom, nom) => {
    e.target.onerror = null; e.target.style.display = 'none';
    const parent = e.target.parentNode;
    if (parent && !parent.querySelector('.user-avatar-initials')) {
          const initialsSpan = document.createElement('span');
          initialsSpan.className = 'user-avatar-initials';
          initialsSpan.textContent = getInitials(prenom, nom);
          parent.appendChild(initialsSpan);
    }
  }, [getInitials]);

   // Action Supprimer Utilisateur
   const handleDeleteUser = async (userId, userType, uniqueId) => {
       const confirmDelete = window.confirm(`ADMIN : Supprimer ${userType} ID: ${userId} ?`);
       if (!confirmDelete) return;
       setActionMessage(''); setIsActionError(false); setDeletingUserId(uniqueId);

       const deleteUrl = userType === 'Etudiant' ? `${API_URL}/api/etudiants/${userId}` : `${API_URL}/api/responsables/${userId}`;
       console.log(`ADMIN ACTION: DELETE ${deleteUrl}`);
       try {
           const response = await axios.delete(deleteUrl);
           setActionMessage(response.data.message || `Utilisateur ${userId} supprimé.`);
           setIsActionError(false);
           setAllUsers(prev => prev.filter(user => user.uniqueId !== uniqueId));
           if(detailedUser?.uniqueId === uniqueId) setDetailedUser(null); // Fermer détails si user supprimé
       } catch (err) {
           console.error(`Erreur suppression ${userType} ID ${userId}:`, err);
           setActionMessage(err.response?.data?.message || "Impossible de supprimer.");
           setIsActionError(true);
       } finally { setDeletingUserId(null); }
   };

   // Helper pour formater les clés
   const formatKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
   // Filtrer clés pour détails
   const filteredDetailKeys = detailedUser ? Object.keys(detailedUser).filter(key => !['id', 'uniqueId', 'mot_de_passe', 'email_verified_at', 'created_at', 'updated_at', 'photo_profil', 'cv', 'lettre_motivation', 'services', 'pivot'].includes(key) && detailedUser[key] !== null && detailedUser[key] !== undefined && detailedUser[key] !== '') : [];


  // --- Render Component ---
  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar Admin */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
            <img src="/logo.png" alt="Logo" className="sidebar-logo" />

        </div>
        <nav className="sidebar-nav">
          <ul>
            <li><Link to="/dashboard-admin" className={window.location.pathname === '/dashboard-admin' ? 'active' : ''}><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
            <li><Link to="/CandidaturesAdmin" className={window.location.pathname.startsWith('/CandidaturesAdmin') ? 'active' : ''}><i className="fas fa-file-alt"></i> Candidatures</Link></li>
            <li><Link to="/AdminUtilisateurs" className={window.location.pathname.startsWith('/AdminUtilisateurs') ? 'active' : ''}><i className="fas fa-users-cog"></i> Utilisateurs</Link></li>
            <li><Link to="/PublierOffresAdmin" className={window.location.pathname.startsWith('/PublierOffresAdmin') ? 'active' : ''}><i className="fas fa-bullhorn"></i> Gestion Offres</Link></li>
            {/* Ajouter d'autres liens (ex: gestion services) */}
          </ul>
        </nav>
        <div className="sidebar-footer">
            <button className="sidebar-logout-button" onClick={() => handleLogout(true)}>
                <i className="fas fa-sign-out-alt"></i> Déconnexion
            </button>
        </div>
      </aside>
      {/* Conteneur Principal */}
      <div className="admin-main-container">
          {/* Navbar Supérieure Admin */}
          <header className="admin-top-navbar">
              <div className="navbar-left"> <button className="sidebar-toggle-btn"><i className="fas fa-bars"></i></button> <h1 className="navbar-page-title">Gestion des Utilisateurs</h1> </div>
              <div className="navbar-right"> <div className="navbar-profile"> <i className="fas fa-user-shield admin-icon"></i> <span className="navbar-username">{adminName}</span> </div> </div>
          </header>

          {/* Contenu Principal */}
          <main className="admin-main-content">
            {/* Barre de Filtres */}
            <section className="filters-container admin-card">
                 <div className="filter-item search-filter"> <i className="fas fa-search"></i> <input type="search" placeholder="Rechercher nom, email, entreprise..." value={searchTerm} onChange={handleSearchChange} className="table-search-input"/> </div>
                 <div className="filter-item"> <label htmlFor="user-type-filter"><i className="fas fa-filter"></i> Type:</label> <select id="user-type-filter" value={filterType} onChange={handleTypeFilterChange}> <option value="">Tous</option> <option value="Etudiant">Étudiant</option> <option value="Responsable">Responsable RH</option> </select> </div>
            </section>

            {actionMessage && <p className={`action-message ${isActionError ? 'error' : 'success'}`} role="alert">{actionMessage}</p>}
            {isLoading && <div className="loading-indicator"><span className="spinner-large"></span> Chargement...</div>}
            {error && !isLoading && <div className="error-message" role="alert">{error}</div>}

            {/* Tableau des Utilisateurs */}
            {!isLoading && !error && (
              <section className="admin-user-table-section admin-card">
                <div className="table-header">
                    <h2>{filteredUsers.length} Utilisateur(s)</h2>
                </div>
                <div className="table-responsive-admin">
                    <table className="admin-data-table users">
                        <thead> <tr> <th>Utilisateur</th> <th>Contact</th> <th>Ville</th> <th>Type</th> <th>Entreprise</th> <th style={{textAlign:'right'}}>Actions</th> </tr> </thead>
                        <tbody>
                            {currentUsersToDisplay.length > 0 ? (
                                currentUsersToDisplay.map(user => (
                                    <tr key={user.uniqueId}>
                                        <td data-label="Utilisateur">
                                            <div className="user-cell">
                                                <div className="user-avatar">{user.photo_profil ? (<img src={`${API_URL}/storage/${user.photo_profil}`} alt="Profil" onError={(e) => handleImageError(e, user?.prenom, user?.nom)} />) : (<span className="user-avatar-initials">{getInitials(user?.prenom, user?.nom)}</span>)}</div>
                                                <div className="user-info"> <span className="user-name">{user.prenom} {user.nom}</span> <span className="user-email">{user.email}</span> </div>
                                            </div>
                                        </td>
                                        <td data-label="Contact">{user.telephone || '-'}</td>
                                        <td data-label="Ville">{user.ville || '-'}</td>
                                        <td data-label="Type"><span className={`user-type-badge type-${user.type?.toLowerCase()}`}>{user.type || 'N/A'}</span></td>
                                        <td data-label="Entreprise">{user.type === 'Responsable' ? (user.nom_entreprise || '-') : '-'}</td>
                                        <td data-label="Actions">
                                            <button className="admin-action-btn view" onClick={() => handleShowUserDetails(user)} title="Voir Détails" disabled={deletingUserId === user.uniqueId}><i className="fas fa-eye"></i></button>
                                            <button className="admin-action-btn delete" onClick={() => handleDeleteUser(user.id, user.type, user.uniqueId)} title="Supprimer" disabled={deletingUserId === user.uniqueId}>{deletingUserId === user.uniqueId ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}</button>
                                        </td>
                                    </tr>
                                ))
                            ) : ( <tr><td colSpan="6" className="no-results-row">{searchTerm || filterType ? 'Aucun utilisateur trouvé.' : 'Aucun utilisateur enregistré.'}</td></tr> )}
                        </tbody>
                    </table>
                </div>
                 {/* Pagination */}
                 {!isLoading && totalPages > 1 && (
                      <div className="admin-pagination-controls">
                          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><i className="fas fa-angle-left"></i> Préc.</button>
                          <span>Page <strong>{currentPage}</strong> sur {totalPages}</span>
                          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Suiv. <i className="fas fa-angle-right"></i></button>
                      </div>
                   )}
              </section>
            )}

            {/* Section Détails Utilisateur (Affichage sur la page) */}
            {detailedUser && (
                <section id="user-details-section" className="user-details-section admin-card">
                     <div className="details-header">
                        <h3>Détails - {detailedUser.prenom} {detailedUser.nom} ({detailedUser.type})</h3>
                        <button onClick={handleCloseDetails} className="close-details-inline-btn" aria-label="Fermer les détails">×</button>
                     </div>
                     <div className="details-content">
                        {detailedUser.photo_profil && (
                            <div className="details-photo-container">
                                <img src={`${API_URL}/storage/${detailedUser.photo_profil}`} alt="Profil" className="details-profile-photo" />
                            </div>
                        )}
                        <div className={`details-info-grid ${detailedUser.photo_profil ? 'with-photo' : ''}`}> {/* Classe pour ajuster grid si photo */}
                             {filteredDetailKeys.map(key => (
                                <div key={key} className="details-info-item">
                                    <span className="detail-label">{formatKey(key)}:</span>
                                    <span className="detail-value">{String(detailedUser[key])}</span>
                                </div>
                             ))}
                        </div>

                         {/* Section Spécifique Responsable */}
                         {detailedUser.type === 'Responsable' && detailedUser.services && detailedUser.services.length > 0 && (
                             <div className="details-section-specific">
                                 <h4>Services Associés</h4>
                                 <ul className="details-services-list">
                                     {detailedUser.services.map(service => ( <li key={service.id}>{service.nom_service || service.nom || '?'}</li> ))}
                                 </ul>
                             </div>
                         )}

                          {/* Section Spécifique Étudiant */}
                          {detailedUser.type === 'Etudiant' && (
                             <div className="details-section-specific">
                                 <h4>Documents</h4>
                                 <div className="details-doc-links">
                                     {detailedUser.cv ? <a href={`${API_URL}/storage/${detailedUser.cv}`} target="_blank" rel="noopener noreferrer"><i className="fas fa-file-pdf"></i> Voir CV</a> : <span>(CV Non Fourni)</span>}
                                     {detailedUser.lettre_motivation ? <a href={`${API_URL}/storage/${detailedUser.lettre_motivation}`} target="_blank" rel="noopener noreferrer"><i className="fas fa-file-alt"></i> Voir Lettre</a> : <span>(Lettre Non Fournie)</span>}
                                 </div>
                             </div>
                          )}
                     </div>
                </section>
            )}
          </main>
      </div>
    </div>
  );
}
export default AdminUtilisateurs;