import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import './css/DashboardAdmin.css'; // Importer le NOUVEAU fichier CSS
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Ajout de useLocation
// Assurez-vous que Font Awesome est importé, soit ici, soit dans votre index.js/App.js
// import '@fortawesome/fontawesome-free/css/all.min.css'; // Décommentez si besoin

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function DashboardAdmin() {
  const navigate = useNavigate();
  const location = useLocation(); // Pour la classe active des liens

  // --- State ---
  const [stats, setStats] = useState({ total: 0, etudiants: 0, responsables: 0, offresAttente: 0 });
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(8);
  const [adminName, setAdminName] = useState("Admin");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // État pour la sidebar

  // --- Récupérer Nom Admin ---
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const userType = localStorage.getItem('type');
    if (userString && userType === 'Administrateur') {
      try {
        const user = JSON.parse(userString);
        setAdminName(user?.prenom || user?.nom || "Admin");
      } catch (e) { console.error("Erreur parsing user admin"); }
    } else {
      console.warn("Tentative accès Dashboard Admin sans être loggé comme Admin (localement)");
      handleLogout(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Logout Handler ---
  const handleLogout = useCallback((reload = true) => {
    console.log("Déconnexion Admin...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    if (reload) { window.location.href = '/login'; }
    else { navigate('/login'); }
  }, [navigate]);

  // --- Fetch Data (Stats et Utilisateurs) ---
  const fetchStatsAndUsers = useCallback(async () => {
    if (localStorage.getItem('type') !== 'Administrateur') return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("DashboardAdmin: Fetching lists...");
      const [etudiantsRes, responsablesRes, offresRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/etudiants`).catch(err => { console.error("Erreur fetch etudiants:", err); return { data: [] }; }),
        axios.get(`${API_URL}/api/admin/responsables`).catch(err => { console.error("Erreur fetch responsables:", err); return { data: [] }; }),
        axios.get(`${API_URL}/api/offres`, { params: { statut: 'en_attente' } }).catch(err => { console.error("Erreur fetch offres en attente:", err); return { data: [] }; })
      ]);

      const etudiantsData = Array.isArray(etudiantsRes?.data) ? etudiantsRes.data : [];
      const responsablesData = Array.isArray(responsablesRes?.data) ? responsablesRes.data : [];
      const offresAttenteData = Array.isArray(offresRes?.data) ? offresRes.data : [];

      setStats({
        total: etudiantsData.length + responsablesData.length,
        etudiants: etudiantsData.length,
        responsables: responsablesData.length,
        offresAttente: offresAttenteData.length
      });

      const combinedUsers = [
        ...etudiantsData.filter(u => u && u.id != null).map(u => ({ ...u, type: 'Etudiant', uniqueId: `etd-${u.id}` })),
        ...responsablesData.filter(u => u && u.id != null).map(u => ({ ...u, type: 'Responsable', uniqueId: `res-${u.id}` }))
      ];
      combinedUsers.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setAllUsers(combinedUsers);

    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError(err.message || 'Erreur lors du chargement des données.');
      setAllUsers([]);
      setStats({ total: 0, etudiants: 0, responsables: 0, offresAttente: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []); // handleLogout a été retiré des dépendances car il ne change pas souvent et cause des re-render inutiles ici. handleLogout lui-même utilise useCallback.

  useEffect(() => {
    fetchStatsAndUsers();
  }, [fetchStatsAndUsers]);

  // --- Filtering Logic ---
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers;
    const lower = searchTerm.toLowerCase().trim();
    return allUsers.filter(user =>
      user.nom?.toLowerCase().includes(lower) ||
      user.prenom?.toLowerCase().includes(lower) ||
      user.email?.toLowerCase().includes(lower) ||
      user.type?.toLowerCase().includes(lower) ||
      (user.type === 'Responsable' && user.nom_entreprise?.toLowerCase().includes(lower)) ||
      user.telephone?.replace(/\s+/g, '').includes(lower.replace(/\s+/g, ''))
    );
  }, [searchTerm, allUsers]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // --- Event Handlers ---
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };
  const handleShowUserDetails = (userId, userType) => {
    console.log(`Afficher détails PUBLICS pour ${userType} ID: ${userId}`);
    alert(`Affichage détails pour ${userType} ID ${userId} (à implémenter)`);
    // navigate(`/admin/user/${userId}?type=${userType}`);
  };

  const handleDeleteUser = async (userId, userType, uniqueId) => {
    const confirmDelete = window.confirm(`Supprimer ${userType} ID: ${userId} ?`);
    if (!confirmDelete) return;

    const deleteUrl = userType === 'Etudiant'
      ? `${API_URL}/api/etudiants/${userId}`
      : `${API_URL}/api/responsables/${userId}`;

    console.log(`ADMIN ACTION: Supprimer via ${deleteUrl}`);
    try {
      const response = await axios.delete(deleteUrl);
      alert(response.data.message || "Suppression réussie.");
      setAllUsers(prev => prev.filter(user => user.uniqueId !== uniqueId));
      if (userType === 'Etudiant') setStats(prev => ({ ...prev, etudiants: prev.etudiants - 1, total: prev.total - 1 }));
      if (userType === 'Responsable') setStats(prev => ({ ...prev, responsables: prev.responsables - 1, total: prev.total - 1 }));
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(err.response?.data?.message || "Erreur suppression.");
    }
  };

  // --- Sidebar Toggle ---
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- Render ---
  return (
    <div className={`admin-dashboard-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Overlay pour fermer la sidebar sur mobile */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />

          {/* Bouton de fermeture pour mobile, à l'intérieur de la sidebar */}
           <button className="sidebar-close-btn" onClick={toggleSidebar} aria-label="Fermer la barre latérale">
                <i className="fas fa-times"></i>
            </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li><Link to="/dashboard-admin" className={location.pathname === '/dashboard-admin' ? 'active' : ''} onClick={isSidebarOpen ? toggleSidebar : undefined}><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
            <li><Link to="/CandidaturesAdmin" className={location.pathname.startsWith('/CandidaturesAdmin') ? 'active' : ''} onClick={isSidebarOpen ? toggleSidebar : undefined}><i className="fas fa-file-alt"></i> Candidatures</Link></li>
            <li><Link to="/AdminUtilisateurs" className={location.pathname.startsWith('/AdminUtilisateurs') ? 'active' : ''} onClick={isSidebarOpen ? toggleSidebar : undefined}><i className="fas fa-users-cog"></i> Utilisateurs</Link></li>
            <li><Link to="/PublierOffresAdmin" className={location.pathname.startsWith('/PublierOffresAdmin') ? 'active' : ''} onClick={isSidebarOpen ? toggleSidebar : undefined}><i className="fas fa-bullhorn"></i> Gestion Offres</Link></li>
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
        {/* Navbar Supérieure */}
        <header className="admin-top-navbar">
          <div className="navbar-left">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar} aria-label="Basculer la barre latérale">
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="navbar-page-title">Dashboard Général</h1>
          </div>
          <div className="navbar-right">
            <div className="navbar-profile">
              <i className="fas fa-user-shield admin-icon"></i>
              <span className="navbar-username">{adminName}</span>
            </div>
          </div>
        </header>

        {/* Contenu Principal */}
        <main className="admin-main-content">
          {error && !isLoading && (
            <div className="error-message" role="alert">
              {error}
              <button onClick={fetchStatsAndUsers} style={{ marginLeft: '15px', padding: '5px 10px' }}>Réessayer</button>
            </div>
          )}

          {!error && (
            <>
              {/* Section Stats */}
              <section className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-icon-background icon-total"><i className="fas fa-users"></i></div>
                  <div className="stat-content"> <span className="stat-label">Total Utilisateurs</span> <span className="stat-value">{isLoading ? '...' : stats.total}</span> </div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon-background icon-etudiant"><i className="fas fa-user-graduate"></i></div>
                  <div className="stat-content"> <span className="stat-label">Étudiants</span> <span className="stat-value">{isLoading ? '...' : stats.etudiants}</span> </div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon-background icon-responsable"><i className="fas fa-user-tie"></i></div>
                  <div className="stat-content"> <span className="stat-label">Responsables RH</span> <span className="stat-value">{isLoading ? '...' : stats.responsables}</span> </div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon-background icon-offre"><i className="fas fa-file-signature"></i></div>
                  <div className="stat-content"> <span className="stat-label">Offres en Attente</span> <span className="stat-value">{isLoading ? '...' : stats.offresAttente}</span> </div>
                </div>
              </section>

              {/* Section Tableau Utilisateurs */}
              <section className="admin-user-table-section admin-card">
                <div className="table-header">
                  <h2>Liste des Utilisateurs ({isLoading ? '...' : filteredUsers.length})</h2>
                  <div className="table-search-container"> <i className="fas fa-search search-icon"></i> <input type="search" placeholder="Rechercher..." value={searchTerm} onChange={handleSearchChange} className="table-search-input" /> </div>
                </div>
                <div className="table-responsive-admin">
                  <table className="admin-data-table">
                    <thead> <tr> <th>Nom</th><th>Prénom</th><th>Email</th><th>Téléphone</th><th>Type</th><th>Entreprise</th><th>Actions</th> </tr> </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan="7" className="loading-row">Chargement des utilisateurs...</td></tr>
                      ) : currentUsers.length > 0 ? (currentUsers.map(user => (
                        <tr key={user.uniqueId}>
                          <td data-label="Nom">{user.nom || '-'}</td>
                          <td data-label="Prénom">{user.prenom || '-'}</td>
                          <td data-label="Email">{user.email || '-'}</td>
                          <td data-label="Téléphone">{user.telephone || '-'}</td>
                          <td data-label="Type"><span className={`user-type-badge type-${user.type?.toLowerCase()}`}>{user.type || 'N/A'}</span></td>
                          <td data-label="Entreprise">{user.type === 'Responsable' ? (user.nom_entreprise || '-') : '-'}</td>
                          <td data-label="Actions">
                            <button className="admin-action-btn view" onClick={() => handleShowUserDetails(user.id, user.type)} title="Voir Détails"><i className="fas fa-eye"></i></button>
                            <button className="admin-action-btn delete" onClick={() => handleDeleteUser(user.id, user.type, user.uniqueId)} title="Supprimer"><i className="fas fa-trash-alt"></i></button>
                          </td>
                        </tr>
                      ))) : (<tr><td colSpan="7" className="no-results-row">{searchTerm ? 'Aucun utilisateur trouvé.' : 'Aucun utilisateur enregistré.'}</td></tr>)
                      }
                    </tbody>
                  </table>
                </div>
                {!isLoading && totalPages > 1 && (
                  <div className="admin-pagination-controls">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><i className="fas fa-angle-left"></i> Préc.</button>
                    <span>Page <strong>{currentPage}</strong> sur {totalPages}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Suiv. <i className="fas fa-angle-right"></i></button>
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

export default DashboardAdmin;