<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_responsable_rh_service_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('responsable_rh_service', function (Blueprint $table) {
            // Foreign key for ResponsableRh model
            $table->foreignId('responsable_rh_id')
                  ->constrained('responsable_r_h_s') // Link to 'responsable_r_h_s' table
                  ->onDelete('cascade'); // Delete pivot entry if responsable is deleted

            // Foreign key for Service model
            $table->foreignId('service_id')
                  ->constrained('services') // Link to 'services' table
                  ->onDelete('cascade'); // Delete pivot entry if service is deleted

            // Define composite primary key
            $table->primary(['responsable_rh_id', 'service_id']);

            // No timestamps needed for default pivot unless required
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('responsable_rh_service');
    }
};