<?php
// app/Http/Controllers/CandidatureController.php

namespace App\Http\Controllers;

use App\Models\DemandeStage; // Modèle principal pour cette ressource
use App\Models\Offre;        // Modèle pour la table 'offre_stages'
use App\Models\Etudiant;
use App\Models\ResponsableRh;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Mail;
use App\Mail\CandidatureAccepteeMail; // Assurez-vous que ce Mailable est correct
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\QueryException; // Ajouté pour une meilleure gestion d'erreur
// Supprimé: use Illuminate\Support\Facades\Auth; // Pas utilisé dans ce contexte public

// ATTENTION : TOUTES LES MÉTHODES SONT PUBLIQUES DANS CET EXEMPLE
class CandidatureController extends Controller
{
    /**
     * Store a newly created candidature in storage.
     * Attend 'etudiant_id' et 'stage_id' (pour l'ID de l'offre).
     */
    public function store(Request $request)
    {
        Log::info('CandidatureController@store: Request received.', $request->all());

        $validator = Validator::make($request->all(), [
            'etudiant_id' => [
                'required', 'integer', 'exists:etudiants,id',
                function ($attribute, $value, $fail) {
                    $etudiant = Etudiant::find($value);
                    if (!$etudiant) { $fail('Étudiant non trouvé.'); return; } // Déjà couvert par 'exists'
                    if (empty($etudiant->cv)) { $fail('Un CV est requis dans votre profil pour postuler.'); }
                    if (empty($etudiant->lettre_motivation)) { $fail('Une lettre de motivation est requise dans votre profil pour postuler.'); }
                },
                // Vérifier l'unicité en utilisant la colonne 'stage_id' de la table 'demande_stages'
                Rule::unique('demande_stages')->where(function ($query) use ($request) {
                    return $query->where('etudiant_id', $request->input('etudiant_id'))
                                 ->where('stage_id', $request->input('stage_id')); // Utilise la clé 'stage_id'
                }),
            ],
            // 'stage_id' est la clé envoyée par React pour l'ID de l'offre
            'stage_id' => 'required|integer|exists:offre_stages,id', // Valide que l'offre (avec cet ID) existe dans la table 'offre_stages'
            'message_motivation' => 'nullable|string|max:2000',
        ], [
            'stage_id.unique' => 'Vous avez déjà postulé à cette offre.', // Message pour la règle Rule::unique
            'etudiant_id.required' => 'L\'identifiant de l\'étudiant est requis.',
            'stage_id.required' => 'L\'identifiant de l\'offre est requis.'
        ]);

        if ($validator->fails()) {
            Log::warning('CandidatureController@store: Validation échouée.', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $etudiant = Etudiant::findOrFail($request->input('etudiant_id')); // findOrFail pour stopper si non trouvé
            $offre = Offre::findOrFail($request->input('stage_id')); // findOrFail pour stopper si non trouvé

            // Vérifier si l'offre a un responsable (important pour l'assignation et les notifications)
            if (empty($offre->responsable_rh_id)) {
                Log::warning("CandidatureController@store: Offre ID {$offre->id} n'a pas de 'responsable_rh_id' défini. La candidature sera créée sans responsable_rh_id direct si la colonne n'existe pas dans demande_stages ou n'est pas fillable.");
            }

            $dataToCreate = $validator->validated(); // Contient etudiant_id, stage_id, message_motivation
            // Les clés dans $dataToCreate correspondent maintenant aux clés validées

            // Remplir les champs basés sur votre migration `demande_stages`
            $dataToCreate['cv'] = $etudiant->cv; // Comme dans votre migration (redondant)
            $dataToCreate['lettre_de_motivation'] = $etudiant->lettre_motivation; // Comme dans votre migration (redondant)
            $dataToCreate['date_candidature'] = now()->toDateString(); // Comme dans votre migration
            $dataToCreate['statut'] = 'envoyee'; // Statut initial
            // Assigner le responsable_rh_id de l'offre à la candidature
            // Assurez-vous que 'responsable_rh_id' est dans $fillable de DemandeStage
            // ET que la colonne existe dans la table 'demande_stages'
            if (Schema::hasColumn('demande_stages', 'responsable_rh_id')) {
                 $dataToCreate['responsable_rh_id'] = $offre->responsable_rh_id;
            } else {
                 Log::warning("Colonne 'responsable_rh_id' non trouvée dans 'demande_stages' lors de la création de la demande pour offre ID {$offre->id}.");
            }


            $demande = DemandeStage::create($dataToCreate);

            Log::info("CandidatureController@store: DemandeStage ID {$demande->id} créée. RH ID (de l'offre): {$offre->responsable_rh_id}");
            // Logique de notification (simulée pour l'instant)
            if ($offre->responsable_rh_id) {
                Log::info("NOTIFICATION SIMULÉE (store): Envoyer notif au Responsable ID {$offre->responsable_rh_id} pour demande ID {$demande->id}");
            }

            return response()->json(['message' => 'Candidature envoyée avec succès !', 'demande_id' => $demande->id], 201);

        } catch (ModelNotFoundException $e) { // Gérer si findOrFail échoue
            Log::error("CandidatureController@store: Étudiant ou Offre non trouvé avec findOrFail.", ['exception_message' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur: Les informations de l\'étudiant ou de l\'offre sont introuvables.'], 404);
        } catch (QueryException $e) { // Gérer erreurs SQL spécifiques
            $errorCode = $e->errorInfo[1] ?? null;
            if ($errorCode == 1062 || (is_string($e->getMessage()) && str_contains(strtolower($e->getMessage()), 'unique constraint failed'))) { // MySQL & SQLite duplicate entry
                Log::warning("CandidatureController@store: Tentative de création de candidature dupliquée (DB).", ['exception_message' => $e->getMessage()]);
                // Retourner l'erreur de validation sur stage_id (ou etudiant_id selon la contrainte)
                return response()->json(['errors' => ['stage_id' => ['Vous avez déjà postulé à cette offre.']]], 422);
            }
            Log::error("CandidatureController@store: Erreur QueryException.", ['exception_message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur de base de données lors de l\'envoi.'], 500);
        } catch (Exception $e) {
            Log::error("CandidatureController@store: Erreur inattendue.", ['exception_message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur inattendue lors de l\'envoi.'], 500);
        }
    }

    public function indexEtudiant(Request $request)
    {
        $validator = Validator::make($request->query(), ['etudiant_id' => 'required|integer|exists:etudiants,id']);
        if ($validator->fails()) { return response()->json(['errors' => $validator->errors()], 422); }

        $etudiantId = $request->query('etudiant_id');
        Log::info("CandidatureController@indexEtudiant pour Etudiant ID: {$etudiantId}");

        try {
            $demandes = DemandeStage::where('etudiant_id', $etudiantId)
                ->with([
                    // La relation offreStage dans DemandeStage utilise 'stage_id' et retourne un objet Offre
                    'offreStage:id,titre,responsable_rh_id', // Charger l'ID du RH de l'offre
                    'offreStage.responsableRh:id,nom_entreprise' // Charger le nom de l'entreprise
                ])
                // Assurez-vous que ces colonnes existent dans la table 'demande_stages'
                ->select(
                    'id', 'etudiant_id', 'stage_id', // 'stage_id' est la clé vers offre_stages
                    'responsable_rh_id', // ID du RH de l'offre (si copié dans demande_stages)
                    'statut', 'message_motivation', 'date_candidature',
                    'created_at', 'updated_at'
                )
                ->orderBy('created_at', 'desc')->get();
            return response()->json($demandes);
        } catch (Exception $e) { /* ... gestion erreur ... */ }
    }

    public function indexResponsable(Request $request)
    {
        $validator = Validator::make($request->query(), ['responsable_id' => 'required|integer|exists:responsable_r_h_s,id']);
        if ($validator->fails()) { return response()->json(['errors' => $validator->errors()], 422); }
        $responsableId = $request->query('responsable_id');

        try {
            // S'assurer que la colonne 'responsable_rh_id' existe bien dans 'demande_stages' pour ce filtre
            if (!Schema::hasColumn('demande_stages', 'responsable_rh_id')) {
                 Log::critical("CONF MANQUANTE: 'responsable_rh_id' absente de 'demande_stages'.");
                 // Fallback: récupérer les offres du RH, puis les demandes pour ces offres
                 $offreIds = Offre::where('responsable_rh_id', $responsableId)->pluck('id');
                 if ($offreIds->isEmpty()) return response()->json([]);
                 $demandes = DemandeStage::whereIn('stage_id', $offreIds) // Utilise stage_id
                                        ->with(['etudiant', 'offreStage:id,titre'])
                                        ->orderBy('created_at', 'desc')->get();
            } else {
                  $demandes = DemandeStage::where('responsable_rh_id', $responsableId)
                                         ->with(['etudiant', 'offreStage:id,titre'])
                                         ->orderBy('created_at', 'desc')->get();
            }
            return response()->json($demandes);
        } catch (Exception $e) { /* ... gestion erreur ... */ }
    }

    public function updateStatus(Request $request, DemandeStage $candidature) // Utilise Route Model Binding
    {
        Log::info("CandidatureController@updateStatus pour DemandeStage ID: {$candidature->id}, statut: {$request->input('statut')}");
        $validator = Validator::make($request->all(), [
            'statut' => ['required', 'string', Rule::in(['vue', 'entretien', 'entretien_planifie', 'entretien_effectue', 'acceptee', 'refusee', 'archivee'])]
        ]);
        if ($validator->fails()) { return response()->json(['errors' => $validator->errors()], 422); }

        $newStatus = $request->input('statut');
        try {
            // Assurer que les relations sont chargées pour le Mailable
            $candidature->loadMissing(['etudiant', 'offreStage.responsableRh']);
            $candidature->statut = $newStatus;
            $candidature->save();
            Log::info("Statut DemandeStage ID {$candidature->id} mis à jour à '{$newStatus}'.");

            if ($newStatus === 'acceptee') {
                if ($candidature->etudiant && !empty($candidature->etudiant->email) && $candidature->offreStage ) {
                    try { Mail::to($candidature->etudiant->email)->send(new CandidatureAccepteeMail($candidature)); Log::info("Email Acceptation envoyé."); }
                    catch (Exception $mailError) { Log::error("ERREUR EMAIL Acceptation ID {$candidature->id}: " . $mailError->getMessage()); }
                } else { Log::warning("Données manquantes pour email acceptation Demande ID {$candidature->id}."); }
            }
            return response()->json(['message' => 'Statut mis à jour.', 'candidature' => $candidature->fresh(['etudiant', 'offreStage.responsableRh'])]);
        } catch (Exception $e) { /* ... gestion erreur (ModelNotFound n'est pas nécessaire avec RMD strict) ... */ }
    }

    public function destroy(DemandeStage $candidature) // Utilise Route Model Binding
    {
        Log::info("CandidatureController@destroy DemandeStage ID: {$candidature->id}");
        try {
            $candidature->delete();
            return response()->json(['message' => 'Candidature retirée avec succès.'], 200);
        } catch (Exception $e) { /* ... gestion erreur ... */ }
    }

    public function indexAdmin(Request $request)
    {
        Log::info("CandidatureController@indexAdmin. Page: {$request->input('page', 1)}");
        try {
            $query = DemandeStage::with([
                'etudiant:id,nom,prenom,email,ville,telephone,cv,lettre_motivation,photo_profil', // Infos étudiant
                'offreStage:id,titre,responsable_rh_id', // Titre offre et ID du RH de l'offre
                'offreStage.responsableRh:id,nom_entreprise' // Nom entreprise via l'offre
            ])->orderBy('created_at', 'desc');
            $candidatures = $query->paginate($request->input('per_page', 15));
            return response()->json($candidatures);
        } catch (Exception $e) { /* ... gestion erreur ... */ }
    }
}