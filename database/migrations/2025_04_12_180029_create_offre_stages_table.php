<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('offre_stages', function (Blueprint $table) {
            $table->id();
            // Clé étrangère pour le créateur (Responsable RH)
            $table->foreignId('responsable_rh_id')
                  ->nullable() // Mettre nullable si un admin peut créer des offres sans être un RH spécifique
                  ->constrained('responsable_r_h_s') // Assurez-vous que la table 'responsable_r_h_s' existe
                  ->onDelete('cascade'); // ou 'set null' selon votre logique de suppression

            // Clé étrangère pour le service
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');

            // Champs spécifiques à l'offre
            $table->string('titre');
            $table->text('description');
            $table->string('departement')->nullable(); // Département/Pôle au sein de l'entreprise
            $table->integer('duree')->comment('Durée en unités (ex: 6 pour 6 mois)');
            $table->string('unite_duree')->default('mois')->comment('Unité de la durée: mois, semaines'); // Pour préciser l'unité
            $table->integer('nombre_places')->default(1);
            $table->string('ville');
            $table->date('date_debut')->nullable(); // Date de début souhaitée/possible
            $table->date('date_expiration')->nullable(); // Date après laquelle l'offre n'est plus visible/applicable
            $table->string('statut')->default('brouillon'); // brouillon, en_attente, publiee, refusee, archivee, expirée (géré logiquement)

            $table->timestamps(); // created_at, updated_at

            // Index pour améliorer les performances des recherches
            $table->index('responsable_rh_id');
            $table->index('service_id');
            $table->index('statut');
            $table->index('ville');
            $table->index('date_expiration');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offre_stages');
    }
};