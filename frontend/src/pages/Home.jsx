import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBriefcase, faUsers, faSearch, faMapMarkerAlt, faTools,
    faFileAlt, faBuilding, faUserGraduate, faTimes,
    faSpinner, faExclamationTriangle, faFolderOpen, faPaperPlane
} from '@fortawesome/free-solid-svg-icons';

// Importer la liste des villes
// Assurez-vous que ce fichier existe, exporte 'villesMaroc',
// et que chaque objet ville a 'id' (unique) et 'nom' (string).
import { villesMaroc } from './data/villes'; // Exemple: src/data/villes.js

import './css/Home.css'; // Lier le CSS

// URL de base de l'API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Home() {
    const navigate = useNavigate();

    // --- États du Composant ---
    const [activeTab, setActiveTab] = useState('offres');

    // États pour la recherche d'offres
    const [searchDataOffres, setSearchDataOffres] = useState({ keyword: '', locations: [] });
    const [currentVilleInputOffres, setCurrentVilleInputOffres] = useState('');
    const [villeSuggestionsOffres, setVilleSuggestionsOffres] = useState([]);
    const [showVilleSuggestionsOffres, setShowVilleSuggestionsOffres] = useState(false);

    // États pour la recherche de candidats
    const [searchDataCandidats, setSearchDataCandidats] = useState({ competence: '', villeCandidat: '' });
    const [currentVilleInputCandidat, setCurrentVilleInputCandidat] = useState('');
    const [villeSuggestionsCandidat, setVilleSuggestionsCandidat] = useState([]);
    const [showVilleSuggestionsCandidat, setShowVilleSuggestionsCandidat] = useState(false);

    // États pour les résultats de recherche d'offres (si affichés sur cette page)
    const [searchResults, setSearchResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isFetchingResults, setIsFetchingResults] = useState(false); // Un seul état de chargement pour la recherche principale
    const [searchError, setSearchError] = useState(null);

    // États pour les offres en vedette dynamiques
    const [dynamicFeaturedOffers, setDynamicFeaturedOffers] = useState([]);
    const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
    const [errorFeatured, setErrorFeatured] = useState(null);

    // Références pour gérer les clics en dehors des listes de suggestions
    const villeSearchOffresRef = useRef(null);
    const villeSearchCandidatRef = useRef(null);

    // --- Données Statiques (Chiffres clés) ---
    const keyFigures = { offres: "23,000+", entreprises: "5,000+", candidats: "150,000+" };

    // --- Chargement des Offres en Vedette au Montage ---
    useEffect(() => {
        const fetchFeaturedOffers = async () => {
            setIsLoadingFeatured(true);
            setErrorFeatured(null);
            try {
                // Adaptez l'URL si vous avez un endpoint spécifique pour les offres récentes/vedettes
                // Exemple: les 4 dernières offres publiées, triées par date de création décroissante
                const response = await fetch(`${API_URL}/api/offres?statut=publiee&_limit=4&_sort=created_at&_order=desc`);
                // Note: _limit, _sort, _order sont des conventions de json-server, adaptez à votre API Laravel
                // Pour Laravel, vous pourriez avoir : /api/offres?statut=publiee&limit=4&sortBy=created_at&order=desc

                if (!response.ok) {
                    let errorBody = `Erreur HTTP: ${response.status}`;
                    try { const errorData = await response.json(); errorBody = errorData.message || errorBody; } catch (e) {}
                    throw new Error(errorBody);
                }
                const data = await response.json();
                if (Array.isArray(data)) {
                    setDynamicFeaturedOffers(data);
                } else {
                    setDynamicFeaturedOffers([]);
                    console.warn("Format inattendu pour les offres en vedette reçues du serveur.", data);
                }
            } catch (err) {
                console.error("Erreur lors du chargement des offres en vedette:", err);
                setErrorFeatured(err.message || "Impossible de charger les offres récentes.");
                setDynamicFeaturedOffers([]);
            } finally {
                setIsLoadingFeatured(false);
            }
        };
        fetchFeaturedOffers();
    }, []);


    // --- Effet pour filtrer les suggestions de villes (OFFRES) ---
    useEffect(() => {
        if (currentVilleInputOffres.trim() === '') {
            setVilleSuggestionsOffres([]);
            setShowVilleSuggestionsOffres(false);
            return;
        }
        const lowerInput = currentVilleInputOffres.toLowerCase();
        const filtered = (villesMaroc || [])
            .filter(ville => ville && typeof ville.nom === 'string' && ville.nom.toLowerCase().includes(lowerInput))
            .sort((a, b) => a.nom.localeCompare(b.nom)).slice(0, 7);
        setVilleSuggestionsOffres(filtered);
        setShowVilleSuggestionsOffres(filtered.length > 0);
    }, [currentVilleInputOffres]);

    // --- Effet pour filtrer les suggestions de villes (CANDIDATS) ---
    useEffect(() => {
        if (currentVilleInputCandidat.trim() === '') {
            setVilleSuggestionsCandidat([]);
            setShowVilleSuggestionsCandidat(false);
            return;
        }
        const lowerInput = currentVilleInputCandidat.toLowerCase();
        const filtered = (villesMaroc || [])
            .filter(ville => ville.nom.toLowerCase().includes(lowerInput))
            .sort((a, b) => a.nom.localeCompare(b.nom)).slice(0, 7);
        setVilleSuggestionsCandidat(filtered);
        setShowVilleSuggestionsCandidat(filtered.length > 0);
    }, [currentVilleInputCandidat]);


    // --- Effet pour gérer les clics en dehors (OFFRES) ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (villeSearchOffresRef.current && !villeSearchOffresRef.current.contains(event.target)) {
                setShowVilleSuggestionsOffres(false);
            }
        };
        if (showVilleSuggestionsOffres) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showVilleSuggestionsOffres]);

    // --- Effet pour gérer les clics en dehors (CANDIDATS) ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (villeSearchCandidatRef.current && !villeSearchCandidatRef.current.contains(event.target)) {
                setShowVilleSuggestionsCandidat(false);
            }
        };
        if (showVilleSuggestionsCandidat) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showVilleSuggestionsCandidat]);


    // --- Fonction de Recherche Principale ---
    const handleSearch = useCallback(async () => {
        setShowVilleSuggestionsOffres(false); // Masquer les suggestions avant la recherche/navigation
        setShowVilleSuggestionsCandidat(false);

        setIsFetchingResults(true); // Un seul état de chargement pour le bouton
        setSearchError(null);

        if (activeTab === 'offres') {
            setHasSearched(true);
            setSearchResults([]);
            let queryParams = new URLSearchParams({ statut: 'publiee' });
            if (searchDataOffres.keyword.trim()) queryParams.set('q', searchDataOffres.keyword.trim());
            if (searchDataOffres.locations.length > 0) queryParams.set('villes', searchDataOffres.locations.join(','));

            try {
                const response = await fetch(`${API_URL}/api/offres?${queryParams.toString()}`);
                if (!response.ok) { /* ... gestion erreur HTTP ... */ }
                const data = await response.json();
                if (Array.isArray(data)) setSearchResults(data);
                else throw new Error("Réponse serveur invalide pour les offres.");
            } catch (err) { setSearchError(err.message || "Impossible de rechercher les offres."); }
            finally { setIsFetchingResults(false); }
        } else { // activeTab === 'candidats'
            setHasSearched(false); // Reset pour l'onglet candidats (qui navigue)
            let queryParams = new URLSearchParams();
            let targetPath = '/cvtheque';
            if (searchDataCandidats.competence.trim()) queryParams.set('comp', searchDataCandidats.competence.trim());
            if (searchDataCandidats.villeCandidat.trim()) queryParams.set('ville', searchDataCandidats.villeCandidat.trim());
            console.warn("Redirection vers la recherche de candidats (/cvtheque) à vérifier/implémenter.");
            setTimeout(() => {
                 navigate(`${targetPath}?${queryParams.toString()}`);
                 setIsFetchingResults(false); // Remettre à false après la simulation de délai
            }, 300);
        }
    }, [searchDataOffres, searchDataCandidats, activeTab, navigate]);


    // --- Handlers pour les changements dans les champs de formulaire ---
    const handleInputOffresChange = (e) => setSearchDataOffres(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleInputCandidatsChange = (e) => setSearchDataCandidats(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleVilleInputOffresChange = (e) => setCurrentVilleInputOffres(e.target.value);
    const handleVilleInputCandidatChange = (e) => setCurrentVilleInputCandidat(e.target.value);

    // Ajouter une ville sélectionnée depuis les suggestions aux tags (pour Offres)
    const addVilleLocationOffres = (villeNom) => {
        if (villeNom && !searchDataOffres.locations.includes(villeNom)) {
            setSearchDataOffres(prev => ({ ...prev, locations: [...prev.locations, villeNom] }));
        }
        setCurrentVilleInputOffres('');
        setShowVilleSuggestionsOffres(false);
    };
    // Retirer un tag de ville (pour Offres)
    const removeLocationOffres = (locationToRemove) => {
        setSearchDataOffres(prev => ({ ...prev, locations: prev.locations.filter(loc => loc !== locationToRemove)}));
    };
    // Sélectionner une ville unique (pour Candidats)
    const selectVilleCandidat = (villeNom) => {
        setSearchDataCandidats(prev => ({ ...prev, villeCandidat: villeNom })); // Met à jour la donnée de recherche
        setCurrentVilleInputCandidat(villeNom); // Met à jour le champ input pour afficher la sélection
        setShowVilleSuggestionsCandidat(false);
    };

    // --- Rendu du JSX ---
    return (
        <div className="sm-home-page">
            {/* ----- Navbar ----- */}
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

            {/* ----- Section Hero & Barre de Recherche ----- */}
            <main className="sm-hero-section">
                <div className="sm-hero-content">
                    <h1>Trouvez le stage <br />qui vous <span className="highlight">correspond</span></h1>
                    <p className="sm-hero-subtitle">Des milliers d'opportunités vérifiées pour lancer votre carrière.</p>

                    <div className="sm-search-container" role="search">
                        <div className="sm-search-tabs" role="tablist">
                            <button id="tab-offres" className={`sm-search-tab ${activeTab === 'offres' ? 'active' : ''}`} onClick={() => setActiveTab('offres')} role="tab" aria-selected={activeTab === 'offres'} aria-controls="panel-offres">
                                <FontAwesomeIcon icon={faBriefcase} className="tab-icon" aria-hidden="true"/> Stages & Alternances
                            </button>
                            <button id="tab-candidats" className={`sm-search-tab ${activeTab === 'candidats' ? 'active' : ''}`} onClick={() => setActiveTab('candidats')} role="tab" aria-selected={activeTab === 'candidats'} aria-controls="panel-candidats">
                                <FontAwesomeIcon icon={faUsers} className="tab-icon" aria-hidden="true"/> Alternants & Stagiaires
                            </button>
                        </div>

                        <div className="sm-search-form-wrapper">
                             {activeTab === 'offres' && (
                                <form id="panel-offres" className="sm-search-fields offres" onSubmit={(e) => { e.preventDefault(); handleSearch(); }} role="tabpanel" aria-labelledby="tab-offres">
                                    <div className="sm-search-input-group keyword">
                                        <FontAwesomeIcon icon={faSearch} className="input-icon" aria-hidden="true"/>
                                        <input type="text" name="keyword" placeholder="Métier, mots-clés, entreprise..." value={searchDataOffres.keyword} onChange={handleInputOffresChange} aria-label="Rechercher offres par mot-clé ou entreprise" />
                                    </div>
                                    <div className="sm-search-input-group location ville-search-wrapper" ref={villeSearchOffresRef}>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="input-icon" aria-hidden="true"/>
                                        <input type="text" placeholder="Ville (ex: Rabat)" value={currentVilleInputOffres} onChange={handleVilleInputOffresChange} onFocus={() => setShowVilleSuggestionsOffres(villeSuggestionsOffres.length > 0 && currentVilleInputOffres.length > 0)} aria-label="Ajouter une ville à la recherche d'offres" className="ville-input-field" autoComplete="off" />
                                        {searchDataOffres.locations.length > 0 && (
                                            <div className="sm-locations-display tags-container">
                                                {searchDataOffres.locations.map((loc) => (
                                                    <span key={loc} className="sm-location-tag"> {loc} <button type="button" className="sm-remove-tag" onClick={(e) => { e.stopPropagation(); removeLocationOffres(loc); }} aria-label={`Retirer ${loc}`}> <FontAwesomeIcon icon={faTimes} aria-hidden="true"/> </button> </span>
                                                ))}
                                            </div>
                                        )}
                                        {showVilleSuggestionsOffres && villeSuggestionsOffres.length > 0 && (
                                            <ul className="ville-suggestions-list" role="listbox">
                                                {villeSuggestionsOffres.map(ville => ( <li key={ville.id || ville.nom} onClick={() => addVilleLocationOffres(ville.nom)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addVilleLocationOffres(ville.nom);}}} tabIndex="0" role="option" aria-selected="false" > {ville.nom} </li> ))}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="submit" className="sm-search-button" disabled={isFetchingResults} aria-label="Lancer la recherche d'offres">
                                        {isFetchingResults ? <div className="spinner" role="status" aria-live="polite" aria-label="Recherche en cours"></div> : <FontAwesomeIcon icon={faSearch} aria-hidden="true"/>}
                                    </button>
                                </form>
                            )}
                             {activeTab === 'candidats' && (
                                <form id="panel-candidats" className="sm-search-fields candidats" onSubmit={(e) => { e.preventDefault(); handleSearch(); }} role="tabpanel" aria-labelledby="tab-candidats">
                                  <div className="sm-search-input-group keyword"> <FontAwesomeIcon icon={faTools} className="input-icon" aria-hidden="true"/>
                                     <input type="text" name="competence" placeholder="Compétence, diplôme..." value={searchDataCandidats.competence} onChange={handleInputCandidatsChange} aria-label="Rechercher candidats par compétence ou diplôme" /> </div>
                                    <div className="sm-search-input-group location ville-search-wrapper" ref={villeSearchCandidatRef}>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="input-icon" aria-hidden="true"/>
                                        <input type="text" name="villeCandidatDisplay" placeholder="Ville du candidat" value={currentVilleInputCandidat} onChange={handleVilleInputCandidatChange} onFocus={() => setShowVilleSuggestionsCandidat(villeSuggestionsCandidat.length > 0 && currentVilleInputCandidat.length > 0)} aria-label="Ville du candidat" className="ville-input-field" autoComplete="off" />
                                        {/* Ici on affiche la ville sélectionnée (searchDataCandidats.villeCandidat) si elle existe et currentVilleInputCandidat est vide */}
                                        {searchDataCandidats.villeCandidat && !currentVilleInputCandidat && (
                                            <div className="sm-locations-display tags-container single-tag-display">
                                                <span className="sm-location-tag">
                                                    {searchDataCandidats.villeCandidat}
                                                    <button type="button" className="sm-remove-tag" onClick={(e) => { e.stopPropagation(); setSearchDataCandidats(prev => ({...prev, villeCandidat: ''})); setCurrentVilleInputCandidat(''); }} aria-label={`Retirer ${searchDataCandidats.villeCandidat}`}> <FontAwesomeIcon icon={faTimes} aria-hidden="true"/> </button>
                                                </span>
                                            </div>
                                        )}
                                        {showVilleSuggestionsCandidat && villeSuggestionsCandidat.length > 0 && (
                                            <ul className="ville-suggestions-list" role="listbox">
                                                {villeSuggestionsCandidat.map(ville => ( <li key={ville.id || ville.nom} onClick={() => selectVilleCandidat(ville.nom)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectVilleCandidat(ville.nom);}}} tabIndex="0" role="option" aria-selected={searchDataCandidats.villeCandidat === ville.nom} > {ville.nom} </li> ))}
                                            </ul>
                                        )}
                                    </div>
                                    <button type="submit" className="sm-search-button" disabled={isFetchingResults} aria-label="Lancer la recherche de candidats">
                                         {isFetchingResults ? <div className="spinner" role="status" aria-live="polite" aria-label="Recherche en cours"></div> : <FontAwesomeIcon icon={faSearch} aria-hidden="true"/>}
                                    </button>
                                </form>
                           )}
                        </div>
                    </div>
                </div>
            </main>

            {/* ----- Section Résultats de Recherche (Conditionnelle pour offres) ----- */}
            {activeTab === 'offres' && hasSearched && (
                <section className="sm-search-results" aria-live="polite">
                    <div className="sm-results-container">
                        <h2>Résultats de votre recherche</h2>
                        {isFetchingResults && ( <div className="sm-results-loading"> <FontAwesomeIcon icon={faSpinner} spin size="2x" /> <p>Recherche en cours...</p> </div> )}
                        {searchError && !isFetchingResults && ( <div className="sm-results-error"> <FontAwesomeIcon icon={faExclamationTriangle} size="2x" /> <p>Erreur : {searchError}</p> </div> )}
                        {!isFetchingResults && !searchError && searchResults.length === 0 && ( <div className="sm-results-empty"> <FontAwesomeIcon icon={faFolderOpen} size="3x" /> <p>Aucune offre ne correspond à vos critères actuels.</p> </div> )}
                        {!isFetchingResults && !searchError && searchResults.length > 0 && (
                            <div className="sm-offers-grid results-grid">
                                {searchResults.map(offer => (
                                    <div key={`search-${offer.id}`} className="sm-offer-card">
                                        <div className="sm-offer-info">
                                            <h3> <Link to={`/offres/${offer.id}`} className="sm-offer-title-link"> {offer.titre || 'Offre sans titre'} </Link> </h3>
                                            {offer.responsableRh && ( <p className="sm-offer-company"> <FontAwesomeIcon icon={faBuilding} /> {offer.responsableRh.nom_entreprise || 'Entreprise non spécifiée'} </p> )}
                                            <div className="sm-offer-details">
                                                {offer.ville && <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {offer.ville}</span>}
                                                {offer.service && <span><FontAwesomeIcon icon={faBriefcase} /> {offer.service.nom_service || 'N/A'}</span>}
                                            </div>
                                            <p className="sm-offer-description-snippet">
                                               {offer.description?.length > 100 ? offer.description.substring(0, 100) + '...' : offer.description}
                                            </p>
                                        </div>
                                        <Link to={`/offres/${offer.id}`} className="sm-offer-button">Voir l'offre</Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ----- Section Chiffres Clés ----- */}
            <section className="sm-key-figures" aria-label="Chiffres clés de la plateforme">
                 <div className="sm-figure-item"> <FontAwesomeIcon icon={faFileAlt} className="figure-icon" aria-hidden="true"/> <span className="sm-figure-number">{keyFigures.offres}</span> <span className="sm-figure-label">Offres Disponibles</span> </div>
                 <div className="sm-figure-item"> <FontAwesomeIcon icon={faBuilding} className="figure-icon" aria-hidden="true"/> <span className="sm-figure-number">{keyFigures.entreprises}</span> <span className="sm-figure-label">Entreprises Partenaires</span> </div>
                 <div className="sm-figure-item"> <FontAwesomeIcon icon={faUserGraduate} className="figure-icon" aria-hidden="true"/> <span className="sm-figure-number">{keyFigures.candidats}</span> <span className="sm-figure-label">Candidats Inscrits</span> </div>
            </section>

            {/* ----- Section Offres en Vedette (Dynamique) ----- */}
            <section className="sm-featured-offers" aria-labelledby="featured-offers-title">
                <h2 id="featured-offers-title">Offres Récentes à ne pas manquer</h2>
                {isLoadingFeatured && <div className="sm-results-loading compact"><FontAwesomeIcon icon={faSpinner} spin size="lg" /> <p>Chargement des offres...</p></div>}
                {errorFeatured && !isLoadingFeatured && <div className="sm-results-error compact"><FontAwesomeIcon icon={faExclamationTriangle} size="lg" /> <p>{errorFeatured}</p></div>}
                {!isLoadingFeatured && !errorFeatured && dynamicFeaturedOffers.length === 0 && (
                    <div className="sm-results-empty compact"><FontAwesomeIcon icon={faFolderOpen} size="lg" /> <p>Aucune offre récente à afficher.</p></div>
                )}
                {!isLoadingFeatured && !errorFeatured && dynamicFeaturedOffers.length > 0 && (
                    <div className="sm-offers-grid">
                        {dynamicFeaturedOffers.map(offer => (
                            <div key={offer.id} className="sm-offer-card">
                                <div className="sm-offer-info">
                                    <h3><Link to={`/offres/${offer.id}`} className="sm-offer-title-link">{offer.titre || 'Offre'}</Link></h3>
                                    {offer.responsableRh && <p className="sm-offer-company"><FontAwesomeIcon icon={faBuilding} /> {offer.responsableRh.nom_entreprise || 'N/A'}</p>}
                                    <div className="sm-offer-details">
                                        {offer.ville && <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {offer.ville}</span>}
                                        {offer.service && <span><FontAwesomeIcon icon={faBriefcase} /> {offer.service.nom_service || 'N/A'}</span>}
                                    </div>
                                </div>
                                <Link to={`/offres/${offer.id}`} className="sm-offer-button">Voir l'offre</Link>
                            </div>
                        ))}
                    </div>
                )}
                <Link to="/ListeOffres" className="sm-view-all-button">Voir toutes les offres</Link>
            </section>

             {/* ----- Section Additionnelle (Comment ça marche) ----- */}
             <section className="additional-content" aria-labelledby="additional-content-title">
                <h2 id="additional-content-title">Comment ça marche ?</h2>
                <div className="features-grid">
                     <div className="feature-card"> <FontAwesomeIcon icon={faSearch} aria-hidden="true"/> <h3>1. Recherchez</h3> <p>Utilisez nos filtres avancés pour trouver le stage ou l'alternance idéal.</p> </div>
                     <div className="feature-card"> <FontAwesomeIcon icon={faBuilding} aria-hidden="true"/> <h3>2. Découvrez</h3> <p>Explorez les profils détaillés des entreprises partenaires.</p> </div>
                     <div className="feature-card"> <FontAwesomeIcon icon={faPaperPlane} className="fa-rotate-by" style={{"--fa-rotate-angle": "-15deg"}} aria-hidden="true"/> <h3>3. Postulez</h3> <p>Envoyez votre candidature en quelques clics et suivez son avancement.</p> </div>
                </div>
            </section>

            {/* ----- Footer ----- */}
            <footer className="sm-footer">
                <div className="sm-footer-content">
                    <nav className="sm-footer-links" aria-label="Liens du pied de page">
                        <Link to="/a-propos">À Propos</Link>
                        <Link to="/contact">Contact</Link>
                        <Link to="/mentions-legales">Mentions Légales</Link>
                    </nav>
                    <p>© {new Date().getFullYear()} Plateforme Stages. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    );
}
export default Home;