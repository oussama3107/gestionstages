import React, { useState, useEffect } from 'react';
import './css/VilleSelector.css'; // Importer le CSS du dropdown
// import '@fortawesome/fontawesome-free/css/all.min.css'; // Pour icônes

// Charger les villes (depuis fichier ou API)
import { villesMaroc } from './data/villes'; // Assurez-vous que ce chemin est correct

function VilleSelector({ selectedVilles = [], onSave }) {
    // Utiliser l'état initial basé sur les props
    const [currentSelection, setCurrentSelection] = useState([...selectedVilles]);
    const [searchTerm, setSearchTerm] = useState('');

    // Mettre à jour l'état interne si la prop externe change
    useEffect(() => {
        setCurrentSelection([...selectedVilles]);
    }, [selectedVilles]);

    const filteredVilles = villesMaroc.filter(ville =>
        ville.nom.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.nom.localeCompare(b.nom));

    const handleCheckboxChange = (e) => {
        const villeName = e.target.value;
        const isChecked = e.target.checked;
        let newSelection;
        if (isChecked) {
            newSelection = [...currentSelection, villeName];
        } else {
            newSelection = currentSelection.filter(v => v !== villeName);
        }
        // Utiliser un Set pour garantir l'unicité avant de sauvegarder
        const uniqueSelection = Array.from(new Set(newSelection));
        setCurrentSelection(uniqueSelection); // Mettre à jour état local pour affichage
        onSave(uniqueSelection); // Informer le parent du changement
    };

    // Empêche le clic de fermer le dropdown (géré par Home.jsx)
    const handleDropdownClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="ville-dropdown-content" onClick={handleDropdownClick}>
            <div className="ville-search-bar">
                <i className="fas fa-search" aria-hidden="true"></i> {/* Icône */}
                <input
                    type="search" // Utiliser type search
                    placeholder="Rechercher une ville..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
            {filteredVilles.length > 0 ? (
                <ul className="ville-list">
                    {filteredVilles.map(ville => (
                        <li key={ville.id} className="ville-item">
                            <input
                                type="checkbox"
                                id={`ville-dd-${ville.id}`}
                                value={ville.nom} // La valeur est le nom de la ville
                                checked={currentSelection.includes(ville.nom)} // Vérifier si le nom est dans la sélection
                                onChange={handleCheckboxChange}
                            />
                            <label htmlFor={`ville-dd-${ville.id}`}>{ville.nom}</label>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-results-text">Aucune ville trouvée.</p>
            )}
        </div>
    );
}

export default VilleSelector;