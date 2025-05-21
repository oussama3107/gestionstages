<?php

namespace App\Http\Controllers;

use App\Models\Etudiant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\Rule;
use Exception;

// ATTENTION : TOUTES LES MÉTHODES DE CE CONTRÔLEUR SONT MAINTENANT PUBLIQUES

class EtudiantController extends Controller
{
    /** Afficher tous les étudiants (PUBLIC). */
    public function index(Request $request)
    {
        Log::info('Accès PUBLIC à EtudiantController@index');
        try {
            $etudiants = Etudiant::orderBy('nom', 'asc')->get();
            return response()->json($etudiants);
        } catch (Exception $e) {
            Log::error("Erreur récupération liste Etudiant: " . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des étudiants.'], 500);
        }
    }

    /** Afficher les infos d'un étudiant spécifique (PUBLIC). */
    public function show(Request $request, Etudiant $etudiant)
    {
        Log::info("Accès PUBLIC à EtudiantController@show ID {$etudiant->id}");
        try {
            return response()->json($etudiant);
        } catch (Exception $e) {
            Log::error("Erreur affichage Etudiant ID {$etudiant->id}: " . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur lors de la récupération du profil.'], 500);
        }
    }

    /** Mettre à jour les infos d'un étudiant spécifique (PUBLIC). */
    public function update(Request $request, Etudiant $etudiant)
    {
        Log::info("Tentative mise à jour PUBLIQUE Etudiant ID: {$etudiant->id}");
        Log::info("Données reçues:", $request->except(['mot_de_passe', 'cv', 'lettre_motivation', 'photo_profil']));

        // La logique de validation et de mise à jour reste, mais sans contrôle d'accès
        $validator = Validator::make($request->all(), [
            'nom'             => 'sometimes|string|max:255',
            'prenom'          => 'sometimes|string|max:255',
            'email'           => ['sometimes','email', Rule::unique('etudiants', 'email')->ignore($etudiant->id)],
            'mot_de_passe'    => 'nullable|string|min:8',
            'telephone'       => ['sometimes','string','regex:/^[0-9]{10}$/', Rule::unique('etudiants', 'telephone')->ignore($etudiant->id)],
            'ville'           => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validatedData = $validator->safe()->except(['mot_de_passe', 'cv', 'lettre_motivation', 'photo_profil']);

        try {
            $filesToDeleteOnError = [];

            if ($request->hasFile('cv')) {
                 $cvValidator = Validator::make($request->only('cv'), ['cv' => 'required|file|mimes:pdf|max:2048']);
                 if ($cvValidator->fails()) return response()->json(['errors' => $cvValidator->errors()], 422);
                 if ($etudiant->cv && Storage::disk('public')->exists($etudiant->cv)) { Storage::disk('public')->delete($etudiant->cv); }
                 $path = $request->file('cv')->store('cv', 'public');
                 $validatedData['cv'] = $path;
                 $filesToDeleteOnError[] = $path;
            }

            if ($request->hasFile('lettre_motivation')) {
                 $lettreValidator = Validator::make($request->only('lettre_motivation'), ['lettre_motivation' => 'required|file|mimes:doc,docx,pdf,odt|max:2048']);
                  if ($lettreValidator->fails()) { foreach($filesToDeleteOnError as $file) { if(Storage::disk('public')->exists($file)) Storage::disk('public')->delete($file); } return response()->json(['errors' => $lettreValidator->errors()], 422); }
                 if ($etudiant->lettre_motivation && Storage::disk('public')->exists($etudiant->lettre_motivation)) { Storage::disk('public')->delete($etudiant->lettre_motivation); }
                 $path = $request->file('lettre_motivation')->store('lettres', 'public');
                 $validatedData['lettre_motivation'] = $path;
                 $filesToDeleteOnError[] = $path;
            }

            if ($request->hasFile('photo_profil')) {
                  $photoValidator = Validator::make($request->only('photo_profil'), ['photo_profil' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048']);
                  if ($photoValidator->fails()) { foreach($filesToDeleteOnError as $file) { if(Storage::disk('public')->exists($file)) Storage::disk('public')->delete($file); } return response()->json(['errors' => $photoValidator->errors()], 422); }
                 if ($etudiant->photo_profil && Storage::disk('public')->exists($etudiant->photo_profil)) { Storage::disk('public')->delete($etudiant->photo_profil); }
                 $path = $request->file('photo_profil')->store('photos/etudiants', 'public');
                 $validatedData['photo_profil'] = $path;
            }

            if ($request->filled('mot_de_passe')) {
                $validatedData['mot_de_passe'] = Hash::make($request->input('mot_de_passe'));
            }

            $etudiant->update($validatedData);
            $updatedEtudiant = $etudiant->fresh();
            return response()->json([
                'message' => 'Profil mis à jour avec succès.',
                'user' => $updatedEtudiant
            ], 200);

        } catch (Exception $e) {
             Log::error("Erreur mise à jour Etudiant ID {$etudiant->id}: " . $e->getMessage() . "\n" . $e->getTraceAsString());
              if(!empty($filesToDeleteOnError)) {
                   Log::error("Nettoyage des fichiers après erreur pour Etudiant ID {$etudiant->id}: " . implode(', ', $filesToDeleteOnError));
                   foreach($filesToDeleteOnError as $file) { if (Storage::disk('public')->exists($file)) { Storage::disk('public')->delete($file); } }
              }
            return response()->json(['message' => 'Erreur interne du serveur lors de la mise à jour.'], 500);
        }
    }

     /** Supprimer la ressource spécifiée (PUBLIC). */
     public function destroy(Request $request, Etudiant $etudiant)
     {
         Log::info("Tentative suppression PUBLIQUE Etudiant ID: {$etudiant->id}");

         try {
             if ($etudiant->cv && Storage::disk('public')->exists($etudiant->cv)) { Storage::disk('public')->delete($etudiant->cv); }
             if ($etudiant->lettre_motivation && Storage::disk('public')->exists($etudiant->lettre_motivation)) { Storage::disk('public')->delete($etudiant->lettre_motivation); }
             if ($etudiant->photo_profil && Storage::disk('public')->exists($etudiant->photo_profil)) { Storage::disk('public')->delete($etudiant->photo_profil); }

             $etudiant->delete();
             return response()->json(['message' => 'Étudiant supprimé avec succès.'], 200);
         } catch (Exception $e) {
             Log::error("Erreur suppression Etudiant ID {$etudiant->id}: " . $e->getMessage() . "\n" . $e->getTraceAsString());
             return response()->json(['message' => 'Erreur interne du serveur lors de la suppression.'], 500);
         }
     }
}