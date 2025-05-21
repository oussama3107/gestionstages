import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faCheckCircle, faTimesCircle, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; // Ajout icônes mot de passe
import './css/Register.css';
// Importer villesMaroc qui est maintenant un tableau d'objets {id, nom}
import { villesMaroc } from './data/villes';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Register() {
  const navigate = useNavigate();
  const initialFormData = {
    nom: '', prenom: '', email: '', mot_de_passe: '', ville: '', telephone: '',
    nom_entreprise: '', nombre_employes: '', lettre_motivation: null, cv: null, services: [], photo_profil: null,
  };

  const [type, setType] = useState(''); // 'etudiant' ou 'responsable'
  const [villeSuggestions, setVilleSuggestions] = useState([]); // Contiendra des objets {id, nom}
  const [servicesList, setServicesList] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Pour la soumission du formulaire
  const [showVilleSuggestions, setShowVilleSuggestions] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // État pour afficher/masquer mot de passe
  const villeInputRef = useRef(null); // Référence pour le conteneur du champ ville

  // Charger les services disponibles au montage
  useEffect(() => {
    axios.get(`${API_URL}/api/services`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          // Trier les services par nom pour un affichage ordonné
          setServicesList(res.data.sort((a, b) => a.nom_service.localeCompare(b.nom_service)));
        } else {
          setServicesList([]);
          console.warn("Format services inattendu de l'API");
        }
      })
      .catch((err) => {
        console.error('Erreur chargement services:', err);
        setMessage('Erreur de chargement de la liste des services.');
        setIsError(true);
      });
  }, []);

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value, files, type: inputType } = e.target;

    if (name === 'ville') {
      const inputValue = value;
      setFormData(prev => ({ ...prev, ville: inputValue }));
      const searchTerm = inputValue.toLowerCase().trim();
      if (searchTerm) {
        const filtered = (villesMaroc || [])
          .filter(villeObj => villeObj && typeof villeObj.nom === 'string' && villeObj.nom.toLowerCase().includes(searchTerm))
          .sort((a, b) => a.nom.localeCompare(b.nom));
        setVilleSuggestions(filtered.slice(0, 7));
        setShowVilleSuggestions(filtered.length > 0);
      } else {
        setVilleSuggestions([]);
        setShowVilleSuggestions(false);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: inputType === 'file' ? (files ? files[0] : null) : value
      }));
      if (name !== 'ville') setShowVilleSuggestions(false);
    }
  };

  // Gérer la sélection d'un service (checkbox)
  const handleServiceChange = (serviceId) => {
    setFormData(prev => {
      const currentServices = Array.isArray(prev.services) ? prev.services : [];
      const serviceIdNum = parseInt(serviceId, 10);
      const newServices = currentServices.includes(serviceIdNum)
        ? currentServices.filter(sId => sId !== serviceIdNum)
        : [...currentServices, serviceIdNum];
      return { ...prev, services: Array.from(new Set(newServices)) }; // Assurer unicité
    });
  };

  // Gérer le clic sur une suggestion de ville
  const handleSuggestionClick = (villeObjet) => {
    setFormData(prev => ({ ...prev, ville: villeObjet.nom }));
    setVilleSuggestions([]);
    setShowVilleSuggestions(false);
    // Tenter de donner le focus au champ mot de passe
    const passwordField = document.getElementById('mot_de_passe');
    if (passwordField) passwordField.focus();
  };

  // Gérer la sélection du type de profil
  const handleProfileSelection = (profileType) => {
    setType(profileType);
    setFormData(initialFormData); // Réinitialiser le formulaire à chaque changement de type
    setMessage('');
    setIsError(false);
    setShowVilleSuggestions(false);
  };

  // Gérer la sélection de profil avec le clavier
  const handleProfileKeyDown = (e, profileType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleProfileSelection(profileType);
    }
  };

  // Effet pour gérer les clics en dehors du champ de suggestions de villes
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (villeInputRef.current && !villeInputRef.current.contains(event.target)) {
            setShowVilleSuggestions(false);
        }
    };
    if (showVilleSuggestions) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVilleSuggestions]);

  // --- Soumission du Formulaire ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);
    setShowVilleSuggestions(false); // S'assurer de masquer les suggestions

    if (!type) {
      setMessage("Veuillez sélectionner un type de profil.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // Validations de base côté client (exemples, à renforcer)
    const requiredCommonFields = ['nom', 'prenom', 'email', 'mot_de_passe', 'ville', 'telephone'];
    for (let field of requiredCommonFields) {
        if (!formData[field] || String(formData[field]).trim() === '') {
            setMessage(`Le champ '${field.replace('_', ' de ')}' est obligatoire.`);
            setIsError(true);
            setIsLoading(false);
            return;
        }
    }
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.nom) || !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.prenom) ) {
        setMessage("Le nom et le prénom ne doivent contenir que des lettres, espaces, apostrophes ou tirets.");
        setIsError(true);
        setIsLoading(false);
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setMessage("Format d'email invalide.");
        setIsError(true);
        setIsLoading(false);
        return;
    }
    if (formData.mot_de_passe.length < 8) {
        setMessage("Le mot de passe doit contenir au moins 8 caractères.");
        setIsError(true);
        setIsLoading(false);
        return;
    }
    if (!/^0[67][0-9]{8}$/.test(formData.telephone)) {
        setMessage("Format de téléphone invalide (doit commencer par 06 ou 07 et avoir 10 chiffres).");
        setIsError(true);
        setIsLoading(false);
        return;
    }

    if (type === 'etudiant') {
        if (!formData.cv) { setMessage("Le CV est obligatoire pour les étudiants."); setIsError(true); setIsLoading(false); return; }
        if (!formData.lettre_motivation) { setMessage("La lettre de motivation est obligatoire pour les étudiants."); setIsError(true); setIsLoading(false); return; }
    } else if (type === 'responsable') {
        if (!formData.nom_entreprise || String(formData.nom_entreprise).trim() === '') { setMessage("Le nom de l'entreprise est obligatoire."); setIsError(true); setIsLoading(false); return; }
        if (formData.nombre_employes === '' || parseInt(formData.nombre_employes, 10) < 0) { setMessage("Le nombre d'employés doit être un nombre positif ou nul."); setIsError(true); setIsLoading(false); return; }
    }

    const dataPayload = new FormData();
    dataPayload.append('type_utilisateur', type);

    // Ajouter les champs au payload FormData
    Object.keys(formData).forEach(key => {
        const value = formData[key];
        const isCommonField = requiredCommonFields.includes(key);
        const isEtudiantField = type === 'etudiant' && ['cv', 'lettre_motivation'].includes(key);
        const isResponsableField = type === 'responsable' && ['nom_entreprise', 'nombre_employes', 'services', 'photo_profil'].includes(key);

        if (isCommonField || isEtudiantField || isResponsableField) {
            if (key === 'services' && Array.isArray(value)) {
                if (value.length > 0) value.forEach(val => dataPayload.append('services[]', String(val)));
            } else if (value instanceof File) {
                if (value) dataPayload.append(key, value); // Ajouter fichier seulement s'il existe
            } else if (value != null && String(value).trim() !== '') { // Pour champs texte et nombre
                dataPayload.append(key, value);
            }
        }
    });

    // Log pour débogage
    // console.log("Données FormData à envoyer:");
    // for (let pair of dataPayload.entries()) { console.log(pair[0]+ ': ' + pair[1]); }

    try {
      const res = await axios.post(`${API_URL}/api/register`, dataPayload, {
        headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
      });
      setMessage(res.data?.message || 'Inscription réussie ! Vous allez être redirigé...');
      setIsError(false);
      setFormData(initialFormData);
      setType('');
      setTimeout(() => navigate('/login'), 2500);

    } catch (error) {
      console.error("Erreur d'inscription:", error.response || error.request || error.message);
      let errorMessage = "Une erreur est survenue lors de l'inscription.";
      if (error.response) {
        if (error.response.data?.errors) {
          errorMessage = Object.values(error.response.data.errors).flat().join(' ');
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 413) {
          errorMessage = "Un ou plusieurs fichiers sont trop volumineux (max 2Mo). Vérifiez leur taille.";
        } else if (error.response.status === 422) {
           errorMessage = "Données invalides. Vérifiez les champs et réessayez. Assurez-vous que l'email ou le téléphone ne sont pas déjà utilisés.";
        } else {
          errorMessage = `Erreur serveur (${error.response.status}). Veuillez réessayer plus tard.`;
        }
      } else if (error.request) {
        errorMessage = "Aucune réponse du serveur. Vérifiez votre connexion internet et l'URL de l'API.";
      }
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
        <header className="sm-navbar">
            <Link to="/" className="sm-navbar-brand" aria-label="Page d'accueil">
                <img src="/logo.png" alt="Plateforme Logo" className="sm-logo" />
            </Link>
            <nav className="sm-nav-links" aria-label="Navigation principale">
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Accueil</NavLink>
                <NavLink to="/ListeOffres" className={({ isActive }) => isActive ? 'active' : ''}>Offres</NavLink>
                <NavLink to="/ListeEntreprises" className={({ isActive }) => isActive ? 'active' : ''}>Entreprises</NavLink>
            </nav>
            <div className="sm-navbar-actions">
                <Link to="/login" className="sm-action-button login">Se Connecter</Link>
            </div>
        </header>

        <div className="register-container">
            <h2 className="register-title">Créer Votre Compte</h2>

            {message && (
                <p className={`form-message ${isError ? 'error' : 'success'}`} role="alert">
                    <FontAwesomeIcon icon={isError ? faTimesCircle : faCheckCircle} /> {message}
                </p>
            )}

            {!type && (
                <div className="profile-selection">
                    <h3>Je suis un(e) :</h3>
                    <div className="profiles">
                        <div className={`profile-box ${type === 'etudiant' ? 'selected' : ''}`} onClick={() => handleProfileSelection('etudiant')} onKeyDown={(e) => handleProfileKeyDown(e, 'etudiant')} role="button" tabIndex="0" aria-pressed={type === 'etudiant'}>
                            <div className="icon">🎓</div> <div className="type">Étudiant</div> <div className="description">Je cherche un stage ou une alternance</div>
                        </div>
                        <div className={`profile-box ${type === 'responsable' ? 'selected' : ''}`} onClick={() => handleProfileSelection('responsable')} onKeyDown={(e) => handleProfileKeyDown(e, 'responsable')} role="button" tabIndex="0" aria-pressed={type === 'responsable'}>
                            <div className="icon">🏢</div> <div className="type">Responsable</div> <div className="description">Je publie des offres</div>
                        </div>
                    </div>
                </div>
            )}

            {type && (
                <form onSubmit={handleSubmit} className='register-form' noValidate>
                    <div className="selected-type-header">
                        Inscription pour un compte : <strong>{type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                        <button type="button" onClick={() => {setType(''); setMessage(''); setFormData(initialFormData);}} className="change-type-button" aria-label="Changer le type de profil">Changer de type</button>
                    </div>

                    <div className="form-section">
                        <h4>Informations Personnelles</h4>
                        <div className="form-row">
                            <div className="form-group"><label htmlFor="nom">Nom <span className="required">*</span></label><input id="nom" type="text" name="nom" value={formData.nom} onChange={handleChange} required className='form-input' /></div>
                            <div className="form-group"><label htmlFor="prenom">Prénom <span className="required">*</span></label><input id="prenom" type="text" name="prenom" value={formData.prenom} onChange={handleChange} required className='form-input' /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label htmlFor="email">Email <span className="required">*</span></label><input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required className='form-input' autoComplete="email"/></div>
                            <div className="form-group"><label htmlFor="telephone">Téléphone <span className="required">*</span></label><input id="telephone" type="tel" name="telephone" placeholder="06xxxxxxxx ou 07xxxxxxxx" value={formData.telephone} onChange={handleChange} required className='form-input' pattern="0[67][0-9]{8}" title="Doit commencer par 06 ou 07 et avoir 10 chiffres" autoComplete="tel"/></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group ville-group" ref={villeInputRef}>
                                <label htmlFor="ville">Ville <span className="required">*</span></label>
                                <div className="ville-input-container">
                                    <input id="ville" type="text" name="ville" value={formData.ville} onChange={handleChange} onFocus={() => setShowVilleSuggestions(villeSuggestions.length > 0 && formData.ville.length > 0)} autoComplete="off" required className='form-input' aria-autocomplete="list" aria-controls="ville-suggestions" aria-expanded={showVilleSuggestions && villeSuggestions.length > 0} />
                                    {showVilleSuggestions && villeSuggestions.length > 0 && (
                                        <ul className="suggestions-list" id="ville-suggestions" role="listbox">
                                            {villeSuggestions.map((villeObj) => ( // villeObj est {id, nom}
                                                <li key={villeObj.id} onClick={() => handleSuggestionClick(villeObj)} onKeyDown={(e)=>{if(e.key==='Enter' || e.key === ' '){e.preventDefault(); handleSuggestionClick(villeObj)}}} tabIndex={0} role="option" aria-selected={formData.ville === villeObj.nom}>
                                                    {villeObj.nom}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="form-group password-group">
                                <label htmlFor="mot_de_passe">Mot de passe <span className="required">*</span></label>
                                <div className="password-input-wrapper">
                                    <input id="mot_de_passe" type={showPassword ? "text" : "password"} name="mot_de_passe" value={formData.mot_de_passe} onChange={handleChange} required className='form-input' placeholder="Min. 8 caractères" minLength="8" autoComplete="new-password"/>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {type === 'etudiant' && (
                        <div className="form-section specific-fields">
                            <h4>Vos Documents</h4>
                            <div className="form-group file-input-group"><label htmlFor="cv">CV (PDF, max 2Mo) <span className="required">*</span></label><input id="cv" type="file" name="cv" accept=".pdf" onChange={handleChange} required className='form-file-input' /></div>
                            <div className="form-group file-input-group"><label htmlFor="lettre_motivation">Lettre de motivation (PDF, DOC, DOCX, ODT, max 2Mo) <span className="required">*</span></label><input id="lettre_motivation" type="file" name="lettre_motivation" accept=".pdf,.doc,.docx,.odt" onChange={handleChange} required className='form-file-input' /></div>
                        </div>
                    )}

                    {type === 'responsable' && (
                        <div className="form-section specific-fields">
                            <h4>Informations Entreprise</h4>
                            <div className="form-row">
                                <div className="form-group"><label htmlFor="nom_entreprise">Nom entreprise <span className="required">*</span></label><input id="nom_entreprise" type="text" name="nom_entreprise" value={formData.nom_entreprise} onChange={handleChange} required className='form-input' /></div>
                                <div className="form-group"><label htmlFor="nombre_employes">Nombre d'employés <span className="required">*</span></label><input id="nombre_employes" type="number" name="nombre_employes" value={formData.nombre_employes} onChange={handleChange} required className='form-input' min="0" step="1"/></div>
                            </div>
                            <div className="form-group file-input-group">
                                <label htmlFor="photo_profil">Logo/Photo de l'entreprise (JPEG, PNG, GIF, max 2Mo)</label>
                                <input id="photo_profil" type="file" name="photo_profil" accept="image/png, image/jpeg, image/gif" onChange={handleChange} className='form-file-input' />
                            </div>
                            <fieldset className="services-checkboxes">
                                <legend className="form-label">Secteur(s) d'activité de l'entreprise :</legend>
                                {servicesList.length === 0 && <p>Chargement des services...</p>}
                                {servicesList.length > 0 && (
                                    <div className="checkbox-grid">
                                        {servicesList.map(service => (
                                            <div key={service.id} className="checkbox-item">
                                                <input type="checkbox" id={`service-${service.id}`} value={service.id} checked={formData.services.includes(service.id)} onChange={() => handleServiceChange(service.id)} />
                                                <label htmlFor={`service-${service.id}`}>{service.nom_service}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </fieldset>
                        </div>
                    )}

                    <button type="submit" className="submit-button" disabled={isLoading}>
                        {isLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Création du compte...</> : 'Créer mon compte'}
                    </button>
                    <p className="login-prompt">Déjà un compte ? <Link to="/login" className="login-link">Se connecter</Link></p>
                </form>
            )}
            {!type && !message && (<p className="select-prompt">Veuillez choisir un type de profil pour commencer.</p>)}
        </div>
    </div>
  );
}
export default Register;