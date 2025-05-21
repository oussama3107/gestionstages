<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany; // Import

class Service extends Model
{
    use HasFactory;

    protected $table = 'services'; // Explicitly define if needed

    // Make sure 'nom_service' (or 'nom') is fillable if you create services via code
    protected $fillable = [
        'nom_service', // Or 'nom' depending on your column name
    ];

    /**
     * The responsables that belong to the Service.
     * Defines the inverse Many-to-Many relationship.
     */
    public function responsables(): BelongsToMany
    {
        return $this->belongsToMany(ResponsableRh::class, 'responsable_rh_service');
    }
}