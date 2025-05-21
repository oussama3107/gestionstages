<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable; // Gardez ceci si utilisé par Laravel autrement

// Supprimé: use Tymon\JWTAuth\Contracts\JWTSubject;

class Etudiant extends Authenticatable // Supprimé: implements JWTSubject
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'mot_de_passe',
        'telephone',
        'ville',
        'cv',
        'lettre_motivation',
        'photo_profil',
    ];

    protected $hidden = [
        'mot_de_passe',
    ];

    protected $casts = [
        'mot_de_passe' => 'hashed', // Pour Laravel 10+
    ];

    // Méthodes JWT supprimées
}