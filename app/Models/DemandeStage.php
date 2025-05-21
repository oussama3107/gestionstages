<?php
// app/Models/DemandeStage.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemandeStage extends Model
{
    use HasFactory;

    protected $table = 'demande_stages'; // Correspond à votre migration

    // Assurez-vous que toutes ces colonnes existent dans votre table 'demande_stages'
    // ET qu'elles correspondent aux noms de clés envoyés par React
    // ET aux noms de clés attendus par votre CandidatureController@store
    protected $fillable = [
        'etudiant_id',
        'stage_id', // Clé étrangère vers offre_stages (comme dans votre migration)
        'cv',
        'lettre_de_motivation',
        'statut',
        'date_candidature',
        'responsable_rh_id', // ID du RH de l'offre (si stocké ici)
        'message_motivation',
    ];

    protected $casts = [
        'date_candidature' => 'date',
    ];

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class, 'etudiant_id');
    }

    /**
     * Relation vers l'offre de stage.
     * Utilise la clé étrangère 'stage_id' pour correspondre à la migration.
     * Le modèle lié est Offre (qui pointe vers la table 'offre_stages').
     */
    public function offreStage(): BelongsTo
    {
        // Le modèle est App\Models\Offre, la clé étrangère dans cette table (demande_stages) est 'stage_id'
        // Assurez-vous que App\Models\Offre existe et que sa propriété $table est 'offre_stages'
        return $this->belongsTo(Offre::class, 'stage_id'); // Correction: utiliser Offre::class
    }

    /**
     * Relation vers le Responsable RH (créateur de l'offre).
     * Ceci suppose que la colonne 'responsable_rh_id' existe bien dans la table 'demande_stages'.
     */
    public function responsableRh(): BelongsTo
    {
        // Assurez-vous que la colonne 'responsable_rh_id' existe et est remplie
        return $this->belongsTo(ResponsableRh::class, 'responsable_rh_id');
    }
}