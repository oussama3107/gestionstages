<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServicesTableSeeder extends Seeder
{
    public function run()
    {
        $services = [
            "Ressources humaines",
            "Informatique",
            "Développement web",
            "Support technique",
            "Marketing",
            "Communication",
            "Comptabilité",
            "Finance",
            "Juridique",
            "Logistique",
            "Achats",
            "Ventes",
            "Production",
            "Qualité",
            "R&D (Recherche et Développement)",
            "Gestion de projets",
            "Relation client",
            "Service après-vente",
            "Gestion administrative",
            "Sécurité",
            "Transport",
            "Import / Export",
            "Design graphique",
            "UI/UX",
            "Développement mobile",
            "Maintenance industrielle",
            "Contrôle de gestion",
            "Audit interne",
            "Stratégie d’entreprise",
            "Innovation",
            "Formation",
            "Service juridique international",
            "Relations publiques",
            "Développement commercial",
            "Ingénierie",
            "Gestion des risques",
            "Assurance qualité",
            "Développement durable",
            "Gestion immobilière",
            "Planification stratégique",
            "Responsabilité sociétale des entreprises (RSE)"
        ];

        foreach ($services as $service) {
            DB::table('services')->insert([
                'nom_service' => $service,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
