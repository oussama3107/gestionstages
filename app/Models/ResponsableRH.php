<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Models\Service; // Assurez-vous que Service est importé

// Supprimé: use Tymon\JWTAuth\Contracts\JWTSubject;

class ResponsableRh extends Authenticatable // Supprimé: implements JWTSubject
{
    use HasFactory;

    /**
     * Le nom de la table associée au modèle.
     */
    protected $table = 'responsable_r_h_s'; // C'est correct basé sur vos migrations

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'mot_de_passe',
        'telephone',
        'ville',
        'nom_entreprise',
        'nombre_employes',
        'photo_profil',
    ];

    protected $hidden = [
        'mot_de_passe',
    ];

     protected $casts = [
         'mot_de_passe' => 'hashed',
     ];

     /**
      * Définit la relation Many-to-Many avec les Services.
      */
     public function services() // <--- MÉTHODE CORRIGÉE
     {
         // --- CORRECTION : Utiliser le nom correct de la table pivot ---
         return $this->belongsToMany(
             Service::class,
             'responsable_rh_service', // <--- CORRIGÉ ICI ! Correspond à la migration.
             'responsable_rh_id',      // Clé étrangère de CE modèle dans la table pivot
             'service_id'              // Clé étrangère de l'AUTRE modèle (Service) dans la table pivot
         );
         // --- FIN CORRECTION ---
     }

    // Méthodes JWT supprimées
}