<?php 

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ResponsableRhController;
use App\Http\Controllers\EtudiantController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\OffreController;
use App\Http\Controllers\CandidatureController;


Route::get('/offres/{id}', [OffreController::class, 'show']);
Route::post('/offres/{offre}', [OffreController::class, 'update'])->name('offres.update');
Route::post('/responsables/{responsable}', [ResponsableRhController::class, 'update'])->name('responsables.update');
Route::delete('/responsables/{responsable}', [ResponsableRhController::class, 'destroy'])->name('responsables.destroy');
Route::get('/responsable/candidatures', [CandidatureController::class, 'indexResponsable'])->name('candidatures.index.responsable');
Route::post('/etudiants/{etudiant}', [EtudiantController::class, 'update'])->name('etudiants.update');
Route::delete('/etudiants/{etudiant}', [EtudiantController::class, 'destroy'])->name('etudiants.destroy');
Route::get('/etudiant/candidatures', [CandidatureController::class, 'indexEtudiant'])->name('candidatures.index.etudiant');
Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::get('/services', [ServiceController::class, 'index'])->name('api.services.index');
Route::get('/offres', [OffreController::class, 'index'])->name('api.offres.index');
Route::get('/offres/{offre}', [OffreController::class, 'show'])->name('api.offres.show');
Route::post('/offres', [OffreController::class, 'store'])->name('api.offres.store');
Route::put('/offres/{offre}', [OffreController::class, 'update'])->name('api.offres.update'); // For PUT requests
Route::delete('/offres/{offre}', [OffreController::class, 'destroy'])->name('api.offres.destroy');
Route::get('/responsables', [ResponsableRhController::class, 'index'])->name('responsables.index'); // For ListeEntreprises.js
Route::get('/responsables/{responsable}', [ResponsableRhController::class, 'show'])->name('api.responsables.show');
Route::get('/etudiants/{etudiant}', [EtudiantController::class, 'show'])->name('api.etudiants.show');
Route::post('/candidatures', [CandidatureController::class, 'store'])->name('api.candidatures.store');
Route::get('/candidatures/etudiant', [CandidatureController::class, 'indexEtudiant'])->name('api.candidatures.indexEtudiant');
Route::get('/candidatures/responsable', [CandidatureController::class, 'indexResponsable'])->name('api.candidatures.indexResponsable');
Route::patch('/candidatures/{candidature}/status', [CandidatureController::class, 'updateStatus'])->name('api.candidatures.updateStatus');
Route::delete('/candidatures/{candidature}', [CandidatureController::class, 'destroy'])->name('api.candidatures.destroy');
Route::get('/admin/candidatures', [CandidatureController::class, 'indexAdmin'])->name('api.admin.candidatures.index');
Route::get('/admin/etudiants', [EtudiantController::class, 'index'])->name('api.admin.etudiants.index'); // Assumes EtudiantController has an index method for admins
Route::get('/admin/responsables', [ResponsableRhController::class, 'index'])->name('api.admin.responsables.index'); 
// This was already defined, reusing is fine if logic is same
Route::get('/admin/candidatures', [CandidatureController::class, 'indexAdmin'])->name('admin.candidatures.indexAdmin');
Route::fallback(function(){
    return response()->json(['message' => 'Route API non trouvée ou méthode non supportée pour cette route.'], 404);
})->name('api.fallback');
