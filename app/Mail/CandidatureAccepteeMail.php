<?php
// app/Mail/CandidatureAccepteeMail.php

namespace App\Mail;

use App\Models\DemandeStage; // Utiliser le modèle correct
use App\Models\Etudiant;
use App\Models\Offre;       // Utiliser le modèle Offre (pour offre_stages)
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Support\Facades\Log; // <-- AJOUTER CET IMPORT

class CandidatureAccepteeMail extends Mailable // implements ShouldQueue
{
    use Queueable, SerializesModels;

    public DemandeStage $demande; // Propriété pour stocker la demande

    /**
     * Create a new message instance.
     */
    public function __construct(DemandeStage $demandeStageInstance) // Nom de paramètre clair
    {
        // Charger les relations si elles ne le sont pas déjà pour éviter N+1
        $this->demande = $demandeStageInstance->loadMissing([
            'etudiant',
            'offreStage.responsableRh' // Assurez-vous que Offre a la relation responsableRh()
        ]);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        // Vérifier si l'étudiant et son email existent avant d'essayer d'envoyer
        if (!$this->demande->etudiant || !$this->demande->etudiant->email) {
            Log::error("Mailable CandidatureAccepteeMail: Données étudiant ou email manquantes pour la demande ID {$this->demande->id}. Email non envoyé.");
            // Pour éviter une erreur fatale, on pourrait retourner une enveloppe "vide" ou ne rien faire,
            // mais il est préférable de s'assurer que les données sont valides avant d'instancier le Mailable.
            // Ici, on va quand même essayer de construire une enveloppe minimale pour que le reste ne plante pas.
            return new Envelope(
                from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@votreplateforme.com'), env('MAIL_FROM_NAME', 'Votre Plateforme')),
                subject: 'Information Importante Concernant Votre Candidature',
            );
        }

        return new Envelope(
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@votreplateforme.com'), env('MAIL_FROM_NAME', 'Votre Plateforme')),
            to: [
                new Address($this->demande->etudiant->email, $this->demande->etudiant->prenom . ' ' . $this->demande->etudiant->nom)
            ],
            subject: 'Bonne nouvelle concernant votre candidature !',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // Vérifier les relations avant de les utiliser
        if (!$this->demande->etudiant || !$this->demande->offreStage) {
            Log::error("Mailable CandidatureAccepteeMail: Relations 'etudiant' ou 'offreStage' manquantes pour la demande ID {$this->demande->id}. Contenu de l'email pourrait être incomplet.");
            // Fournir des valeurs par défaut pour éviter les erreurs dans la vue si les données sont incomplètes
            $nomEtudiant = 'Étudiant(e)';
            $titreOffre = 'une offre';
            $nomEntreprise = 'l\'entreprise';
        } else {
            $nomEtudiant = $this->demande->etudiant->prenom ?? 'Étudiant(e)';
            $titreOffre = $this->demande->offreStage->titre ?? 'une offre';
            $nomEntreprise = $this->demande->offreStage->responsableRh ? $this->demande->offreStage->responsableRh->nom_entreprise : 'l\'entreprise';
        }


        return new Content(
            markdown: 'emails.candidatures.acceptee', // Vue Blade
            with: [
                'nomEtudiant' => $nomEtudiant,
                'titreOffre' => $titreOffre,
                'nomEntreprise' => $nomEntreprise,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}