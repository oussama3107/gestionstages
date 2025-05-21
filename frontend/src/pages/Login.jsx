import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate , NavLink } from 'react-router-dom';
// Importer le CSS ci-dessous (Login_AnimatedBg.css)
import './css/Login.css'; // Assurez-vous que le nom correspond au CSS
// import '@fortawesome/fontawesome-free/css/all.min.css'; // Pour icônes Font Awesome

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', mot_de_passe: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // État pour afficher/masquer mdp

  useEffect(() => { setMessage(''); setIsError(false); }, [formData]);

  const redirectToDashboard = useCallback((userType) => {
    if (userType === 'etudiant') navigate('/dashboard-etudiant');
    else if (userType === 'responsable') navigate('/dashboard-responsable');
    else if (userType === 'Administrateur') navigate('/dashboard-Admin');
    else navigate('/');
  }, [navigate]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedType = localStorage.getItem('type');
    if (storedUser && storedType) { redirectToDashboard(storedType); }
  }, [redirectToDashboard]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Gérer l'ajout/retrait de la classe 'has-value' pour l'effet de label
    const inputDiv = e.target.closest('.login-animated-input-div');
    if (inputDiv) {
        if (value) {
            inputDiv.classList.add('has-value');
        } else {
            inputDiv.classList.remove('has-value');
        }
    }
  };

  const handleFocus = (e) => {
    e.target.closest('.login-animated-input-div').classList.add('focus');
  };

  const handleBlur = (e) => {
    if (e.target.value === "") {
        e.target.closest('.login-animated-input-div').classList.remove('focus');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const loginAttemptOrder = ['Administrateur', 'responsable', 'etudiant'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.mot_de_passe) {
      setMessage('Veuillez entrer email et mot de passe.');
      setIsError(true);
      return;
    }
    setIsLoading(true); setMessage(''); setIsError(false);

    let loggedIn = false;
    let finalMessage = "Identifiants incorrects ou utilisateur non trouvé.";
    let finalIsError = true;
    let loggedInUserType = '';

    for (const attemptType of loginAttemptOrder) {
      const payload = {
        email: formData.email.trim(),
        mot_de_passe: formData.mot_de_passe,
        type_utilisateur: attemptType,
      };
      console.log(`Tentative connexion ${attemptType}:`, payload);
      try {
        const res = await axios.post(`${API_URL}/api/login`, payload);
        if (res.data && res.data.user && res.data.type) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          localStorage.setItem('type', res.data.type);
          loggedInUserType = res.data.type;
          setMessage(res.data.message || `Connexion réussie (${res.data.type})!`);
          setIsError(false); loggedIn = true; break;
        }
      } catch (err) {
        console.warn(`Échec ${attemptType}:`, err.response?.data || err.message);
        if (err.response && err.response.status === 401) {
          finalMessage = err.response.data?.message || "Identifiants invalides.";
        } else {
          finalMessage = err.response?.data?.message || err.message || "Erreur serveur/réseau.";
          finalIsError = true; loggedIn = false; break;
        }
      }
    }
    if (loggedIn) { setTimeout(() => redirectToDashboard(loggedInUserType), 700); }
    else { setMessage(finalMessage); setIsError(finalIsError); }
    setIsLoading(false);
  };

  return (
    <div className="login-animated-page-wrapper"> {/* Nouvelle classe pour le fond animé */}
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

       <div className="login-animated-container">
        

           <div className="login-animated-form-content">
               <form onSubmit={handleSubmit} className='login-animated-form' noValidate>
                   {/* Optionnel: <img src="/logo-icon.png" className="login-form-icon" alt="icon"/> */}
                   <h2 className="login-animated-title">Se connecter</h2>
                   <p className="login-animated-subtitle">Connectez-vous pour continuer.</p>

                   {message && (
                        <p className={`login-animated-message ${isError ? 'error' : 'success'}`} role="alert">
                            {message}
                        </p>
                   )}
                   {/* Champ Email */}
                   <div className={`login-animated-input-div ${formData.email || formData.email === '' ? (formData.email ? 'has-value focus' : (document.activeElement === document.getElementById('email') ? 'focus' : '')) : ''}`}>
                       <div className="input-icon-wrapper">
                           <i className="fas fa-envelope"></i>
                       </div>
                       <div className="input-field-wrapper">
                           <h5 className={formData.email ? 'label-focused' : ''}>Email</h5>
                           <input
                                id="email"
                                type="email"
                                name="email"
                                className="input"
                                value={formData.email}
                                onChange={handleChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                required
                                autoComplete="email"
                            />
                       </div>
                   </div>

                   {/* Champ Mot de passe */}
                   <div className={`login-animated-input-div ${formData.mot_de_passe || formData.mot_de_passe === '' ? (formData.mot_de_passe ? 'has-value focus' : (document.activeElement === document.getElementById('mot_de_passe') ? 'focus' : '')) : ''}`}>
                       <div className="input-icon-wrapper">
                           <i className="fas fa-lock"></i>
                       </div>
                       <div className="input-field-wrapper">
                           <h5 className={formData.mot_de_passe ? 'label-focused' : ''}>Mot de passe</h5>
                           <input
                                id="mot_de_passe"
                                type={showPassword ? "text" : "password"}
                                name="mot_de_passe"
                                className="input"
                                value={formData.mot_de_passe}
                                onChange={handleChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                required
                                autoComplete="current-password"
                            />
                       </div>
                       <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="password-toggle-btn"
                            aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                        >
                            <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                        </button>
                   </div>

                   <button type="submit" className="login-animated-btn" disabled={isLoading} >
                     {isLoading ? (<span className="spinner"></span>) : 'Se connecter'}
                   </button>

                   <p className="login-animated-register-prompt">
                       Pas encore de compte ? <Link to="/register" className="login-animated-register-link">Créer un compte</Link>
                   </p>
               </form>
           </div>
       </div>
    </div>
  );
}
export default Login;