import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Ajout de useLocation
import './css/DashboardResponsable.css'; // Assurez-vous que ce fichier CSS est lié
// Importer Font Awesome si pas globalement (ex: dans index.js ou App.js)
// import '@fortawesome/fontawesome-free/css/all.min.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function DashboardResponsable() {
  const navigate = useNavigate();
  const location = useLocation(); // Pour les liens actifs
  const [responsableData, setResponsableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State pour les Notifications ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([ // Données statiques pour démo
    { id: 1, message: "Votre offre 'Développeur Web Confirmé' a été publiée.", timestamp: new Date(Date.now() - 3600000 * 2), read: false, link: "/responsable/MesOffresResponsable" },
    { id: 2, message: "Nouvelle candidature de J. Doe pour 'Stage Marketing'.", timestamp: new Date(Date.now() - 86400000 * 1), read: false, link: "/CandidaturesResponsable" },
    { id: 3, message: "Rappel : Mettez à jour vos disponibilités.", timestamp: new Date(Date.now() - 172800000 * 3), read: true, link: "/modifier-profil-responsable"},
  ]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationIconRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // --- Logout Handler ---
  const handleLogout = useCallback((reload = true) => {
    console.log("Déconnexion Responsable...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    if (reload) { window.location.href = '/login'; }
    else { navigate('/login'); }
  }, [navigate]);

  // --- Fetch Data Profil ---
  const fetchResponsableData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const storedUser = localStorage.getItem('user');
    const storedType = localStorage.getItem('type');

    if (!storedUser || storedType !== 'responsable') {
      setError("Non autorisé ou données locales invalides. Redirection...");
      setLoading(false);
      setTimeout(() => handleLogout(false), 1500);
      return;
    }

    let user;
    let userId;
    try {
      user = JSON.parse(storedUser);
      userId = user?.id;
      if (!userId) throw new Error("ID utilisateur local manquant.");
    } catch (e) {
      setError("Erreur lecture données locales. Redirection...");
      setLoading(false);
      setTimeout(() => handleLogout(false), 1500);
      return;
    }

    console.log(`DashboardResponsable: Tentative fetch PUBLIC pour ID: ${userId}`);
    try {
      const response = await axios.get(`${API_URL}/api/responsables/${userId}`);
      if (response.data) {
        setResponsableData(response.data);
        // TODO: Fetch real notifications and update setNotifications
      } else {
        setError("Données du responsable non trouvées dans la réponse.");
        setResponsableData(null); // S'assurer que c'est null si pas de données
      }
    } catch (err) {
      console.error(`Erreur chargement responsable (ID: ${userId}):`, err);
      const status = err.response?.status;
      let message = err.response?.data?.message || err.message || "Une erreur inconnue est survenue.";
      if (status === 404) message = `Profil responsable non trouvé sur le serveur (ID: ${userId}).`;
      else if (status === 500) message = "Erreur interne du serveur lors de la récupération du profil.";
      else if (err.code === 'ERR_NETWORK') message = "Erreur réseau ou problème CORS.";
      setError(message);
      setResponsableData(null); // S'assurer que c'est null en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, [handleLogout]); // navigate est dans handleLogout

  useEffect(() => {
    fetchResponsableData();
  }, [fetchResponsableData]);


  // --- Notification Handlers ---
  const toggleNotifications = (e) => {
      e.stopPropagation();
      setShowNotifications(prev => !prev);
      if (!showNotifications && unreadCount > 0) {
           markNotificationsAsRead();
      }
  };

   const markNotificationsAsRead = () => {
       console.log("Marquage des notifications comme lues (simulation)...");
       // TODO: API call PATCH /api/responsable/notifications/mark-all-read
       setTimeout(() => {
           setNotifications(prev => prev.map(n => ({ ...n, read: true })));
       }, 500);
   };

   // Fermer dropdown si on clique en dehors
   useEffect(() => {
       const handleClickOutside = (event) => {
           if (
               showNotifications &&
               dropdownRef.current && !dropdownRef.current.contains(event.target) &&
               notificationIconRef.current && !notificationIconRef.current.contains(event.target)
           ) {
               setShowNotifications(false);
           }
       };
       if (showNotifications) {
           document.addEventListener('mousedown', handleClickOutside);
       }
       return () => {
           document.removeEventListener('mousedown', handleClickOutside);
       };
   }, [showNotifications]);


  // --- Event Handlers ---
  const handleModifierProfil = () => {
    navigate('/modifier-profil-responsable');
  };

  // --- Helper Functions ---
  const getInitials = (fname, lname) => `${fname?.charAt(0) || ''}${lname?.charAt(0) || ''}`.toUpperCase() || "RH";

  const handleImageError = (e, prenom, nom) => {
    e.target.onerror = null;
    e.target.style.display = 'none';
    const parent = e.target.parentNode;
    if (parent && !parent.querySelector('.profile-initials')) {
          const initialsSpan = document.createElement('span');
          initialsSpan.className = 'profile-initials';
          initialsSpan.textContent = getInitials(prenom, nom);
          parent.appendChild(initialsSpan);
    }
};
  const renderServicesList = (servicesData) => {
    if (!Array.isArray(servicesData) || servicesData.length === 0) {
      return <span className="no-data-italic">Non spécifiés</span>;
    }
    return (
      <ul className="services-list">
        {servicesData.map(service => (
          <li key={service.id}>
            {service?.nom_service || service?.name || service?.nom || 'Service Inconnu' }
          </li>
        ))}
      </ul>
    );
  };

  const isActiveLink = (path) => {
      if (path === "/dashboard-responsable") return location.pathname === path;
      return location.pathname.startsWith(path);
  }


  // --- Render Logic ---

  if (loading) {
    return (
        <div className="rh-dashboard-page"> {/* Utiliser la nouvelle classe */}
            <header className="responsable-navbar">
                 <div className="navbar-brand"><Link to="/dashboard-responsable" className="navbar-logo-link"><img src="/logo.png" alt="Logo" className="nav-logo" /></Link></div>
                 <nav className="rh-navbar-links"><span>Chargement...</span></nav> {/* Renommé classe */}
                 <div className="rh-navbar-actions"> {/* Renommé classe */}
                     <div className="rh-notification-icon" title="Notifications"> <i className="fas fa-bell"></i> </div>
                     <button className="rh-logout-button" disabled><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
                 </div>
            </header>
            <div className="dashboard-loading-container">Chargement du tableau de bord...</div>
        </div>
    );
  }

  if (error) {
     return (
        <div className="rh-dashboard-page">
             <header className="responsable-navbar">
                 <div className="navbar-brand"><Link to="/dashboard-responsable" className="navbar-logo-link"><img src="/logo.png" alt="Logo" className="nav-logo" /><span className="navbar-app-name">Espace RH</span></Link></div>
                 <nav className="rh-navbar-links"><span>Erreur</span></nav>
                 <div className="rh-navbar-actions">
                      <div className="rh-notification-icon" title="Notifications"> <i className="fas fa-bell"></i> </div>
                    <button className="rh-logout-button" onClick={()=>handleLogout(true)}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
                 </div>
            </header>
            <div className="dashboard-error-container">
                <p>Une erreur est survenue :</p> <p><strong>{error}</strong></p>
                <button onClick={fetchResponsableData} className="profile-edit-btn">Réessayer</button>
            </div>
        </div>
     );
  }

  if (!responsableData) { // Gérer le cas où les données ne sont toujours pas là après chargement
    return (
         <div className="rh-dashboard-page">
             <header className="responsable-navbar">
                  <div className="navbar-brand"><Link to="/dashboard-responsable" className="navbar-logo-link"><img src="/logo.png" alt="Logo" className="nav-logo" /><span className="navbar-app-name">Espace RH</span></Link></div>
                  <nav className="rh-navbar-links"><span>Données indisponibles</span></nav>
                 <div className="rh-navbar-actions">
                    <div className="rh-notification-icon" title="Notifications"> <i className="fas fa-bell"></i> </div>
                    <button className="rh-logout-button" onClick={()=>handleLogout(true)}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
                 </div>
            </header>
            <div className="dashboard-error-container">Impossible d'afficher les données du profil.</div>
        </div>
    );
  }

  // Success State - Render Dashboard
  return (
    <div className="rh-dashboard-page"> {/* Renommé classe principale */}
      {/* Navbar Moderne */}
      <header className="responsable-navbar">
        <div className="navbar-brand">
           <Link to="/dashboard-responsable" className="navbar-logo-link">
                <img src="/logo.png" alt="Logo Plateforme" className="nav-logo" />

            </Link>
        </div>
        <nav className="rh-navbar-links"> {/* Renommé classe */}
           <Link to="/dashboard-responsable" className={isActiveLink('/dashboard-responsable') ? 'active' : ''}>Tableau de Bord</Link>
           <Link to="/responsable/MesOffresResponsable" className={isActiveLink('/responsable/MesOffresResponsable') ? 'active' : ''}>Mes Offres</Link>
           <Link to="/CandidaturesResponsable" className={isActiveLink('/CandidaturesResponsable') ? 'active' : ''}>Candidatures</Link>
           <Link to="/responsable/cvtheque" className={isActiveLink('/responsable/cvtheque') ? 'active' : ''}>CVthèque</Link>
        </nav>
        <div className="rh-navbar-actions"> {/* Renommé classe */}
           <div
               ref={notificationIconRef}
               className="rh-notification-icon" // Renommé classe
               title={unreadCount > 0 ? `${unreadCount} nouvelle(s) notification(s)` : "Notifications"}
               onClick={toggleNotifications}
            >
               <i className="fas fa-bell"></i>
               {unreadCount > 0 && (
                   <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
               )}
           </div>

            {showNotifications && (
                <div ref={dropdownRef} className="notifications-dropdown">
                    <div className="notifications-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && ( <button onClick={markNotificationsAsRead} className="mark-all-read-btn">Tout lu</button> )}
                    </div>
                    {notifications.length > 0 ? (
                        <ul className="notifications-list">
                            {notifications.map(notif => (
                                <li key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                    onClick={() => {
                                        if (notif.link && notif.link !== "#") navigate(notif.link);
                                        setShowNotifications(false);
                                        setNotifications(prev => prev.map(n => n.id === notif.id ? {...n, read: true} : n));
                                    }}
                                >
                                    <p className="notification-message">{notif.message}</p>
                                    <span className="notification-timestamp">{new Date(notif.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </li>
                            ))}
                        </ul>
                     ) : ( <div className="no-notifications">Aucune notification.</div> )}
                </div>
            )}

           <button className="rh-logout-button" onClick={()=>handleLogout(true)}> {/* Renommé classe */}
               <i className="fas fa-sign-out-alt"></i> Déconnexion
           </button>
       </div>
      </header>

      {/* Main Content */}
      <main className="rh-dashboard-content"> {/* Renommé classe */}
        <div className="rh-content-header"> {/* Renommé classe */}
            <h1>Bienvenue, {responsableData.prenom || 'Responsable RH'} !</h1>
            <p>Gérez vos offres, candidatures et découvrez de nouveaux talents.</p>
        </div>

        <div className="rh-main-grid"> {/* Renommé classe */}
          <aside className="rh-profile-column"> {/* Renommé classe */}
            <div className="rh-card profile-summary-card"> {/* Renommé classe */}
                <div className="rh-profile-avatar-large"> {/* Renommé classe */}
                    {responsableData.photo_profil ? ( <img src={`${API_URL}/storage/${responsableData.photo_profil}`} alt="Profil" onError={(e) => handleImageError(e, responsableData.prenom, responsableData.nom)} /> ) : (<span className="rh-initials-large">{getInitials(responsableData.prenom, responsableData.nom)}</span>)}
                </div>
                <h3>{responsableData.prenom || ''} {responsableData.nom || ''}</h3>
                <p className="rh-profile-email">{responsableData.email}</p>
                <p className="rh-profile-company">{responsableData.nom_entreprise || 'Entreprise non spécifiée'}</p>
                <Link to="/modifier-profil-responsable" className="rh-button primary-outline full-width">Modifier le Profil</Link>
            </div>
            <div className="rh-card company-details-card"> {/* Renommé classe */}
                <h2><i className="fas fa-building"></i> Informations Entreprise</h2>
                <p><strong>Nom:</strong> <span>{responsableData.nom_entreprise || 'N/A'}</span></p>
                 <div className="services-info-section">
                     <strong>Secteurs d'activité:</strong>
                     {renderServicesList(responsableData.services)}
                 </div>
                <p style={{marginTop: '15px'}}><strong>Nb. Employés:</strong> <span>{responsableData.nombre_employes ?? 'N/A'}</span></p>
                <p><strong>Ville:</strong> <span>{responsableData.ville ?? 'N/A'}</span></p>
                <p><strong>Téléphone:</strong> <span>{responsableData.telephone ?? 'N/A'}</span></p>
            </div>
          </aside>

          <section className="rh-main-activity-column"> {/* Renommé classe */}
                 <div className="rh-stats-overview">  {/* Renommé classe */}
                    <div className="rh-stat-item"> <i className="fas fa-file-signature"></i> <div><span>Offres Actives</span><strong>0</strong></div> </div>
                    <div className="rh-stat-item"> <i className="fas fa-users"></i> <div><span>Candidatures</span><strong>{unreadCount}</strong></div> </div>
                    <div className="rh-stat-item"> <i className="fas fa-eye"></i> <div><span>Vues Profil</span><strong>0</strong></div> </div>
                 </div>
                 <h2>Actions Rapides</h2>
                 <div className="rh-quick-actions"> {/* Renommé classe */}
                     <Link to="/responsable/MesOffresResponsable" className="rh-action-card"> <i className="fas fa-plus-circle"></i> <span>Publier une Offre</span> </Link> {/* Lien vers la page correcte */}
                     <Link to="/CandidaturesResponsable" className="rh-action-card"> <i className="fas fa-inbox"></i> <span>Voir Candidatures</span></Link>
                     <Link to="/responsable/cvtheque" className="rh-action-card"> <i className="fas fa-search"></i> <span>Explorer CVthèque</span> </Link>
                 </div>
                 <h2 style={{marginTop: '40px'}}>Dernières Candidatures</h2>
                 <div className="rh-card"> <p className="no-data-italic" style={{textAlign: 'center'}}>Aucune nouvelle candidature pour le moment.</p> </div>
            </section>
        </div>
      </main>
    </div>
  );
}

export default DashboardResponsable;