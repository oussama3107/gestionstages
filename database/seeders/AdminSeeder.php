<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Administrateur; // Remplace par ton modèle Admin si tu as un modèle spécifique
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run()
    {
        Administrateur::create([
            'nom' => 'fadoua atmani',
            'email' => 'fadouaatmani@gmail.com',
            'mot_de_passe' => Hash::make('1234567890'), // mot de passe sécurisé
        ]);
    }
}

