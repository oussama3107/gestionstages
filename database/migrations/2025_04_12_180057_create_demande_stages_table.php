<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   // database/migrations/xxxx_xx_xx_xxxxxx_create_demande_stages_table.php
public function up(): void
{
    Schema::create('demande_stages', function (Blueprint $table) {
        $table->id();
        $table->foreignId('etudiant_id')->constrained('etudiants')->onDelete('cascade');
        // ICI, la colonne est nommée 'stage_id'
        $table->foreignId('stage_id')->constrained('offre_stages')->onDelete('cascade');
        $table->string('cv');
        $table->string('lettre_de_motivation');
        $table->string('statut')->default('en attente');
        $table->date('date_candidature');
        $table->foreignId('responsable_rh_id')->nullable()->constrained('responsable_r_h_s')->onDelete('set null');
        $table->text('message_motivation')->nullable();
        // **NOTE :** responsable_rh_id et message_motivation MANQUAIENT dans la migration que vous avez postée
        // mais étaient dans le modèle DemandeStage.php que j'ai corrigé.
        // S'ils manquent vraiment dans la table, cela causera d'autres erreurs lors du DemandeStage::create().
        $table->timestamps();

        // La contrainte unique doit utiliser le même nom de colonne
        $table->unique(['etudiant_id', 'stage_id']); // C'est correct si la colonne est 'stage_id'
    });
}
    public function down(): void
    {
        Schema::dropIfExists('demande_stages');
    }
};