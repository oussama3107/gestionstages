<?php

namespace App\Http\Controllers;

use App\Models\Offre;
use App\Models\Service;       // Ensure this model exists and is correct
use App\Models\ResponsableRh; // Ensure this model exists and is correct
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth; // For checking authenticated user
use Carbon\Carbon; // For date comparisons

class OffreController extends Controller
{
    /**
     * Display a listing of the resource.
     * This method needs to differentiate between an admin view and other views.
     */
    public function index(Request $request)
    {
        Log::info('OffreController@index - Request received:', $request->all());

        try {
            $query = Offre::with([
                'service:id,nom_service',
                'responsableRh:id,nom,prenom,email,nom_entreprise' // Eager load more RH details
            ]);

            // Check if this is an admin request (e.g., via a query param or authenticated user role)
            // The React admin component sends `params: { admin_view: true }` as an example
            $isAdminView = $request->query('admin_view') === 'true'; // Example check
            // A better check would be based on the authenticated user's role if using Sanctum/Passport
            // $isAdminView = Auth::check() && Auth::user()->isAdmin(); // Example with a hypothetical isAdmin() method

            if ($isAdminView) {
                Log::info('OffreController@index - Admin view detected.');
                // Admins typically see all offers, filters might be different or applied on frontend
                // Or you can add admin-specific filters here if needed
                if ($request->has('statut')) {
                    $query->where('statut', $request->input('statut'));
                }
                // Add other admin-specific filters if any (e.g., filter by company for admin)
            } else {
                // --- Default/Public/RH Filters ---
                // For public view, typically only 'publiee' and not expired
                // If no specific statut filter is applied by public/RH, default to published & not expired
                if (!$request->has('statut') && !$request->has('responsable_id')) {
                    $query->where('statut', 'publiee')
                          ->where(function ($q) {
                              $q->whereNull('date_expiration')
                                ->orWhere('date_expiration', '>=', Carbon::today()->startOfDay());
                          });
                } elseif ($request->has('statut')) {
                    $query->where('statut', $request->input('statut'));
                }

                // Filter by responsible_rh_id if provided (for RH viewing their own offers)
                if ($request->has('responsable_id')) {
                    $query->where('responsable_rh_id', $request->input('responsable_id'));
                }
            }

            // Common filters applicable to both admin and non-admin views (or adjust as needed)
            if ($request->has('q')) {
                $keyword = $request->input('q');
                $query->where(function ($q_search) use ($keyword) {
                    $q_search->where('titre', 'LIKE', "%{$keyword}%")
                             ->orWhere('description', 'LIKE', "%{$keyword}%")
                             ->orWhere('departement', 'LIKE', "%{$keyword}%")
                             ->orWhere('ville', 'LIKE', "%{$keyword}%")
                             ->orWhereHas('responsableRh', function ($rhQuery) use ($keyword) {
                                 $rhQuery->where('nom_entreprise', 'LIKE', "%{$keyword}%");
                             })
                             ->orWhereHas('service', function ($serviceQuery) use ($keyword) {
                                 $serviceQuery->where('nom_service', 'LIKE', "%{$keyword}%");
                             });
                });
            }

            if ($request->has('villes')) {
                $villesArray = array_filter(array_map('trim', explode(',', $request->input('villes'))));
                if (count($villesArray) > 0) {
                    $query->whereIn('ville', $villesArray);
                }
            }

            // Order and get/paginate
            // For Admin, pagination might be useful if there are many offers.
            // The React Admin component uses client-side pagination but could switch to server-side.
            if ($isAdminView || $request->expectsJson()) { // Assuming API requests might want pagination
                $offres = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 15));
            } else {
                $offres = $query->orderBy('created_at', 'desc')->get();
            }

