<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;
use App\Models\Etudiant;
use App\Models\ResponsableRh;
use App\Models\Service;
use App\Models\Administrateur;
// Pas d'imports JWT dans cette version

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $type = $request->input('type_utilisateur');
        // Log initial pour voir ce qui arrive (sans le mot de passe)
        Log::info("Début inscription pour type: {$type}", $request->except(['mot_de_passe', 'mot_de_passe_confirmation']));

        // --- Inscription Etudiant ---
        if ($type === 'etudiant') {
            try {
                $validated = $request->validate([
                    'nom' => 'required|string|max:255',
                    'prenom' => 'required|string|max:255',
                    'email' => 'required|email|unique:etudiants,email',
                    'mot_de_passe' => 'required|string|min:8',
                    'ville' => 'required|string|max:255',
                    'telephone' => 'required|string|regex:/^[0-9]{10}$/|unique:etudiants,telephone',
                    'cv' => 'required|file|mimes:pdf|max:2048', // Max 2MB
                    'lettre_motivation' => 'required|file|mimes:doc,docx,pdf,odt|max:2048', // Max 2MB
                ]);

                $cv_path = $request->file('cv')->store('etudiants/cv', 'public');
                $lettre_path = $request->file('lettre_motivation')->store('etudiants/lettres', 'public');

                $etudiantData = Arr::except($validated, ['cv', 'lettre_motivation', 'mot_de_passe']);
                $etudiantData['mot_de_passe'] = Hash::make($validated['mot_de_passe']);
                $etudiantData['cv'] = $cv_path;
                $etudiantData['lettre_motivation'] = $lettre_path;

                Etudiant::create($etudiantData);
                Log::info("Étudiant enregistré avec succès: {$validated['email']}");
                return response()->json(['message' => 'Étudiant enregistré avec succès. Vous pouvez maintenant vous connecter.'], 201);

            } catch (ValidationException $e) {
                Log::warning("Validation inscription Étudiant échouée:", $e->errors());
                return response()->json(['errors' => $e->errors()], 422);
            } catch (\Exception $e) {
                 Log::error("Erreur serveur inscription Étudiant: " . $e->getMessage(), ['exception' => $e]);
                 return response()->json(['message' => 'Une erreur serveur est survenue lors de l\'enregistrement.'], 500);
            }
        }

        // --- Inscription Responsable ---
        if ($type === 'responsable') {
             $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'required|email|unique:responsable_r_h_s,email', // Table 'responsable_r_h_s'
                'mot_de_passe' => 'required|string|min:8',
                'ville' => 'required|string|max:255',
                'telephone' => 'required|string|regex:/^[0-9]{10}$/|unique:responsable_r_h_s,telephone', // Table 'responsable_r_h_s'
                'nom_entreprise' => 'required|string|max:255',
                'nombre_employes' => 'required|integer|min:0',
                'services' => 'nullable|array', // Services est optionnel, peut être un tableau vide
                'services.*' => 'integer|exists:services,id', // Valide chaque ID dans le tableau
                'photo_profil' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
            ]);

            if ($validator->fails()) {
                Log::warning("Validation inscription Responsable échouée:", $validator->errors()->toArray());
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Préparer les données pour le modèle ResponsableRh
            $validatedDataForUser = $validator->safe()->except(['services', 'mot_de_passe', 'photo_profil']);
            $validatedDataForUser['mot_de_passe'] = Hash::make($request->input('mot_de_passe'));

            if ($request->hasFile('photo_profil') && $request->file('photo_profil')->isValid()) {
                $photoPath = $request->file('photo_profil')->store('responsables/photos', 'public');
                $validatedDataForUser['photo_profil'] = $photoPath;
            }

            try {
                $responsable = ResponsableRh::create($validatedDataForUser);
                Log::info("Responsable RH ID {$responsable->id} ({$request->input('email')}) créé.");

                // Gérer l'attachement des services
                // $validator->validated() contient seulement les champs qui ont passé la validation.
                // Si 'services' n'a pas été envoyé ou était vide, il ne sera pas dans validated() si 'nullable' est utilisé
                // sans 'present'. Si on utilise 'present', il faut vérifier s'il est non null et un tableau.
                $serviceIdsToAttach = [];
                if ($request->has('services') && is_array($request->input('services'))) {
                    // Re-valider juste les services pour être sûr (ou faire confiance au validateur principal)
                    // Ici, on utilise les IDs qui ont déjà passé la règle 'exists:services,id'
                    $validatedPayload = $validator->validated(); // Récupérer toutes les données validées
                    if (isset($validatedPayload['services']) && is_array($validatedPayload['services'])) {
                         $serviceIdsToAttach = array_filter($validatedPayload['services'], fn($id) => is_numeric($id) && $id > 0);
                    }
                }


                if (!empty($serviceIdsToAttach)) {
                    $responsable->services()->attach($serviceIdsToAttach);
                    Log::info("Services (" . implode(', ', $serviceIdsToAttach) . ") attachés pour RH ID {$responsable->id}.");
                    $countAfterAttach = $responsable->services()->count();
                    Log::info("Nombre de services après attach pour RH ID {$responsable->id}: {$countAfterAttach}");
                } else {
                    Log::info("Aucun service valide à attacher pour RH ID {$responsable->id}. Services reçus: ", $request->input('services', []));
                }

                return response()->json(['message' => 'Responsable RH enregistré avec succès. Vous pouvez maintenant vous connecter.'], 201);

            } catch (\Exception $e) {
                 Log::error("Erreur serveur inscription Responsable: " . $e->getMessage() . "\n" . $e->getTraceAsString());
                 // Optionnel: Supprimer le responsable si créé mais échec attachement services
                 // if (isset($responsable) && $responsable->exists) { $responsable->delete(); }
                 return response()->json(['message' => 'Une erreur serveur est survenue lors de l\'enregistrement.'], 500);
            }
        }

        return response()->json(['error' => 'Type utilisateur invalide ou manquant.'], 400);
    }

    // --- Méthode Login (SANS JWT) ---
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'mot_de_passe' => 'required',
            'type_utilisateur' => 'required|string|in:Administrateur,etudiant,responsable',
        ]);

        $type = $credentials['type_utilisateur'];
        $user = null;
        $model = null;

        switch ($type) {
            case 'Administrateur': $model = Administrateur::class; break;
            case 'etudiant': $model = Etudiant::class; break;
            case 'responsable': $model = ResponsableRh::class; break;
            default: return response()->json(['message' => 'Type utilisateur invalide.'], 400);
        }

        try {
            $user = $model::where('email', $credentials['email'])->first();

            if (!$user || !Hash::check($credentials['mot_de_passe'], $user->mot_de_passe)) {
                return response()->json(['message' => 'Identifiants invalides.'], 401);
            }

            // Connexion réussie
            if ($type === 'responsable' && method_exists($user, 'services')) {
                $user->loadMissing('services:id,nom_service'); // Charger les services pour le dashboard
            }

            return response()->json([
                'message' => 'Connexion vérifiée (' . $type . ')',
                'user' => $user, // Renvoyer l'objet utilisateur complet
                'type' => $type,
            ], 200);

        } catch (\Exception $e) {
            Log::error("Erreur de connexion: " . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Une erreur est survenue lors de la connexion.'], 500);
        }
    }

    // --- Méthode getServices (Inchangée) ---
    public function getServices()
    {
        try {
             $services = Service::orderBy('nom_service', 'asc')->get(['id', 'nom_service']);
            return response()->json($services);
        } catch (\Exception $e) {
             Log::error("Erreur chargement services: " . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Erreur lors du chargement des services.'], 500);
        }
    }
}