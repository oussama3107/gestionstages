<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

// Supprimé: use Tymon\JWTAuth\Contracts\JWTSubject;

class Administrateur extends Authenticatable // Supprimé: implements JWTSubject
{
    use HasFactory;

    // Assurez-vous que le nom de la table est correct si ce n'est pas 'administrateurs'
    // protected $table = 'administrateurs';

    protected $fillable = [
        'nom', // Exemple, ajoutez les champs réels
        'prenom', // Exemple
        'email',
        'mot_de_passe',
        // Ajoutez d'autres champs fillable si nécessaire
    ];

    protected $hidden = [
        'mot_de_passe',
    ];

    protected $casts = [
        'mot_de_passe' => 'hashed',
    ];

    // Méthodes JWT supprimées
}