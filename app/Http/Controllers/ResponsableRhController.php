<?php

namespace App\Http\Controllers;

use App\Models\ResponsableRh;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\Rule;
use Illuminate\Support\Arr;
use Exception;
use Illuminate\Support\Facades\DB; // Importer pour les transactions

// ATTENTION : TOUTES LES MÉTHODES SONT PUBLIQUES DANS CET EXEMPLE
class ResponsableRhController extends Controller
{
    /** Display a listing of the resource (PUBLIC). */
    public function index(Request $request)
    {
        Log::info('Accès PUBLIC à ResponsableRhController@index');
        try {
            // Charger les responsables avec leurs services (seulement ID et nom du service)
            $responsables = ResponsableRh::with('services:id,nom_service')->orderBy('nom', 'asc')->get();
            return response()->json($responsables);
        } catch (Exception $e) {
            Log::error("Erreur récupération liste ResponsableRh: " . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Erreur lors de la récupération des responsables.'], 500);
        }
    }

    /** Display the specified resource (PUBLIC). */
    public function show(Request $request, ResponsableRh $responsable) // Utilise Route Model Binding
    {
        Log::info("Accès PUBLIC à ResponsableRhController@show ID {$responsable->id}");
        try {
            // Charger tous les champs des services associés
            $responsable->loadMissing('services');
            Log::debug("Données ResponsableRh (ID: {$responsable->id}) avant retour JSON:", $responsable->toArray());
            return response()->json($responsable);
        }
        catch (Exception $e) {
            Log::error("Erreur affichage ResponsableRh ID {$responsable->id}: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['message' => 'Erreur serveur lors de la récupération du profil.'], 500);
        }
    }

    /** Update the specified resource in storage (PUBLIC). */
    public function update(Request $request, ResponsableRh $responsable)
    {
        $responsableId = $responsable->id;
        Log::info("--- DÉBUT UPDATE ResponsableRh ID: {$responsableId} ---");
        Log::info("Données brutes de la requête:", $request->except('mot_de_passe')); // Ne pas logger le mdp en clair
        if ($request->hasFile('photo_profil')) { Log::info("Fichier 'photo_profil' présent."); }

        $rules = [
            'nom'             => 'sometimes|string|max:255',
            'prenom'          => 'sometimes|string|max:255',
            'email'           => ['sometimes','required','email', Rule::unique('responsable_r_h_s', 'email')->ignore($responsableId)],
            'mot_de_passe'    => 'nullable|string|min:8|max:255',
            'telephone'       => ['sometimes','required','string','regex:/^[0-9]{10}$/', Rule::unique('responsable_r_h_s', 'telephone')->ignore($responsableId)],
            'ville'           => 'sometimes|required|string|max:255',
            'nom_entreprise'  => 'sometimes|required|string|max:255',
            'nombre_employes' => 'sometimes|required|integer|min:0',
            'photo_profil'    => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'services'        => 'nullable', // La validation array se fera implicitement si services.* est présent
            'services.*'      => 'integer|exists:services,id'
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            Log::warning("VALIDATION ÉCHOUÉE pour RH ID {$responsableId}:", $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }
        Log::info("Validation de base passée pour RH ID {$responsableId}.");

        $validatedFieldsOverall = $validator->validated();
        Log::info("Champs validés globalement:", Arr::except($validatedFieldsOverall, ['mot_de_passe']));

        $dataToUpdateResponsable = Arr::except($validatedFieldsOverall, ['mot_de_passe', 'photo_profil', 'services']);

        DB::beginTransaction();
        try {
            if ($request->hasFile('photo_profil')) {
                Log::info("Traitement photo pour RH ID {$responsableId}.");
                if ($responsable->photo_profil && Storage::disk('public')->exists($responsable->photo_profil)) {
                    Storage::disk('public')->delete($responsable->photo_profil);
                }
                $photoPath = $request->file('photo_profil')->store('photos/responsables', 'public');
                $dataToUpdateResponsable['photo_profil'] = $photoPath;
                Log::info("Nouvelle photo: {$photoPath}");
            }

            if ($request->filled('mot_de_passe')) {
                $dataToUpdateResponsable['mot_de_passe'] = Hash::make($request->input('mot_de_passe'));
                Log::info("Mot de passe mis à jour pour RH ID {$responsableId}.");
            }

            $responsable->update($dataToUpdateResponsable);
            Log::info("Champs principaux du RH ID {$responsableId} mis à jour.");

            if ($request->has('services') || $request->exists('services')) {
                 $serviceIdsInput = $request->input('services');
                 Log::info("Traitement des services. Valeur brute reçue:", is_array($serviceIdsInput) ? $serviceIdsInput : [$serviceIdsInput]);

                 $serviceIdsToSync = [];
                 if (is_array($serviceIdsInput)) {
                     // Si 'services' est un tableau (ex: services[]=1&services[]=2)
                     // $validatedFieldsOverall['services'] devrait le contenir s'il a passé la validation
                     if (isset($validatedFieldsOverall['services']) && is_array($validatedFieldsOverall['services'])) {
                        $serviceIdsToSync = array_filter($validatedFieldsOverall['services'], 'is_numeric');
                        $serviceIdsToSync = array_map('intval', $serviceIdsToSync);
                     } else {
                         Log::info("La clé 'services' est un tableau mais vide après validation ou non validée (services.*). Sync avec [].");
                         $serviceIdsToSync = [];
                     }
                 } elseif ($serviceIdsInput === '' || $serviceIdsInput === null) {
                     // Si React envoie services='' pour un tableau vide
                     $serviceIdsToSync = [];
                     Log::info("La clé 'services' est vide/null, sync avec [].");
                 }

                 Log::info("IDs de service à synchroniser:", $serviceIdsToSync);
                 $responsable->services()->sync($serviceIdsToSync);
                 Log::info("services()->sync() appelée pour RH ID {$responsableId}.");
            } else {
                 Log::info("Aucune clé 'services' envoyée. Relations services inchangées pour RH ID {$responsableId}.");
            }

            DB::commit();
            $updatedResponsable = $responsable->fresh()->load('services'); // Recharger avec relations à jour
            Log::info("--- FIN UPDATE (Succès) RH ID: {$responsableId}. Services après: " . $updatedResponsable->services->pluck('id')->implode(','));
            return response()->json(['message' => 'Profil mis à jour avec succès.', 'user' => $updatedResponsable], 200);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("--- ERREUR UPDATE RH ID {$responsableId} ---: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['message' => 'Erreur interne du serveur lors de la mise à jour.'], 500);
        }
    }

     /** Delete the specified resource (PUBLIC). */
     public function destroy(Request $request, ResponsableRh $responsable)
     {
         Log::info("Tentative suppression PUBLIQUE ResponsableRh ID: {$responsable->id}");
         DB::beginTransaction();
         try {
             if ($responsable->photo_profil && Storage::disk('public')->exists($responsable->photo_profil)) {
                 Storage::disk('public')->delete($responsable->photo_profil);
             }
             $responsable->services()->detach(); // Détacher avant de supprimer
             $responsable->delete();
             DB::commit();
             return response()->json(['message' => 'Responsable supprimé avec succès.'], 200);
         } catch (Exception $e) {
             DB::rollBack();
             Log::error("Erreur suppression ResponsableRh ID {$responsable->id}: " . $e->getMessage(), ['exception' => $e]);
             return response()->json(['message' => 'Erreur interne serveur lors de la suppression.'], 500);
         }
     }
}