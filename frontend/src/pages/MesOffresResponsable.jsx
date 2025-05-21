// Filename: MesOffresResponsable.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './css/MesOffresResponsable.css';
import './css/DashboardResponsable.css'; // For shared Navbar styles
import { villesMaroc } from './data/villes'; // Adjust path if necessary
// import '@fortawesome/fontawesome-free/css/all.min.css'; // If needed

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// --- Composant Interne pour le Formulaire d'Offre ---
function OffreForm({
  initialData = null,
  onSubmit,
  onCancel,
  servicesDisponibles = [],
  isSubmitting = false,
  nomEntrepriseDuResponsable = ''
}) {
    const defaultFormData = useMemo(() => ({
        titre: '',
        description: '',
        departement: '',
        duree: '',
        unite_duree: 'mois',
        nombre_places: '1',
        ville: '',
        service_id: '',
        date_debut: '',
        date_expiration: '',
    }), []);

    const [formData, setFormData] = useState(defaultFormData);
    const [formErrors, setFormErrors] = useState({});
    const [villeSuggestions, setVilleSuggestions] = useState([]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                titre: initialData.titre || '',
                description: initialData.description || '',
                departement: initialData.departement || '',
                duree: initialData.duree != null ? String(initialData.duree) : '',
                unite_duree: initialData.unite_duree || 'mois',
                nombre_places: initialData.nombre_places != null ? String(initialData.nombre_places) : '1',
                ville: initialData.ville || '',
                service_id: initialData.service_id || '',
                // Assuming dates from backend are ISO strings (e.g., "2024-08-15T00:00:00.000000Z")
                // Or already YYYY-MM-DD if cast to 'date:Y-m-d' in Laravel model
                date_debut: initialData.date_debut ? initialData.date_debut.split('T')[0] : '',
                date_expiration: initialData.date_expiration ? initialData.date_expiration.split('T')[0] : '',
            });
        } else {
            setFormData(defaultFormData);
        }
    }, [initialData, defaultFormData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'ville') {
            const searchTerm = value.toLowerCase().trim();
            if (searchTerm) {
                const filtered = (villesMaroc || []).filter(villeObj =>
                    (typeof villeObj === 'string' ? villeObj.toLowerCase() : (villeObj.nom || '').toLowerCase())
                    .startsWith(searchTerm)
                );
                setVilleSuggestions(filtered.slice(0, 7));
            } else {
                setVilleSuggestions([]);
            }
        } else {
            if (villeSuggestions.length > 0) setVilleSuggestions([]);
        }

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleVilleSuggestionClick = (villeName) => {
        setFormData(prev => ({ ...prev, ville: villeName }));
        setVilleSuggestions([]);
        if (formErrors.ville) setFormErrors(prev => ({ ...prev, ville: null }));
    };

    const validateForm = useCallback(() => {
        const errors = {};
        if (!formData.titre.trim()) errors.titre = "Titre requis.";
        if (!formData.description.trim()) errors.description = "Description requise.";
        if (!formData.duree.trim() || isNaN(parseInt(formData.duree, 10)) || parseInt(formData.duree, 10) <= 0) {
            errors.duree = "Durée (nombre entier positif) requise.";
        }
        if (!formData.unite_duree) errors.unite_duree = "Unité de durée requise.";
        if (!formData.nombre_places.trim() || isNaN(parseInt(formData.nombre_places, 10)) || parseInt(formData.nombre_places, 10) <= 0) {
            errors.nombre_places = "Nombre de places (entier positif) requis.";
        }
        if (!formData.ville.trim()) errors.ville = "Ville requise.";
        if (!formData.service_id) errors.service_id = "Service requis.";

        if (formData.date_debut && formData.date_expiration && new Date(formData.date_expiration) < new Date(formData.date_debut)) {
            errors.date_expiration = "Date d'expiration doit être après ou égale à la date de début.";
        }
        // Optional: Check if date_debut is in the past (ignoring time part)
        if (formData.date_debut) {
            const today = new Date();
            today.setHours(0,0,0,0); // Set to start of today
            if (new Date(formData.date_debut) < today) {
                 // errors.date_debut = "Date de début ne peut pas être dans le passé."; // Enable if strict past dates are not allowed
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit({
                ...formData,
                duree: parseInt(formData.duree, 10),
                nombre_places: parseInt(formData.nombre_places, 10),
                // Send empty strings as null for optional date fields if backend expects null
                date_debut: formData.date_debut || null,
                date_expiration: formData.date_expiration || null,
            });
        }
    };

    return (
        <div className="mo-offre-form-overlay" onClick={onCancel}>
            <div className="mo-offre-form-container" onClick={e => e.stopPropagation()}>
                <div className="mo-form-header">
                    <h2>{initialData ? "Modifier l'Offre" : "Publier une Nouvelle Offre"}</h2>
                    <button onClick={onCancel} className="mo-close-form-btn" aria-label="Fermer">×</button>
                </div>
                <form onSubmit={handleFormSubmit} className="mo-actual-form" noValidate>
                    <div className="mo-form-section">
                        <div className="mo-form-group">
                            <label htmlFor="form-nom_entreprise_display">Entreprise</label>
                            <input type="text" id="form-nom_entreprise_display" value={nomEntrepriseDuResponsable || "Non disponible"} readOnly className="mo-form-input mo-disabled-input"/>
                        </div>
                    </div>
                    <div className="mo-form-row">
                        <div className="mo-form-group"><label htmlFor="form-titre">Titre de l'offre <span className="required">*</span></label><input type="text" id="form-titre" name="titre" value={formData.titre} onChange={handleChange} required className='mo-form-input'/>{formErrors.titre && <span className="mo-error-text">{formErrors.titre}</span>}</div>
                        <div className="mo-form-group"><label htmlFor="form-service_id">Service Concerné <span className="required">*</span></label><select id="form-service_id" name="service_id" value={formData.service_id} onChange={handleChange} required className='mo-form-input'><option value="" disabled>-- Sélectionner --</option>{servicesDisponibles.map(s => <option key={s.id} value={s.id}>{s.nom_service || s.nom}</option>)}</select>{formErrors.service_id && <span className="mo-error-text">{formErrors.service_id}</span>}</div>
                    </div>
                    <div className="mo-form-group"><label htmlFor="form-departement">Département/Pôle (Optionnel)</label><input type="text" id="form-departement" name="departement" value={formData.departement} onChange={handleChange} placeholder="Ex: Marketing Digital" className='mo-form-input'/></div>
                    <div className="mo-form-group"><label htmlFor="form-description">Description <span className="required">*</span></label><textarea id="form-description" name="description" value={formData.description} onChange={handleChange} rows="4" required className='mo-form-input'></textarea>{formErrors.description && <span className="mo-error-text">{formErrors.description}</span>}</div>

                    <div className="mo-form-row">
                        <div className="mo-form-group"><label htmlFor="form-duree">Durée <span className="required">*</span></label><input type="number" id="form-duree" name="duree" value={formData.duree} onChange={handleChange} placeholder="Ex: 6" min="1" required className='mo-form-input'/>{formErrors.duree && <span className="mo-error-text">{formErrors.duree}</span>}</div>
                        <div className="mo-form-group">
                            <label htmlFor="form-unite_duree">Unité de Durée <span className="required">*</span></label>
                            <select id="form-unite_duree" name="unite_duree" value={formData.unite_duree} onChange={handleChange} required className='mo-form-input'>
                                <option value="mois">Mois</option>
                                <option value="semaines">Semaines</option>
                                <option value="jours">Jours</option>
                            </select>
                            {formErrors.unite_duree && <span className="mo-error-text">{formErrors.unite_duree}</span>}
                        </div>
                        <div className="mo-form-group"><label htmlFor="form-nombre_places">Nb. Places <span className="required">*</span></label><input type="number" id="form-nombre_places" name="nombre_places" value={formData.nombre_places} onChange={handleChange} min="1" required className='mo-form-input'/>{formErrors.nombre_places && <span className="mo-error-text">{formErrors.nombre_places}</span>}</div>
                    </div>

                    <div className="mo-form-group">
                        <label htmlFor="form-ville">Ville <span className="required">*</span></label>
                        <div className="ville-container-form">
                            <input id="form-ville" type="text" name="ville" value={formData.ville} onChange={handleChange} autoComplete="off" required className='mo-form-input' placeholder="Commencez à taper..."/>
                            {villeSuggestions.length > 0 && (
                                <ul className="suggestions-list-form">
                                    {villeSuggestions.map((villeObj, index) => {
                                        const villeName = typeof villeObj === 'string' ? villeObj : villeObj.nom;
                                        const villeKey = typeof villeObj === 'string' ? `${villeName}-${index}` : villeObj.id || `${villeName}-${index}`;
                                        return (
                                            <li key={villeKey} onClick={() => handleVilleSuggestionClick(villeName)} onKeyDown={(e)=>{if(e.key==='Enter' || e.key===' ') handleVilleSuggestionClick(villeName)}} tabIndex={0}>{villeName}</li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        {formErrors.ville && <span className="mo-error-text">{formErrors.ville}</span>}
                    </div>

                    <div className="mo-form-row">
                        <div className="mo-form-group">
                            <label htmlFor="form-date_debut">Date de Début (Optionnel)</label>
                            <input type="date" id="form-date_debut" name="date_debut" value={formData.date_debut} onChange={handleChange} className='mo-form-input'/>
                            {formErrors.date_debut && <span className="mo-error-text">{formErrors.date_debut}</span>}
                        </div>
                        <div className="mo-form-group">
                            <label htmlFor="form-date_expiration">Date d'Expiration (Optionnel)</label>
                            <input type="date" id="form-date_expiration" name="date_expiration" value={formData.date_expiration} onChange={handleChange} className='mo-form-input'/>
                            {formErrors.date_expiration && <span className="mo-error-text">{formErrors.date_expiration}</span>}
                        </div>
                    </div>

                    <div className="mo-form-actions">
                        <button type="button" onClick={onCancel} className="mo-form-button mo-cancel-button">Annuler</button>
                        <button type="submit" disabled={isSubmitting} className="mo-form-button mo-submit-button">
                            {isSubmitting ? (<><span className="spinner-small"></span> Envoi...</>) : (initialData ? 'Mettre à jour' : 'Soumettre')}
                        </button>
                    </div>
                    <p className="mo-form-note">Votre offre sera soumise à l'administrateur pour validation (si statut "En attente").</p>
                </form>
            </div>
        </div>
    );
}


// --- Composant Principal MesOffresResponsable ---
function MesOffresResponsable() {
    const navigate = useNavigate();
    const [responsableInfo, setResponsableInfo] = useState(null);
    const [myOffers, setMyOffers] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [responsableId, setResponsableId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [isSubmitError, setIsSubmitError] = useState(false);
    const [processingOfferId, setProcessingOfferId] = useState(null); // For individual card spinners

    const handleLogout = useCallback(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('type');
        navigate('/login');
    }, [navigate]);

    const loadInitialData = useCallback(async () => {
        if (!responsableId) {
            console.log("Attente ID responsable pour charger données.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSubmitMessage(''); // Clear previous submission messages

        try {
            const [offersRes, servicesRes] = await Promise.all([
                axios.get(`${API_URL}/api/offres`, { params: { responsable_id: responsableId } }),
                axios.get(`${API_URL}/api/services`) // Assuming this fetches all services for the dropdown
            ]);

            if (Array.isArray(offersRes.data?.data || offersRes.data)) { // Handle paginated or direct array
                const offersData = offersRes.data?.data || offersRes.data;
                const sorted = offersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setMyOffers(sorted);
            } else {
                setMyOffers([]);
                console.warn("Réponse offres inattendue:", offersRes.data);
            }

            if (Array.isArray(servicesRes.data)) {
                setAllServices(servicesRes.data);
            } else {
                setAllServices([]);
                console.warn("Réponse services inattendue:", servicesRes.data);
            }
        } catch (err) {
            console.error("Erreur lors du chargement des offres/services du RH:", err);
            setError("Une erreur est survenue lors du chargement de vos données. Veuillez réessayer.");
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setError("Session expirée ou non autorisé. Redirection...");
                setTimeout(handleLogout, 2000);
            }
        } finally {
            setIsLoading(false);
        }
    }, [responsableId, handleLogout]);

    useEffect(() => {
        let userIdFromStorage;
        let userObjFromStorage;
        try {
            const userString = localStorage.getItem('user');
            const typeString = localStorage.getItem('type');
            if (!userString || typeString !== 'responsable') {
                throw new Error("Utilisateur non connecté ou type incorrect.");
            }
            userObjFromStorage = JSON.parse(userString);
            userIdFromStorage = userObjFromStorage?.id;
            if (!userIdFromStorage) {
                throw new Error("ID utilisateur manquant dans les données locales.");
            }
            setResponsableId(userIdFromStorage);
            setResponsableInfo(userObjFromStorage);
        } catch (e) {
            console.error("Erreur lecture données locales:", e.message);
            setError("Erreur de session ou données utilisateur invalides. Redirection...");
            setIsLoading(false);
            setTimeout(handleLogout, 1500);
            return;
        }
    }, [handleLogout]);

    useEffect(() => {
        if (responsableId) {
            loadInitialData();
        }
    }, [responsableId, loadInitialData]);

    const handleShowAddForm = () => {
        setEditingOffer(null);
        setSubmitMessage('');
        setIsSubmitError(false);
        setShowForm(true);
    };

    const handleShowEditForm = (offer) => {
        setEditingOffer(offer);
        setSubmitMessage('');
        setIsSubmitError(false);
        setShowForm(true);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingOffer(null);
    };

    const handleFormSubmit = async (formDataFromComponent) => {
        if (!responsableId) {
            setSubmitMessage("Erreur critique: ID du responsable non disponible.");
            setIsSubmitError(true);
            return;
        }
        setIsSubmittingForm(true);
        setSubmitMessage('');
        setIsSubmitError(false);
        setProcessingOfferId(editingOffer ? editingOffer.id : 'new-submission');

        const isEditing = !!editingOffer;
        const dataToSend = {
            ...formDataFromComponent,
            responsable_rh_id: responsableId,
            // If editing, keep current status unless changed by admin
            // If new, default to 'en_attente' or 'brouillon' as per backend logic
            statut: isEditing ? (formDataFromComponent.statut || editingOffer.statut) : 'en_attente',
        };

        // Your backend might require a specific way to handle updates (e.g. _method: 'PUT') if using POST
        const url = isEditing ? `${API_URL}/api/offres/${editingOffer.id}` : `${API_URL}/api/offres`;
        const method = isEditing ? 'put' : 'post';

        // Prepare headers, e.g., for auth token
        const headers = {
            'Accept': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // Example
        };

        try {
            const response = await axios({ method, url, data: dataToSend, headers });
            setSubmitMessage(response.data?.message || `Offre ${isEditing ? 'mise à jour' : 'ajoutée'} avec succès.`);
            setIsSubmitError(false);
            setShowForm(false);
            setEditingOffer(null);
            loadInitialData(); // Reload data to show changes
        } catch (err) {
            let msg = `Erreur lors de ${isEditing ? 'la mise à jour' : "l'ajout"} de l'offre.`;
            if (err.response?.data?.errors) {
                msg = Object.values(err.response.data.errors).flat().join(' ');
            } else if (err.response?.data?.message) {
                msg = err.response.data.message;
            } else if (err.message) {
                msg = err.message;
            }
            console.error("Erreur soumission formulaire offre:", err.response || err);
            setSubmitMessage(msg);
            setIsSubmitError(true);
        } finally {
            setIsSubmittingForm(false);
            setProcessingOfferId(null);
        }
    };

    const handleDeleteOffer = async (offerId, offerTitre) => {
        // Removed restriction on deleting 'publiee' offers from client-side, let backend handle if necessary.
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'offre "${offerTitre}" (ID: ${offerId}) ? Cette action est irréversible.`)) return;

        setProcessingOfferId(offerId);
        setSubmitMessage('');
        setIsSubmitError(false);

        const headers = { /* 'Authorization': `Bearer ${localStorage.getItem('authToken')}` */ };

        try {
            const response = await axios.delete(`${API_URL}/api/offres/${offerId}`, { headers });
            setSubmitMessage(response.data?.message || 'Offre supprimée avec succès.');
            setIsSubmitError(false);
            // Optimistically update UI or reload
            setMyOffers(prev => prev.filter(offer => offer.id !== offerId));
            // loadInitialData(); // Or reload data fully
        } catch (err) {
            setSubmitMessage(err.response?.data?.message || "Erreur lors de la suppression de l'offre.");
            setIsSubmitError(true);
            console.error("Erreur suppression offre:", err.response || err);
        } finally {
            setProcessingOfferId(null);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            brouillon: 'Brouillon', en_attente: 'En Attente', publiee: 'Publiée',
            refusee: 'Refusée', archivee: 'Archivée', expirée: 'Expirée'
        };
        return labels[status] || status;
    };

    const getStatusClass = (status) => {
        const classes = {
            brouillon: 'status-draft', en_attente: 'status-pending', publiee: 'status-published',
            refusee: 'status-rejected', archivee: 'status-archived', expirée: 'status-expired'
        };
        return classes[status] || 'status-default';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return dateString; // Fallback
        }
    };


    if (isLoading && !responsableInfo && !error) return <div className="loading-fullpage">Chargement des informations utilisateur...</div>;
    if (error && !responsableId) { // If auth failed critically
        return <div className="mo-page error-page"><p className="mo-error-message-list">{error}</p><button onClick={handleLogout}>Retour à la connexion</button></div>;
    }
    if (!responsableInfo && !isLoading && !error) return <div className="mo-page"><p>Aucune information utilisateur disponible.</p><button onClick={handleLogout}>Se connecter</button></div>;


    return (
        <div className="mo-page">
             <header className="responsable-navbar">
                <div className="navbar-brand">
                    <Link to="/dashboard-responsable" className="navbar-logo-link">
                        <img src="/logo.png" alt="Logo" className="nav-logo" />
                    </Link>
                </div>
                <nav className="rh-navbar-links">
                    <NavLink to="/dashboard-responsable" className={({isActive}) => isActive ? 'active' : ''}>Tableau de Bord</NavLink>
                    <NavLink to="/responsable/MesOffresResponsable" className={({isActive}) => isActive ? 'active' : ''}>Mes Offres</NavLink>
                    <NavLink to="/CandidaturesResponsable" className={({isActive}) => isActive ? 'active' : ''}>Candidatures</NavLink>
                    <NavLink to="/responsable/cvtheque" className={({isActive}) => isActive ? 'active' : ''}>CVthèque</NavLink>
                </nav>
                <div className="rh-navbar-actions">
                    <div className="rh-notification-icon" title="Notifications"><i className="fas fa-bell"></i></div>
                    <button className="rh-logout-button" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
                </div>
            </header>

            <main className="mo-content-area">
                <div className="mo-header">
                    <h1>Gestion de Mes Offres</h1>
                    <button onClick={handleShowAddForm} className="mo-add-offer-btn" disabled={isSubmittingForm || isLoading}>
                        <i className="fas fa-plus-circle"></i> Publier une Nouvelle Offre
                    </button>
                </div>

                {submitMessage && <p className={`mo-form-submit-message ${isSubmitError ? 'error' : 'success'}`}>{submitMessage}</p>}

                {isLoading && <div className="mo-loading-indicator"><span className="spinner-large"></span> Chargement des offres...</div>}

                {!isLoading && error && !showForm && <div className="mo-error-message-list">{error} <button onClick={loadInitialData}>Réessayer</button></div>}

                {!isLoading && !error && (
                    <div className="mo-offers-grid">
                        {myOffers.length > 0 ? (
                            myOffers.map(offer => (
                                <div key={offer.id} className="mo-offer-card dashboard-card">
                                    <div className="mo-offer-card-top">
                                        <span className={`mo-offer-status ${getStatusClass(offer.statut)}`}>{getStatusLabel(offer.statut)}</span>
                                        <span className="mo-offer-date">Créée: {formatDate(offer.created_at)}</span>
                                    </div>
                                    <div className="mo-offer-card-content">
                                        <h3>{offer.titre || 'Offre sans titre'}</h3>
                                        <p className="mo-offer-location-dept">
                                            <i className="fas fa-map-marker-alt"></i> {offer.ville || 'N/A'}
                                            {offer.departement && <> <span>•</span> <i className="fas fa-building"></i> {offer.departement}</>}
                                        </p>
                                        <p className="mo-offer-details-summary">
                                            {offer.service?.nom_service && <span><i className="fas fa-concierge-bell"></i> {offer.service.nom_service}</span>}
                                            <span><i className="fas fa-clock"></i> {offer.duree} {offer.unite_duree || 'mois'}</span>
                                            <span><i className="fas fa-users"></i> {offer.nombre_places} pl.</span>
                                        </p>
                                        {offer.date_debut && <p className="mo-offer-dates"><i className="fas fa-calendar-alt"></i> Début: {formatDate(offer.date_debut)} {offer.date_expiration && ` - Exp: ${formatDate(offer.date_expiration)}`}</p>}
                                        <p className="mo-offer-description-preview">{(offer.description || '').substring(0, 100)}{ (offer.description || '').length > 100 ? '...' : ''}</p>
                                    </div>
                                    <div className="mo-offer-card-actions">
                                        {(offer.statut === 'brouillon' || offer.statut === 'en_attente' || offer.statut === 'refusee') && ( // Allow editing for these statuses
                                            <>
                                                <button onClick={() => handleShowEditForm(offer)} className="mo-action-btn edit" disabled={processingOfferId === offer.id || isSubmittingForm}>
                                                    {processingOfferId === offer.id && isSubmittingForm ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-pencil-alt"></i>} Modif.
                                                </button>
                                                <button onClick={() => handleDeleteOffer(offer.id, offer.titre)} className="mo-action-btn delete" disabled={processingOfferId === offer.id || isSubmittingForm}>
                                                    {processingOfferId === offer.id && !isSubmittingForm && !isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>} Suppr.
                                                </button>
                                            </>
                                        )}
                                        <Link to={`/offres/${offer.id}`} className="mo-action-btn view" target="_blank" rel="noopener noreferrer">
                                            <i className="fas fa-eye"></i> Voir
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : ( !isLoading && !error && <p className="mo-no-offers-message">Vous n'avez pas encore créé d'offres.</p> )}
                    </div>
                )}

                 {showForm && responsableInfo && (
                    <OffreForm
                        key={editingOffer ? `edit-${editingOffer.id}` : 'add-new-offre'}
                        initialData={editingOffer}
                        onSubmit={handleFormSubmit}
                        onCancel={handleCancelForm}
                        servicesDisponibles={allServices}
                        isSubmitting={isSubmittingForm && (processingOfferId === 'new-submission' || (editingOffer && processingOfferId === editingOffer.id))}
                        nomEntrepriseDuResponsable={responsableInfo.nom_entreprise || ''}
                    />
                 )}
            </main>
        </div>
    );
}
export default MesOffresResponsable;