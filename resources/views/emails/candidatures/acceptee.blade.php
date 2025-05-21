
{{-- resources/views/emails/candidatures/acceptee.blade.php --}}
<x-mail::message>
# Bonne Nouvelle, {{ $nomEtudiant }} !

Félicitations ! Votre candidature pour l'offre de stage/alternance :
**"{{ $titreOffre }}"**
chez **{{ $nomEntreprise }}** a été **acceptée**.

L'entreprise prendra contact avec vous très prochainement pour discuter des prochaines étapes et des modalités (date de début, convention, etc.).

N'hésitez pas à préparer vos questions pour cet échange.

Encore toutes nos félicitations !

Cordialement,<br>
L'équipe de {{ config('app.name') }}

{{-- Bouton optionnel vers le tableau de bord (si pertinent) --}}
{{--
<x-mail::button :url="route('dashboard.etudiant')">
Accéder à mon tableau de bord
</x-mail::button>
--}}
</x-mail::message>
