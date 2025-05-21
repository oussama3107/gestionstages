import React, { useState, useEffect, useMemo } from 'react'; // Ajouter useMemo
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding, faBriefcase, faMapMarkerAlt, faSitemap,
    faClock, faUsers, faPaperPlane, faSpinner,
    faExclamationTriangle, faFolderOpen, faSearch // Ajouter faSearch
} from '@fortawesome/free-solid-svg-icons';
import './css/ListeOffres.css'; // Assurez-vous que ce fichier CSS existe

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function ListeOffres() {
    const [offres, setOffres] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // --- NOUVEAUX ÉTATS POUR LES FILTRES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVille, setFilterVille] = useState('');
    // Optionnel : Si vous voulez aussi filtrer par service côté client
    // const [availableServices, setAvailableServices] = useState([]);
    // const [filterService, setFilterService] = useState('');

    // --- useEffect pour fetch data (inchangé pour l'instant) ---

    useEffect(() => {
      const fetchOffresPubliees = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Utilisation de la variable API_URL
          const response = await fetch(`${API_URL}/api/offres?statut=publiee`);
  
          if (!response.ok) {
            // Essayer d'obtenir plus de détails sur l'erreur si possible
            let errorBody = `Erreur HTTP: ${response.status} (${response.statusText})`;
            try {
                // Si le serveur renvoie un message d'erreur en JSON (même pour une erreur HTTP)
                const errorData = await response.json();
                errorBody = errorData.message || errorBody;
            } catch (jsonError) {
                // Ignorer si le corps n'est pas JSON (pour l'erreur <!DOCTYPE... par exemple)
                console.debug("Réponse d'erreur non JSON:", jsonError);
            }
            throw new Error(errorBody);
          }
  
          const data = await response.json();
  
          // Vérifier si data est bien un tableau (sécurité supplémentaire)
          if (Array.isArray(data)) {
              setOffres(data);
          } else {
              console.warn("Les données reçues ne sont pas un tableau:", data);
              setOffres([]); // Initialiser comme tableau vide en cas de format inattendu
              throw new Error("Format de données inattendu reçu du serveur.");
          }
  
        } catch (err) {
          console.error("Erreur lors de la récupération des offres publiées:", err);
          // Afficher le message de l'erreur construite ou un message générique
          setError(err.message || "Impossible de charger les offres.");
        } finally {
          setIsLoading(false);
        }
      };
        fetchOffresPubliees();
    }, []);

    const handlePostulerClick = (offreId) => {
      console.log(`Redirection vers login pour postuler à l'offre ID: ${offreId}`);
      navigate('/login', {
          state: {
              intendedOfferId: offreId,
              from: window.location.pathname // Garder la page actuelle pour redirection éventuelle post-login
          }
      });
    };
    // --- NOUVEAUX HANDLERS POUR LES FILTRES ---
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        // Réinitialiser la pagination si vous en ajoutez une plus tard
        // setCurrentPage(1);
    };
    const handleVilleChange = (event) => {
        setFilterVille(event.target.value);
        // setCurrentPage(1);
    };
    // Optionnel: const handleServiceChange = (event) => { setFilterService(event.target.value); setCurrentPage(1); };

    // --- LOGIQUE DE FILTRAGE avec useMemo ---
    const filteredOffres = useMemo(() => {
        return offres.filter(offre => {
            const lowerSearch = searchTerm.toLowerCase().trim();
            const lowerVille = filterVille.toLowerCase().trim();

            // Filtrage par ville
            const matchVille = !lowerVille || (offre.ville && offre.ville.toLowerCase().includes(lowerVille));

            // Filtrage par terme de recherche (dans plusieurs champs)
            const matchSearch = !lowerSearch || (
                (offre.titre && offre.titre.toLowerCase().includes(lowerSearch)) ||
                (offre.description && offre.description.toLowerCase().includes(lowerSearch)) ||
                (offre.responsableRh?.nom_entreprise && offre.responsableRh.nom_entreprise.toLowerCase().includes(lowerSearch)) ||
                (offre.service?.nom_service && offre.service.nom_service.toLowerCase().includes(lowerSearch)) ||
                (offre.ville && offre.ville.toLowerCase().includes(lowerSearch)) || // Inclure ville dans recherche générale
                (offre.departement && offre.departement.toLowerCase().includes(lowerSearch))
            );

            // Optionnel : Filtrage par service
            // const matchService = !filterService || String(offre.service_id) === String(filterService);

            // Retourner true si tous les filtres actifs correspondent
            return matchVille && matchSearch; // && matchService;
        });
    }, [offres, searchTerm, filterVille /*, filterService */]); // Recalculer si ces dépendances changent



    if (isLoading) {
      // Utiliser des classes CSS spécifiques pour une meilleure stylisation
      return <div className="liste-offres-loading">Chargement des offres...</div>;
    }
  
    if (error) {
      // Idem pour les erreurs
      return <div className="liste-offres-error">Erreur : {error}</div>;
    }

    return (
        <div>
            {/* --- Navbar (inchangée) --- */}
            <header className="sm-navbar">
              <Link to="/" className="sm-navbar-brand">
                  <img src="/logo.png" alt="Plateforme Logo" className="sm-logo" />
              </Link>
              <nav className="sm-nav-links">
                <Link to="/" className={window.location.pathname === '/' ? 'active' : ''}>Accueil</Link>
                <Link to="/ListeOffres" className={window.location.pathname.startsWith('/ListeOffres') ? 'active' : ''}>Offres</Link> {/* Adapter chemin */}
                <Link to="/ListeEntreprises" className={window.location.pathname.startsWith('/ListeEntreprises') ? 'active' : ''}>Entreprises</Link> {/* Adapter chemin */}
                {/* <Link to="/conseils">Conseils</Link> */}
              </nav>
              <div className="sm-navbar-actions">
                <Link to="/login" className="sm-action-button login">Se Connecter</Link>
                {/* Ou bouton s'inscrire séparé si design différent */}
                {/* <Link to="/register" className="sm-action-button register">S'inscrire</Link> */}
              </div>
            </header> 

            <div className="liste-offres-container">
                <h1>Offres de Stage Disponibles</h1>

                {/* --- BARRE DE RECHERCHE ET FILTRAGE --- */}
                <section className="filters-section">
                    <div className="filter-group search-filter">
                        <label htmlFor="search-input" className="filter-label">
                           <FontAwesomeIcon icon={faSearch} /> Rechercher
                        </label>
                        <input
                            type="search"
                            id="search-input"
                            className="filter-input"
                            placeholder="Mot-clé, entreprise, domaine..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="filter-group ville-filter">
                        <label htmlFor="ville-input" className="filter-label">
                           <FontAwesomeIcon icon={faMapMarkerAlt} /> Ville
                        </label>
                        <input
                            type="text"
                            id="ville-input"
                            className="filter-input"
                            placeholder="Filtrer par ville"
                            value={filterVille}
                            onChange={handleVilleChange}
                        />
                    </div>
                    {/* Optionnel : Filtre par Service
                    <div className="filter-group service-filter">
                         <label htmlFor="service-select" className="filter-label">
                            <FontAwesomeIcon icon={faBriefcase} /> Domaine
                         </label>
                         <select
                            id="service-select"
                            className="filter-select"
                            value={filterService}
                            onChange={handleServiceChange}
                         >
                            <option value="">Tous les domaines</option>
                            {availableServices.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.nom_service || service.nom}
                                </option>
                            ))}
                         </select>
                    </div>
                    */}
                </section>

                {/* Affichage du nombre de résultats (optionnel) */}
                <p className="results-count">
                    {filteredOffres.length} offre{filteredOffres.length !== 1 ? 's' : ''} trouvée{filteredOffres.length !== 1 ? 's' : ''}
                </p>

                {/* Utiliser filteredOffres pour le rendu */}
                {filteredOffres.length === 0 && !isLoading ? ( // Condition mise à jour
                    <div className="liste-offres-empty">
                        <FontAwesomeIcon icon={faFolderOpen} size="3x" />
                        <p>
                            {searchTerm || filterVille /* || filterService */ ? 'Aucune offre ne correspond à vos critères.' : 'Aucune offre de stage publiée.'}
                        </p>
                    </div>
                ) : (
                    <ul className="offres-list">
                        {/* Boucler sur filteredOffres au lieu de offres */}
                        {filteredOffres.map((offre) => (
                            <li key={offre.id} className="offre-item">
                                <h2>{offre.titre || 'Titre non disponible'}</h2>
                                <div className="offre-meta-details">
                                    {offre.responsableRh && (
                                        <p className="offre-entreprise">
                                            <FontAwesomeIcon icon={faBuilding} className="offre-meta-icon" />
                                            {offre.responsableRh.nom_entreprise || 'Non spécifiée'}
                                        </p>
                                    )}
                                     {offre.service && (
                                         <p className="offre-service">
                                            <FontAwesomeIcon icon={faBriefcase} className="offre-meta-icon" />
                                            {offre.service.nom_service || 'Non spécifié'}
                                         </p>
                                    )}
                                    <p className="offre-ville">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="offre-meta-icon" />
                                        {offre.ville || 'Non spécifié'}
                                    </p>
                                    {offre.departement && (
                                        <p className="offre-departement">
                                            <FontAwesomeIcon icon={faSitemap} className="offre-meta-icon" />
                                            {offre.departement}
                                        </p>
                                    )}
                                    <p className="offre-duree">
                                        <FontAwesomeIcon icon={faClock} className="offre-meta-icon" />
                                        {offre.duree ? `${offre.duree} mois` : 'Non spécifiée'}
                                    </p>
                                    <p className="offre-places">
                                        <FontAwesomeIcon icon={faUsers} className="offre-meta-icon" />
                                        Places: {offre.nombre_places ?? 'Non spécifié'}
                                    </p>
                                </div>
                                <p className="offre-description">{offre.description || 'Pas de description.'}</p>
                                <button
                                    className="postuler-bouton"
                                    onClick={() => handlePostulerClick(offre.id)}
                                    aria-label={`Postuler pour l'offre ${offre.titre || 'sans titre'}`}
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} className="btn-icon-left" />
                                    Postuler
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ListeOffres;