            return response()->json($offres);

        } catch (Exception $e) {
            Log::error("OffreController@index: Erreur récupération offres: " . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Erreur lors de la récupération des offres.'], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('OffreController@store - Data received:', $request->all());

        // TODO: Authorization: Check if the authenticated user is allowed to create offers
        // For example, only a ResponsableRh or an Admin can create offers.
        // if (Auth::check() && !Auth::user()->can('create', Offre::class)) {
        //     return response()->json(['message' => 'Non autorisé à créer une offre.'], 403);
        // }

        $validator = Validator::make($request->all(), [
            'titre'             => 'required|string|max:255',
            'description'       => 'required|string|min:20',
            'ville'             => 'required|string|max:100',
            'departement'       => 'nullable|string|max:100',
            'duree'             => 'required|integer|min:1',
            'unite_duree'       => ['required', 'string', Rule::in(['mois', 'semaines', 'jours'])], // Added
            'nombre_places'     => 'required|integer|min:1',
            'service_id'        => 'required|integer|exists:services,id',
            // responsable_rh_id should usually be the ID of the authenticated RH user,
            // or set by an Admin if an Admin is creating on behalf of an RH.
            'responsable_rh_id' => 'required|integer|exists:responsable_r_h_s,id',
            'date_debut'        => 'nullable|date_format:Y-m-d|after_or_equal:today', // Added
            'date_expiration'   => 'nullable|date_format:Y-m-d|after_or_equal:date_debut', // Added
            'statut'            => ['required', 'string', Rule::in(['brouillon', 'en_attente', 'publiee'])],
                                    // 'refusee', 'archivee' are typically set by Admin or later by RH.
        ]);

        if ($validator->fails()) {
            Log::warning('OffreController@store: Validation création offre échouée:', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $dataToCreate = $validator->validated();

            // If responsable_rh_id should always be the authenticated user (if RH)
            // if (Auth::check() && Auth::user()->isResponsableRh()) { // Example: isResponsableRh() method on User model
            //    $dataToCreate['responsable_rh_id'] = Auth::id();
            // }

            $offre = Offre::create($dataToCreate);
            // Load relations for the response
            $offre->load(['service:id,nom_service', 'responsableRh:id,nom,prenom,nom_entreprise']);

            Log::info("OffreController@store: Offre ID {$offre->id} créée avec succès.");
            return response()->json(['message' => 'Offre créée avec succès et soumise pour approbation si applicable.', 'offre' => $offre], 201);

        } catch (Exception $e) {
            Log::error("OffreController@store: Erreur lors de la création de l'offre.", [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            return response()->json(['message' => 'Une erreur est survenue lors de la création de l\'offre.'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        Log::info("OffreController@show: Demande pour Offre ID {$id}");
        try {
            $offre = Offre::with([
                'service:id,nom_service',
                'responsableRh:id,nom,prenom,email,telephone,nom_entreprise', // Load comprehensive RH info
                'demandesStagesCount' // Example: if you have a count relationship
            ])->findOrFail($id);

            // TODO: Authorization: Can the current user view this offer?
            // (e.g., public can only view 'publiee' offers, RH can view their own drafts)
            // if (!$offre->canBeViewedBy(Auth::user())) {
            //     return response()->json(['message' => 'Offre non trouvée ou accès non autorisé.'], 404);
            // }

            return response()->json($offre);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Offre non trouvée.'], 404);
        } catch (Exception $e) {
            Log::error("OffreController@show: Erreur affichage offre ID {$id}: " . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Erreur lors de la récupération de l\'offre.'], 500);
        }
    }


    /**
     * Update the specified resource in storage.
     * Associated with PUT/PATCH HTTP methods.
     */
    public function update(Request $request, $id)
    {
        Log::info("OffreController@update: Tentative de MAJ pour Offre ID {$id}. Data:", $request->all());

        try {
            $offre = Offre::findOrFail($id);

            // TODO: Authorization: Check if the authenticated user can update this offer
            // (e.g., only the creating RH or an Admin)
            // if (Auth::check() && Auth::user()->cannot('update', $offre)) {
            //    return response()->json(['message' => 'Action non autorisée.'], 403);
            // }

            // Define rules for fields that can be updated.
            // 'sometimes' means the field is only validated if present in the request.
            $validator = Validator::make($request->all(), [
                'titre'             => 'sometimes|required|string|max:255',
                'description'       => 'sometimes|required|string|min:20',
                'ville'             => 'sometimes|required|string|max:100',
                'departement'       => 'sometimes|nullable|string|max:100',
                'duree'             => 'sometimes|required|integer|min:1',
                'unite_duree'       => ['sometimes', 'required', 'string', Rule::in(['mois', 'semaines', 'jours'])], // Added
                'nombre_places'     => 'sometimes|required|integer|min:1',
                'service_id'        => 'sometimes|required|integer|exists:services,id',
                'date_debut'        => 'sometimes|nullable|date_format:Y-m-d|after_or_equal:today', // Added
                'date_expiration'   => 'sometimes|nullable|date_format:Y-m-d|after_or_equal:date_debut', // Added
                'statut'            => ['sometimes', 'required', 'string', Rule::in(['brouillon', 'en_attente', 'publiee', 'refusee', 'archivee', 'expirée'])],
                // 'responsable_rh_id' is typically not changed after creation, unless by a super-admin.
                // If it can be changed by an admin:
                // 'responsable_rh_id' => 'sometimes|required|integer|exists:responsable_r_h_s,id',
            ]);

            if ($validator->fails()) {
                Log::warning("OffreController@update: Validation MAJ offre ID {$id} échouée:", $validator->errors()->toArray());
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $dataToUpdate = $validator->validated();

            // Prevent changing responsable_rh_id unless by specific role (example)
            // if (isset($dataToUpdate['responsable_rh_id']) && Auth::check() && !Auth::user()->isAdmin()) {
            //    unset($dataToUpdate['responsable_rh_id']); // Remove if not allowed to change
            //    Log::warning("OffreController@update: Tentative de modification de responsable_rh_id non autorisée pour Offre ID {$id}.");
            // }

            $offre->update($dataToUpdate);
            // Load relations for the response
            $offre->load(['service:id,nom_service', 'responsableRh:id,nom,prenom,nom_entreprise']);

            Log::info("OffreController@update: Offre ID {$offre->id} mise à jour avec succès.");
            return response()->json(['message' => 'Offre mise à jour avec succès.', 'offre' => $offre], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Offre non trouvée pour la mise à jour.'], 404);
        } catch (Exception $e) {
            Log::error("OffreController@update: Erreur lors de la MAJ de l'offre ID {$id}.", [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            return response()->json(['message' => 'Une erreur est survenue lors de la mise à jour de l\'offre.'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        Log::info("OffreController@destroy: Tentative de suppression pour Offre ID {$id}");
        try {
            $offre = Offre::findOrFail($id);

            // TODO: Authorization: Check if the authenticated user can delete this offer
            // if (Auth::check() && Auth::user()->cannot('delete', $offre)) {
            //    return response()->json(['message' => 'Action non autorisée.'], 403);
            // }

            // The 'onDelete('cascade')' or 'onDelete('set null')' for 'stage_id' in 'demande_stages' table
            // should handle related applications automatically as defined in your migration.
            // If you need to perform other actions before deletion (e.g., notify applicants), do it here.
            // Example: if ($offre->demandesStages()->where('statut', '!=', 'refusee')->exists()) {
            //     return response()->json(['message' => 'Impossible de supprimer une offre avec des candidatures actives. Veuillez d'abord les traiter.'], 400);
            // }

            $offre->delete();
            Log::info("OffreController@destroy: Offre ID {$id} supprimée avec succès.");
            return response()->json(['message' => 'Offre supprimée avec succès.'], 200); // Or 204 No Content

        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Offre non trouvée pour la suppression.'], 404);
        }
        // Catch specific database errors, e.g., foreign key constraint violation if not handled by cascade
        // catch (\Illuminate\Database\QueryException $qe) {
        //     Log::error("OffreController@destroy: Erreur DB suppression Offre ID {$id}.", ['exception' => $qe]);
        //     return response()->json(['message' => "Erreur de base de données: Impossible de supprimer l'offre, elle est peut-être référencée ailleurs."], 500);
        // }
        catch (Exception $e) {
            Log::error("OffreController@destroy: Erreur lors de la suppression de l'offre ID {$id}.", ['exception' => $e]);
            return response()->json(['message' => "Erreur lors de la suppression de l'offre."], 500);
        }
    }
}