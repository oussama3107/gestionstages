<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

// Consider renaming to OffreStage to match table name more closely
class Offre extends Model
{
    use HasFactory;

    protected $table = 'offre_stages';

    protected $fillable = [
        'responsable_rh_id',
        'service_id',
        'titre',
        'description',
        'departement',
        'duree',
        'unite_duree', // Added
        'nombre_places',
        'ville',
        'date_debut',      // Added
        'date_expiration', // Added
        'statut',
    ];

    protected $casts = [
        'duree' => 'integer',
        'nombre_places' => 'integer',
        'date_debut' => 'datetime:Y-m-d', // Using datetime for Carbon instances
        'date_expiration' => 'datetime:Y-m-d', // Using datetime for Carbon instances
        // 'created_at' and 'updated_at' are automatically Carbon instances
    ];

    /**
     * Get the formatted duration.
     * Usage: $offre->duree_formatee
     */
    public function getDureeFormateeAttribute(): string
    {
        if ($this->duree && $this->unite_duree) {
            return $this->duree . ' ' . $this->unite_duree;
        }
        return $this->duree ? (string)$this->duree : 'N/A';
    }

    /**
     * Check if the offer is expired.
     * Usage: $offre->is_expired
     */
    public function getIsExpiredAttribute(): bool
    {
        if (!$this->date_expiration) {
            return false;
        }
        // $this->date_expiration is already a Carbon instance due to $casts
        return $this->date_expiration->endOfDay()->isPast();
    }

    // --- RELATIONS ELOQUENT ---

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    public function responsableRh(): BelongsTo
    {
        // Assuming your Responsable RH model is named ResponsableRh
        // And its table is 'responsable_r_h_s' as per your migrations
        return $this->belongsTo(ResponsableRh::class, 'responsable_rh_id');
    }

    public function demandesStages(): HasMany
    {
        // Corrected foreign key to 'stage_id' as per your demande_stages migration
        return $this->hasMany(DemandeStage::class, 'stage_id');
    }

    // --- SCOPES (Optional but recommended for status and common queries) ---

    /**
     * Scope a query to only include published offers.
     */
    public function scopePublished($query)
    {
        return $query->where('statut', 'publiee')
                     ->where(function ($q) {
                         $q->whereNull('date_expiration')
                           ->orWhere('date_expiration', '>=', Carbon::today());
                     });
    }

    /**
     * Scope a query to only include non-expired offers.
     */
    public function scopeNotExpired($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('date_expiration')
              ->orWhere('date_expiration', '>=', Carbon::today()->startOfDay());
        });
    }
}