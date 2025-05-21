import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './css/EditProfilEtudiant.css'; // Fichier CSS principal pour ce composant
import { useNavigate, Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function EditProfilEtudiant() {
  const navigate = useNavigate();
  // State pour les champs texte
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '', // Garder vide initialement
    telephone: '',
    ville: '',
  });
  // State séparé pour les fichiers
  const [cvFile, setCvFile] = useState(null); // Utiliser des noms clairs
  const [lettreFile, setLettreFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  // State pour afficher les noms des fichiers existants
  const [currentCvUrl, setCurrentCvUrl] = useState('');
  const [currentLettreUrl, setCurrentLettreUrl] = useState('');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [userId, setUserId] = useState(null); // Stocker l'ID utilisateur

  // --- Logout Handler ---
  const handleLogout = useCallback((reload = true) => {
    console.log("Déconnexion...");
    localStorage.removeItem('user');
    localStorage.removeItem('type');
    if (reload) { window.location.href = '/login'; }
    else { navigate('/login'); }
  }, [navigate]);

  // --- Effect for Initial Data Loading ---
  useEffect(() => {
    let storedUser;
    let id;
    try {
      const userString = localStorage.getItem('user');
      const typeString = localStorage.getItem('type');
      if (!userString || typeString !== 'etudiant') throw new Error("Données utilisateur invalides ou type incorrect");
      storedUser = JSON.parse(userString);
      id = storedUser?.id;
      if (!id) throw new Error("ID utilisateur manquant");
      setUserId(id); // Stocker l'ID dans l'état
    } catch (error) {
      console.error("Erreur authentification locale:", error.message);
      handleLogout(false); // Déconnecter et rediriger
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);
    axios.get(`${API_URL}/api/etudiants/${id}`) // Utiliser l'ID récupéré
      .then(response => {
        const data = response.data;
        if (!data) {
             throw new Error("Aucune donnée reçue pour ce profil.");
        }
        setFormData({
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          mot_de_passe: '', // Toujours vide au chargement
          telephone: data.telephone || '',
          ville: data.ville || '',
        });
        // Stocker les URL complètes des fichiers actuels pour les liens
        setCurrentCvUrl(data.cv ? `${API_URL}/storage/${data.cv}` : '');
        setCurrentLettreUrl(data.lettre_motivation ? `${API_URL}/storage/${data.lettre_motivation}` : '');
        setCurrentPhotoUrl(data.photo_profil ? `${API_URL}/storage/${data.photo_profil}` : '');
      })
      .catch(error => {
        console.error("Erreur chargement profil:", error);
        const status = error.response?.status;
        let msg = "Erreur lors du chargement de votre profil.";
        if (status === 404) msg = "Votre profil n'a pas été trouvé.";
        else if (status === 500) msg = "Erreur serveur lors du chargement du profil.";
        setMessage(msg);
        setIsError(true);
        // Ne pas rendre le formulaire si les données initiales ne peuvent pas être chargées
        setFormData(null); // Indique que les données n'ont pas pu être chargées
      })
      .finally(() => {
        setLoading(false);
      });

  }, [navigate, handleLogout]); // Ajouter handleLogout aux dépendances

  // --- Handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const name = e.target.name;
    if (!file) return; // Ignorer si aucun fichier sélectionné

    if (name === 'cv') setCvFile(file);
    else if (name === 'lettre_motivation') setLettreFile(file);
    else if (name === 'photo_profil') setPhotoFile(file);
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { // Vérification de sécurité
         setMessage("Erreur: ID utilisateur manquant.");
         setIsError(true);
         return;
    }
    setIsSubmitting(true);
    setMessage('');
    setIsError(false);

    const submitData = new FormData();

    // Ajouter les champs texte (uniquement mot de passe si modifié)
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'mot_de_passe') {
        if (value) submitData.append(key, value);
      } else {
        submitData.append(key, value ?? '');
      }
    });

    // Ajouter les fichiers s'ils ont été sélectionnés
    if (cvFile) submitData.append('cv', cvFile);
    if (lettreFile) submitData.append('lettre_motivation', lettreFile);
    if (photoFile) submitData.append('photo_profil', photoFile);

    // Supprimé: submitData.append('_method', 'PUT'); // N'est plus nécessaire avec la route POST

    try {
      // Utiliser POST vers l'URL correcte (sans /update)
      const response = await axios.post(
        `${API_URL}/api/etudiants/${userId}`, // <-- CORRECTION URL
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Important pour FormData
            'Accept': 'application/json',
          },
        }
      );

      // Mise à jour succès
      setMessage(response.data?.message || "Profil mis à jour avec succès !");
      setIsError(false);

      // Mettre à jour les données utilisateur locales et l'état du formulaire
      if (response.data && response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          // Mettre à jour l'état avec les nouvelles données, vider le mdp
          setFormData(prev => ({
              ...prev,
              ...response.data.user,
              mot_de_passe: '' // Vider le champ mot de passe après succès
          }));
          // Mettre à jour les URL des fichiers actuels
           setCurrentCvUrl(response.data.user.cv ? `${API_URL}/storage/${response.data.user.cv}` : '');
           setCurrentLettreUrl(response.data.user.lettre_motivation ? `${API_URL}/storage/${response.data.user.lettre_motivation}` : '');
           setCurrentPhotoUrl(response.data.user.photo_profil ? `${API_URL}/storage/${response.data.user.photo_profil}` : '');
      }

       // Réinitialiser l'état des fichiers après succès
       setCvFile(null);
       setLettreFile(null);
       setPhotoFile(null);
       // Réinitialiser les champs input file visuellement (méthode simple: via key sur le form, ou manuellement)
       // On pourrait utiliser document.getElementById('cv').value = null; etc., mais c'est moins propre que de gérer via l'état si possible.
       // Pour la simplicité, on indique juste que la mise à jour est faite.

    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error.response?.data || error.message, error);
      let errorMessage = "Erreur lors de la mise à jour.";
      if (error.response?.data?.errors) {
          errorMessage = Object.values(error.response.data.errors).flat().join(' ');
      } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
      }
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isActiveLink = (path) => window.location.pathname === path || (path !== "/dashboard-etudiant" && window.location.pathname.startsWith(path));
  // --- Render Logic ---

  // État initial pendant le chargement
  if (loading) return <div className="loading-container">Chargement du profil...</div>;

  // État d'erreur après le chargement initial (impossible de charger les données)
  if (!formData && !loading) {
        return (
            <div className="edit-profil-page">
                <header className="etudiant-navbar">
                    <div className="navbar-logo-container"><Link to="/"><img src="/logo.png" alt="Logo" className="nav-logo" /></Link></div>
                    <nav className="navbar-links"><span>Erreur</span></nav>
                    <div className="navbar-actions"><button className="logout-button" onClick={()=>handleLogout(true)}>Déconnexion</button></div>
                </header>
                <div className="error-container" style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
                    <p><strong>{message || "Impossible de charger les données du profil."}</strong></p>
                    <Link to="/dashboard-etudiant" className="submit-button" style={{ textDecoration: 'none', marginTop: '10px' }}>Retour au Dashboard</Link>
                </div>
            </div>
        );
  }


  // Affichage principal du formulaire
  return (
    <div className="edit-profil-page">
        {/* Navbar */}
        <header className="etu-navbar">
                <div className="navbar-brand">
                    <Link to="/dashboard-etudiant" className="navbar-logo-link">
                        <img src="/logo.png" alt="Logo Plateforme" className="nav-logo" />
                        {/* <span className="navbar-app-name">Mon Espace</span> */}
                    </Link>
                </div>
                <nav className="navbar-links-center">
                    <Link to="/dashboard-etudiant" className={isActiveLink('/dashboard-etudiant') ? 'active' : ''}>Mon Profil</Link>
                    <Link to="/OffresEtudiant" className={isActiveLink('/OffresEtudiant') ? 'active' : ''}>Offres de Stage</Link> {/* Mettre à jour chemin si OffresEtudiant.jsx est sous /etudiant/offres */}
                    <Link to="/MesCandidaturesEtudiant" className={isActiveLink('/MesCandidaturesEtudiant') ? 'active' : ''}>Mes Candidatures</Link> {/* Mettre à jour chemin */}
                    {/* <Link to="/etudiant/parametres">Paramètres</Link> */}
                </nav>
                <div className="navbar-actions">

                    <button className="logout-button" onClick={() => handleLogout(true)}>
                        <i className="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            </header>

        {/* Form Container */}
        <div className="edit-profil-container">
            <h2>Modifier mon profil</h2>

            {/* Messages Succès/Erreur */}
            {message && (
                <p className={`form-message ${isError ? 'error' : 'success'}`} role="alert">
                    {message}
                </p>
            )}

            {/* Prévisualisation Photo Actuelle (si elle existe) */}
            {currentPhotoUrl && (
                 <div className="current-photo-preview">
                    <p>Photo actuelle :</p>
                    <img src={currentPhotoUrl} alt="Photo de profil actuelle" />
                 </div>
            )}


            <form onSubmit={handleSubmit} className="edit-profil-form" encType="multipart/form-data" noValidate>

                {/* Champs Texte */}
                <div className="form-row"> {/* Utiliser des rows pour grouper les champs */}
                    <div className="form-group">
                        <label htmlFor="nom">Nom</label>
                        <input id="nom" type="text" name="nom" value={formData.nom} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="prenom">Prénom</label>
                        <input id="prenom" type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                     <div className="form-group">
                        <label htmlFor="telephone">Téléphone</label>
                        <input id="telephone" type="tel" name="telephone" value={formData.telephone} onChange={handleChange} required pattern="[0-9]{10}"/>
                    </div>
                </div>

                 <div className="form-group full-width"> {/* Champ sur toute la largeur */}
                    <label htmlFor="ville">Ville</label>
                    <input id="ville" type="text" name="ville" value={formData.ville} onChange={handleChange} required />
                </div>

                 <div className="form-group full-width">
                    <label htmlFor="mot_de_passe">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                    <input id="mot_de_passe" type="password" name="mot_de_passe" value={formData.mot_de_passe} onChange={handleChange} autoComplete="new-password" />
                </div>


                <hr className="form-divider" /> {/* Séparateur visuel */}
                <h3>Documents</h3>

                {/* Champs Fichiers */}
                <div className="form-group file-group">
                    <label htmlFor="cv">Modifier le CV (PDF)</label>
                    <input id="cv" name="cv" type="file" accept=".pdf" onChange={handleFileChange} aria-describedby="cv-current"/>
                     {currentCvUrl && <span id="cv-current" className="current-file-link">Actuel: <a href={currentCvUrl} target="_blank" rel="noopener noreferrer">Voir CV</a></span>}
                     {!currentCvUrl && <span className="current-file-link">Aucun CV actuel.</span>}
                </div>

                <div className="form-group file-group">
                    <label htmlFor="lettre_motivation">Modifier la Lettre de motivation (PDF/DOCX/ODT)</label>
                    <input id="lettre_motivation" name="lettre_motivation" type="file" accept=".pdf,.doc,.docx,.odt" onChange={handleFileChange} aria-describedby="lettre-current"/>
                     {currentLettreUrl && <span id="lettre-current" className="current-file-link">Actuelle: <a href={currentLettreUrl} target="_blank" rel="noopener noreferrer">Voir Lettre</a></span>}
                     {!currentLettreUrl && <span className="current-file-link">Aucune lettre actuelle.</span>}
                </div>

                <div className="form-group file-group">
                    <label htmlFor="photo_profil">Modifier la Photo de profil (Image)</label>
                    <input id="photo_profil" name="photo_profil" type="file" accept="image/*" onChange={handleFileChange} aria-describedby="photo-current"/>
                     {currentPhotoUrl && <span id="photo-current" className="current-file-link">Une photo existe déjà. Sélectionner un fichier pour remplacer.</span>}
                     {!currentPhotoUrl && <span className="current-file-link">Aucune photo actuelle.</span>}
                </div>

                {/* Bouton Soumission */}
                <button type="submit" className="submit-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
            </form>
        </div>
    </div>
  );
}

export default EditProfilEtudiant;