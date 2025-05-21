import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
// Assurez-vous que les chemins CSS sont corrects et que les fichiers existent
import './css/EditProfilResponsable.css';     // Styles principaux pour ce formulaire
import './css/DashboardResponsable.css'; // Pour les styles de la Navbar (si partagés)
import { useNavigate, Link } from 'react-router-dom';
// import '@fortawesome/fontawesome-free/css/all.min.css'; // Si vous utilisez des icônes Font Awesome

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function EditProfilResponsable() {
  const navigate = useNavigate();

  // --- State Variables ---
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '', // Reste vide initialement pour ne pas pré-remplir
    telephone: '',
    ville: '',
    nom_entreprise: '',
    nombre_employes: '', // Stocké comme string pour l'input, sera parsé
    services: [], // Tableau d'IDs des services sélectionnés
  });
  const [photoFile, setPhotoFile] = useState(null); // Pour le nouveau fichier photo sélectionné
  const [servicesDisponibles, setServicesDisponibles] = useState([]); // Liste de tous les services
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(''); // URL de la photo actuelle pour affichage

  // UI State
  const [loading, setLoading] = useState(true); // Pour le chargement initial
  const [isSubmitting, setIsSubmitting] = useState(false); // Pour l'état du bouton de soumission
  const [message, setMessage] = useState(''); // Pour les messages de succès ou d'erreur
  const [isError, setIsError] = useState(false); // Pour styler le message
  const [userId, setUserId] = useState(null); // ID du responsable RH connecté

  // --- Logout Handler ---
  const handleLogout = useCallback((reload = true) => {
    console.log("Déconnexion Responsable...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    if (reload) { window.location.href = '/login'; }
    else { navigate('/login'); }
  }, [navigate]);

  // --- Fetch Initial Data (Profil + Services Disponibles) ---
  useEffect(() => {
    let storedUser;
    let id;
    try {
      const userString = localStorage.getItem('user');
      const typeString = localStorage.getItem('type');
      if (!userString || typeString !== 'responsable') {
        throw new Error("Données utilisateur locales invalides ou type incorrect.");
      }
      storedUser = JSON.parse(userString);
      id = storedUser?.id;
      if (!id) {
        throw new Error("ID utilisateur local manquant.");
      }
      setUserId(id); // Stocker l'ID pour les appels API
    } catch (error) {
      console.error("Erreur d'authentification locale:", error.message);
      setMessage("Erreur d'authentification: " + error.message + ". Redirection...");
      setIsError(true);
      setLoading(false);
      setTimeout(() => handleLogout(false), 2500);
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    Promise.all([
      axios.get(`${API_URL}/api/services`), // API pour lister tous les services
      axios.get(`${API_URL}/api/responsables/${id}`) // API pour les données du responsable
    ])
    .then(([servicesRes, responsableRes]) => {
        if (Array.isArray(servicesRes.data)) {
            setServicesDisponibles(servicesRes.data);
        } else {
            console.warn("Format des services inattendu:", servicesRes.data);
            setServicesDisponibles([]);
        }

        const data = responsableRes.data;
        if (!data) {
            throw new Error("Données du profil responsable non trouvées.");
        }

        const currentServiceIds = Array.isArray(data.services)
            ? data.services.map(service => service.id).filter(id => id != null)
            : [];

        setFormData({
            nom: data.nom || '',
            prenom: data.prenom || '',
            email: data.email || '',
            mot_de_passe: '', // Important: Ne jamais pré-remplir
            telephone: data.telephone || '',
            ville: data.ville || '',
            nom_entreprise: data.nom_entreprise || '',
            nombre_employes: data.nombre_employes != null ? String(data.nombre_employes) : '',
            services: currentServiceIds,
        });
        setCurrentPhotoUrl(data.photo_profil ? `${API_URL}/storage/${data.photo_profil}` : '');
    })
    .catch(error => {
        console.error("Erreur chargement profil/services:", error.response?.data || error.message, error);
        let specificError = "Erreur lors du chargement des données.";
        // ... (gestion des erreurs comme avant) ...
        setMessage(specificError);
        setIsError(true);
        setFormData(null); // Indique que les données n'ont pu être chargées
    })
    .finally(() => {
        setLoading(false);
    });

  }, [navigate, handleLogout]); // Dépendances

  // --- Input Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setPhotoFile(file);
        // Optionnel: Afficher une prévisualisation locale de la nouvelle image
        // setCurrentPhotoUrl(URL.createObjectURL(file));
    } else {
         setPhotoFile(null);
         // Si on veut réafficher l'ancienne photo si l'utilisateur annule sa sélection
         // const userFromStorage = JSON.parse(localStorage.getItem('user'));
         // setCurrentPhotoUrl(userFromStorage?.photo_profil ? `${API_URL}/storage/${userFromStorage.photo_profil}` : '');
    }
  };

  const handleServiceChange = (e) => {
    const serviceId = parseInt(e.target.value, 10);
    const isChecked = e.target.checked;
    setFormData(prev => {
      const currentServices = prev.services || [];
      const newServices = isChecked
          ? [...currentServices, serviceId]
          : currentServices.filter(id => id !== serviceId);
      return { ...prev, services: Array.from(new Set(newServices)) };
    });
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { setMessage("ID utilisateur non identifié."); setIsError(true); return; }
    setIsSubmitting(true); setMessage(''); setIsError(false);

    const numEmployes = parseInt(formData.nombre_employes, 10);
    if (isNaN(numEmployes) || numEmployes < 0) {
      setMessage("Nombre d'employés invalide."); setIsError(true); setIsSubmitting(false); return;
    }

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'mot_de_passe' && value) { submitData.append(key, value); }
      else if (key !== 'services' && key !== 'mot_de_passe') { submitData.append(key, value ?? ''); }
    });
    if (formData.services && Array.isArray(formData.services)) {
      if (formData.services.length > 0) {
          formData.services.forEach((serviceId) => {
               submitData.append('services[]', serviceId); // Important: 'services[]'
          });
      } else {
           // Envoyer 'services' avec une valeur vide pour que sync([]) soit appelé
           submitData.append('services', '');
      }
  }
    if (photoFile) { submitData.append('photo_profil', photoFile); }

    console.log("Données envoyées pour update responsable:", Object.fromEntries(submitData.entries()));

    try {
      // L'API POST /api/responsables/{id} gère l'update côté Laravel
      const response = await axios.post(
        `${API_URL}/api/responsables/${userId}`,
        submitData,
        { headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' } }
      );

      setMessage(response.data?.message || "Profil mis à jour avec succès !");
      setIsError(false);

      if (response.data?.user) {
          const userDataFromApi = response.data.user;
          localStorage.setItem('user', JSON.stringify(userDataFromApi)); // Mettre à jour localStorage
          const updatedServiceIds = Array.isArray(userDataFromApi.services) ? userDataFromApi.services.map(s => s.id).filter(id => id != null) : [];
          setFormData({ // Mettre à jour l'état du formulaire
              nom: userDataFromApi.nom || '', prenom: userDataFromApi.prenom || '',
              email: userDataFromApi.email || '', mot_de_passe: '',
              telephone: userDataFromApi.telephone || '', ville: userDataFromApi.ville || '',
              nom_entreprise: userDataFromApi.nom_entreprise || '',
              nombre_employes: userDataFromApi.nombre_employes != null ? String(userDataFromApi.nombre_employes) : '',
              services: updatedServiceIds,
          });
          setCurrentPhotoUrl(userDataFromApi.photo_profil ? `${API_URL}/storage/${userDataFromApi.photo_profil}` : '');
      }
      setPhotoFile(null); // Réinitialiser le fichier sélectionné
      const photoInputElement = document.getElementById('photo_profil'); // Réinitialiser l'input file visuellement
      if (photoInputElement) { photoInputElement.value = null; }

    } catch (error) {
      console.error("Erreur MàJ Responsable:", error.response?.data || error.message, error);
      let errorMessage = "Erreur lors de la mise à jour.";
      if (error.response?.data?.errors) { errorMessage = Object.values(error.response.data.errors).flat().join(' '); }
      else if (error.response?.data?.message) { errorMessage = error.response.data.message; }
      else if (!error.response) { errorMessage = "Erreur réseau ou serveur indisponible."; }
      setMessage(errorMessage); setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (!formData && !loading) { return ( <div className="edit-profil-page"><header className="responsable-navbar"><div className="navbar-logo-container"><Link to="/dashboard-responsable"><img src="/logo.png" alt="Logo" className="nav-logo" /></Link></div><nav className="navbar-links"><span>Erreur</span></nav><div className="navbar-actions"><button className="logout-button" onClick={()=>handleLogout(true)}>Déconnexion</button></div></header><div className="error-container"><p><strong>{message || "Impossible de charger les données du profil."}</strong></p><Link to="/dashboard-responsable" className="submit-button" style={{textDecoration:'none'}}>Retour au Dashboard</Link></div></div> );}

  return (
    <div className="edit-profil-page">
        {/* Navbar (Supposée stylée par DashboardResponsable.css) */}
             <header className="responsable-navbar">
                <div className="navbar-brand"><Link to="/dashboard-responsable" className="navbar-logo-link"><img src="/logo.png" alt="Logo" className="nav-logo" /></Link></div>
                <nav className="rh-navbar-links">
                    <Link to="/dashboard-responsable" className={window.location.pathname === '/dashboard-responsable' ? 'active' : ''}>Tableau de Bord</Link>
                    <Link to="/responsable/MesOffresResponsable" >Mes Offres</Link>
                    <Link to="/CandidaturesResponsable" className={window.location.pathname.startsWith('/CandidaturesResponsable') ? 'active' : ''}>Candidatures</Link>
                    <Link to="/responsable/cvtheque" className={window.location.pathname.startsWith('/responsable/cvtheque') ? 'active' : ''}>CVthèque</Link>
                </nav>
                <div className="rh-navbar-actions">
                    <div className="rh-notification-icon" title="Notifications"><i className="fas fa-bell"></i></div>
                    <button className="rh-logout-button" onClick={() => handleLogout(true)}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
                </div>
            </header>

        {/* Form Container */}
        <div className="edit-profil-container">
            <h2>Modifier Mon Profil Responsable RH</h2>
            {message && <p className={`form-message ${isError ? 'error' : 'success'}`} role="alert">{message}</p>}

             {/* Prévisualisation Photo Actuelle */}
             {currentPhotoUrl && (
                 <div className="current-photo-preview">
                    <p>Photo de profil actuelle :</p>
                    <img src={currentPhotoUrl} alt="Photo de profil actuelle" />
                 </div>
             )}

            <form onSubmit={handleSubmit} className="edit-profil-form" encType="multipart/form-data" noValidate>
                {/* Champs Texte */}
                <div className="form-row">
                    <div className="form-group"><label htmlFor="nom">Nom <span className="required">*</span></label><input id="nom" type="text" name="nom" value={formData.nom} onChange={handleChange} required /></div>
                    <div className="form-group"><label htmlFor="prenom">Prénom <span className="required">*</span></label><input id="prenom" type="text" name="prenom" value={formData.prenom} onChange={handleChange} required /></div>
                </div>
                 <div className="form-row">
                    <div className="form-group"><label htmlFor="email">Email <span className="required">*</span></label><input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
                    <div className="form-group"><label htmlFor="telephone">Téléphone <span className="required">*</span></label><input id="telephone" type="tel" name="telephone" value={formData.telephone} onChange={handleChange} required pattern="[0-9]{10}" title="Format: 10 chiffres attachés"/></div>
                 </div>
                 <div className="form-row">
                    <div className="form-group"><label htmlFor="ville">Ville <span className="required">*</span></label><input id="ville" type="text" name="ville" value={formData.ville} onChange={handleChange} required /></div>
                    <div className="form-group"><label htmlFor="nom_entreprise">Nom de l'entreprise <span className="required">*</span></label><input id="nom_entreprise" type="text" name="nom_entreprise" value={formData.nom_entreprise} onChange={handleChange} required /></div>
                 </div>
                 <div className="form-row">
                     <div className="form-group"><label htmlFor="nombre_employes">Nombre d'employés <span className="required">*</span></label><input id="nombre_employes" type="number" name="nombre_employes" value={formData.nombre_employes} onChange={handleChange} required min="0" step="1" placeholder="Ex: 50"/></div>
                     <div className="form-group"><label htmlFor="mot_de_passe">Nouveau mot de passe</label><input id="mot_de_passe" type="password" name="mot_de_passe" value={formData.mot_de_passe} onChange={handleChange} placeholder="(laisser vide si inchangé)" autoComplete="new-password"/></div>
                 </div>

                <hr className="form-divider" />
                <h3>Secteur(s) d'Activité de l'Entreprise</h3>

                {/* Services Checkboxes */}
                <div className="form-group services-checkbox-group full-width">
                    <label className="sr-only" htmlFor="services-legend">Services proposés :</label>
                    <div className="checkbox-options" id="services-legend" aria-labelledby="services-legend-label">
                        {servicesDisponibles.length > 0 ? (
                            servicesDisponibles.map((service) => (
                            <div key={service.id} className="checkbox-item">
                                <input type="checkbox" id={`service-${service.id}`} value={service.id} checked={formData.services.includes(service.id)} onChange={handleServiceChange}/>
                                <label htmlFor={`service-${service.id}`}>{service.nom_service || service.nom || `Service ${service.id}`}</label>
                            </div> ))
                        ) : ( <p className="loading-text">{loading ? 'Chargement des services...' : (isError ? 'Erreur chargement services.' : 'Aucun service disponible.')}</p> )}
                    </div>
                </div>
                

                <hr className="form-divider" />
                <h3>Image de Profil</h3>

                {/* Photo Upload */}
                <div className="form-group file-group full-width">
                    <label htmlFor="photo_profil">Modifier la Photo de profil (PNG, JPG, max 2Mo)</label>
                    <input id="photo_profil" name="photo_profil" type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} aria-describedby="photo-current-info"/>
                    {currentPhotoUrl && <span id="photo-current-info" className="current-file-link">Une photo est actuellement définie. Sélectionner un nouveau fichier la remplacera.</span>}
                    {!currentPhotoUrl && <span id="photo-current-info" className="current-file-link">Aucune photo de profil actuelle. Téléchargez-en une.</span>}
                </div>

                {/* Submit Button */}
                <button type="submit" className="submit-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer les Modifications'}
                </button>
            </form>
        </div>
    </div>
  );
}
export default EditProfilResponsable;