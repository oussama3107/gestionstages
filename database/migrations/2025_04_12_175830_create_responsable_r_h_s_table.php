<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_responsable_r_h_s_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('responsable_r_h_s', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom')->nullable();
            $table->string('email')->unique();
            $table->string('mot_de_passe');
            $table->string('ville');
            $table->string('telephone');
            $table->string('nom_entreprise');
            // $table->string('services'); // <-- REMOVED THIS LINE
            $table->integer('nombre_employes');
            $table->string('photo_profil')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('responsable_r_h_s');
    }
};