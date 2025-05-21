import React, { useState, useEffect, useMemo } from 'react';
import { Link , NavLink} from 'react-router-dom'; // Link est utilisé pour la navbar et potentiellement futurs liens
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding, faMapMarkerAlt, faUsers, faBriefcase,
    faSpinner, faExclamationTriangle, faBuildingUser, faSearch,
    faEnvelope, faPhone, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';
// Assurez-vous que le chemin vers le fichier CSS est correct
import './css/ListeEntreprises.css';

// URL de base de l'API depuis les variables d'environnement ou fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function ListeEntreprises() {
    // --- États du composant ---
    const [entreprises, setEntreprises] = useState([]); // Liste brute des entreprises depuis l'API
    const [isLoading, setIsLoading] = useState(true); // État de chargement
    const [error, setError] = useState(null); // Pour stocker les erreurs de fetch
    const [searchTerm, setSearchTerm] = useState(''); // Terme de recherche saisi par l'utilisateur
    const [expandedEntrepriseId, setExpandedEntrepriseId] = useState(null); // ID de l'entreprise dont les détails sont affichés

    // --- Récupération des données au montage ---
    useEffect(() => {
        const fetchEntreprises = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Appel à l'endpoint API pour lister les responsables/entreprises
                const response = await fetch(`${API_URL}/api/responsables`);

                // Gestion des erreurs HTTP
                if (!response.ok) {
                    let errorBody = `Erreur HTTP: ${response.status} (${response.statusText})`;
                    try {
                        const errorData = await response.json();
                        errorBody = errorData.message || errorBody;
                    } catch (jsonError) { console.debug("Réponse d'erreur non JSON:", jsonError); }
                    throw new Error(errorBody);
                }

                const data = await response.json();

                // Vérification du format des données reçues
                if (Array.isArray(data)) {
                    // IMPORTANT: L'API doit renvoyer ici TOUTES les infos nécessaires
                    // pour l'affichage de base ET les détails étendus (email, tel, services complets...)
                    // pour éviter des appels API supplémentaires au clic sur "Détails".
                    setEntreprises(data);
                } else {
                    console.warn("Les données reçues pour les entreprises ne sont pas un tableau:", data);
                    setEntreprises([]);
                    throw new Error("Format de données inattendu reçu du serveur.");
                }

            } catch (err) {
                console.error("Erreur lors de la récupération des entreprises:", err);
                setError(err.message || "Impossible de charger la liste des entreprises.");
            } finally {
                setIsLoading(false); // Fin du chargement
            }
        };

        fetchEntreprises(); // Appel de la fonction de fetch
    }, []); // Le tableau vide [] assure une exécution unique au montage

    // --- Gestionnaire de changement pour la barre de recherche ---
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setExpandedEntrepriseId(null); // Refermer les détails lors d'une recherche
    };

    // --- Gestionnaire pour afficher/masquer les détails d'une entreprise ---
    const handleToggleDetails = (id) => {
        // Si on clique sur le même ID, on referme (id devient null), sinon on ouvre le nouveau
        setExpandedEntrepriseId(prevId => (prevId === id ? null : id));
    };

    // --- Filtrage des entreprises basé sur le terme de recherche (avec useMemo pour optimisation) ---
    const filteredEntreprises = useMemo(() => {
        return entreprises.filter(entreprise => {
            const lowerSearch = searchTerm.toLowerCase().trim();
            if (!lowerSearch) return true; // Si recherche vide, tout afficher

            // Vérifier si le terme de recherche est inclus dans les champs pertinents
            return (
                (entreprise.nom_entreprise && entreprise.nom_entreprise.toLowerCase().includes(lowerSearch)) ||
                (entreprise.ville && entreprise.ville.toLowerCase().includes(lowerSearch)) ||
                // Vérifier si au moins un service correspond
                (entreprise.services && entreprise.services.some(s => s.nom_service?.toLowerCase().includes(lowerSearch)))
            );
        });
    }, [entreprises, searchTerm]); // Recalculer seulement si la liste ou le terme change

    // --- Fonction utilitaire pour obtenir l'URL complète de l'image de profil ---
    const getImageUrl = (relativePath) => {
        if (!relativePath) return null;
        if (relativePath.startsWith('http')) return relativePath; // Si c'est déjà une URL complète
        // Assure que le lien symbolique storage->public/storage existe (`php artisan storage:link`)
        return `${API_URL}/storage/${relativePath}`;
    };


    // --- Rendu du composant ---
    if (isLoading) {
        return (
            <div className="liste-loading"> {/* Classe pour le style du chargement */}
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Chargement des entreprises...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="liste-error"> {/* Classe pour le style de l'erreur */}
                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                <p>Erreur : {error}</p>
            </div>
        );
    }

    return (
        // Conteneur global de la page
        <div className="liste-entreprises-page">
             {/* Barre de Navigation (identique aux autres pages) */}
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

            {/* Conteneur principal du contenu de la page */}
            <div className="liste-entreprises-container">
                <h1>Découvrez nos Entreprises Partenaires</h1>

                {/* Section de la barre de recherche */}
                <section className="filters-section entreprise-search">
                    <div className="filter-group search-filter">
                        <label htmlFor="search-entreprise-input" className="filter-label">
                           <FontAwesomeIcon icon={faSearch} /> Rechercher une entreprise
                        </label>
                        <input
                            type="search"
                            id="search-entreprise-input"
                            className="filter-input"
                            placeholder="Nom, ville, domaine..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            aria-label="Rechercher des entreprises"
                        />
                    </div>
                </section>

                 {/* Affichage du nombre de résultats trouvés */}
                 <p className="results-count">
                    {filteredEntreprises.length} entreprise{filteredEntreprises.length !== 1 ? 's' : ''} trouvée{filteredEntreprises.length !== 1 ? 's' : ''}
                 </p>

                {/* Affichage conditionnel : soit la liste vide, soit la grille d'entreprises */}
                {filteredEntreprises.length === 0 && !isLoading ? (
                    <div className="liste-empty"> {/* Classe pour le style "aucun résultat" */}
                         <FontAwesomeIcon icon={faBuilding} size="3x" />
                        <p>
                           {searchTerm ? 'Aucune entreprise ne correspond à votre recherche.' : 'Aucune entreprise à afficher pour le moment.'}
                        </p>
                    </div>
                ) : (
                    // Liste (grille) des entreprises
                    <ul className="entreprises-grid">
                        {/* Boucle sur les entreprises filtrées */}
                        {filteredEntreprises.map((entreprise) => {
                            const imageUrl = getImageUrl(entreprise.photo_profil);
                            const isExpanded = expandedEntrepriseId === entreprise.id; // Vérifie si la carte est étendue

                            return (
                                // Élément de liste représentant une carte d'entreprise
                                <li key={entreprise.id} className={`entreprise-card ${isExpanded ? 'expanded' : ''}`}>

                                    {/* En-tête de la carte */}
                                    <div className="entreprise-card-header">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={`Logo de ${entreprise.nom_entreprise || 'entreprise'}`} className="entreprise-logo" />
                                        ) : (
                                            <div className="entreprise-logo-placeholder">
                                                <FontAwesomeIcon icon={faBuildingUser} /> {/* Icône par défaut */}
                                            </div>
                                        )}
                                        <h2 className="entreprise-nom">{entreprise.nom_entreprise || 'Nom non disponible'}</h2>
                                    </div>

                                    {/* Corps de la carte */}
                                    <div className="entreprise-card-body">
                                        {/* Informations toujours visibles */}
                                        <p className="entreprise-info ville">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="info-icon" />
                                            {entreprise.ville || 'Ville non spécifiée'}
                                        </p>
                                        <p className="entreprise-info employes">
                                            <FontAwesomeIcon icon={faUsers} className="info-icon" />
                                            {entreprise.nombre_employes != null ? `${entreprise.nombre_employes} employé(s)` : 'Taille non spécifiée'}
                                        </p>
                                        {/* Aperçu des services/domaines */}
                                        {entreprise.services && entreprise.services.length > 0 && (
                                            <div className="entreprise-services-summary">
                                                 <FontAwesomeIcon icon={faBriefcase} className="info-icon" />
                                                 {/* Affiche les 2 premiers services, puis "..." */}
                                                 {entreprise.services.slice(0, 2).map(s => s.nom_service).join(', ')}
                                                 {entreprise.services.length > 2 ? '...' : ''}
                                            </div>
                                        )}

                                        {/* Section des détails qui s'affiche si isExpanded est true */}
                                        {isExpanded && (
                                            <div className="entreprise-details-expanded" id={`details-${entreprise.id}`}>
                                                <h4>Informations Complémentaires</h4>
                                                {/* Contact - Attention à la confidentialité sur page publique */}
                                                {entreprise.email && (
                                                    <p className="entreprise-info email">
                                                        <FontAwesomeIcon icon={faEnvelope} className="info-icon" />
                                                        <a href={`mailto:${entreprise.email}`}>{entreprise.email}</a>
                                                        {/* <span className="privacy-note">(Contact principal)</span> */}
                                                    </p>
                                                )}
                                                {entreprise.telephone && (
                                                     <p className="entreprise-info telephone">
                                                        <FontAwesomeIcon icon={faPhone} className="info-icon" />
                                                        {entreprise.telephone}
                                                     </p>
                                                )}
                                                {/* Liste complète des services/domaines */}
                                                {entreprise.services && entreprise.services.length > 0 && (
                                                    <div className="entreprise-services-full">
                                                        <p className="services-title-full">
                                                            <FontAwesomeIcon icon={faBriefcase} className="info-icon" />
                                                            Domaines d'activité :
                                                        </p>
                                                        <ul className="services-list-full">
                                                            {entreprise.services.map(service => (
                                                                <li key={service.id} className="service-tag-full">{service.nom_service}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {/* Potentiellement ajouter une description longue de l'entreprise ici si disponible */}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pied de la carte */}
                                    <div className="entreprise-card-footer">
                                        {/* Bouton pour afficher/masquer les détails */}
                                        <button
                                            onClick={() => handleToggleDetails(entreprise.id)}
                                            className="entreprise-details-button"
                                            aria-expanded={isExpanded} // Pour l'accessibilité
                                            aria-controls={`details-${entreprise.id}`} // Lie le bouton au contenu
                                        >
                                            <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="btn-icon-right" />
                                            {isExpanded ? 'Masquer Détails' : 'Voir Détails'}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ListeEntreprises;