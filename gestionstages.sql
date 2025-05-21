-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 18 mai 2025 à 18:43
-- Version du serveur : 10.4.27-MariaDB
-- Version de PHP : 8.1.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `gestionstages`
--

-- --------------------------------------------------------

--
-- Structure de la table `administrateurs`
--

CREATE TABLE `administrateurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `administrateurs`
--

INSERT INTO `administrateurs` (`id`, `nom`, `email`, `mot_de_passe`, `created_at`, `updated_at`) VALUES
(1, 'fadoua atmani', 'fadouaatmani@gmail.com', '$2y$12$Poeh.F/jKfM6N.sw0duAA.DnNbnxdvufbn9Bt.UbSJYjCd22yAIEi', '2025-05-16 00:29:36', '2025-05-16 00:29:36');

-- --------------------------------------------------------

--
-- Structure de la table `demande_stages`
--

CREATE TABLE `demande_stages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `etudiant_id` bigint(20) UNSIGNED NOT NULL,
  `stage_id` bigint(20) UNSIGNED NOT NULL,
  `cv` varchar(255) NOT NULL,
  `lettre_de_motivation` varchar(255) NOT NULL,
  `statut` varchar(255) NOT NULL DEFAULT 'en attente',
  `date_candidature` date NOT NULL,
  `responsable_rh_id` bigint(20) UNSIGNED DEFAULT NULL,
  `message_motivation` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `demande_stages`
--

INSERT INTO `demande_stages` (`id`, `etudiant_id`, `stage_id`, `cv`, `lettre_de_motivation`, `statut`, `date_candidature`, `responsable_rh_id`, `message_motivation`, `created_at`, `updated_at`) VALUES
(1, 1, 4, 'etudiants/cv/qPUvsOg8yOrALB2sLw5Zw1vxKEsZSIeR2n2M7UzX.pdf', 'etudiants/lettres/huv4I00Tn7lJd1cLYXI8wMtJFjJpFq9OCHW0mOXJ.docx', 'acceptee', '2025-05-16', 1, 'sajsnjksdnk', '2025-05-16 19:12:18', '2025-05-16 19:28:13'),
(2, 1, 3, 'etudiants/cv/qPUvsOg8yOrALB2sLw5Zw1vxKEsZSIeR2n2M7UzX.pdf', 'etudiants/lettres/huv4I00Tn7lJd1cLYXI8wMtJFjJpFq9OCHW0mOXJ.docx', 'refusee', '2025-05-17', 1, NULL, '2025-05-17 00:40:10', '2025-05-18 14:09:40');

-- --------------------------------------------------------

--
-- Structure de la table `etudiants`
--

CREATE TABLE `etudiants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `ville` varchar(255) NOT NULL,
  `telephone` varchar(255) NOT NULL,
  `cv` varchar(255) DEFAULT NULL,
  `lettre_motivation` varchar(255) DEFAULT NULL,
  `photo_profil` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `etudiants`
--

INSERT INTO `etudiants` (`id`, `nom`, `prenom`, `email`, `mot_de_passe`, `ville`, `telephone`, `cv`, `lettre_motivation`, `photo_profil`, `created_at`, `updated_at`) VALUES
(1, 'mazyan', 'oussama', 'oussamamz3107@gmail.com', '$2y$12$SJWMFnuRMqsT7Bk6wWN48.Hge1oNLYIgQ.PWeIZmkv1YoPnFPzJta', 'Oujda', '0665357624', 'etudiants/cv/qPUvsOg8yOrALB2sLw5Zw1vxKEsZSIeR2n2M7UzX.pdf', 'lettres/QPQROZMEO1PcpcJTGmIgoWPxJXSQEGzoGIJRnH5w.docx', 'photos/etudiants/cdYUwznjixJ0Eaax543fncVcOWZCCUO1hxQ4NBtw.jpg', '2025-05-16 00:34:51', '2025-05-18 01:06:35'),
(2, 'mazyan', 'oussama', 'tendoussama@gmail.com', '$2y$12$h5NeCvD2cR5YaTLa7EjBYOASUJvgeji4IznJE2gpXRo6mSiHl.Pbu', 'Taza', '0666483697', 'etudiants/cv/zYtGdF92wSnQ0HhnmSTLt3X4XB94IOf9NPuPlH3O.pdf', 'etudiants/lettres/VfIuNWIfn049tXNEbL5MxElIs1M7kqSOpCSN9P2S.odt', NULL, '2025-05-17 09:25:26', '2025-05-17 09:25:26');

-- --------------------------------------------------------

--
-- Structure de la table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(66, '2014_10_12_000000_create_users_table', 1),
(67, '2014_10_12_100000_create_password_reset_tokens_table', 1),
(68, '2019_08_19_000000_create_failed_jobs_table', 1),
(69, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(70, '2025_04_12_175750_create_etudiants_table', 1),
(71, '2025_04_12_175830_create_responsable_r_h_s_table', 1),
(72, '2025_04_12_175952_create_administrateurs_table', 1),
(73, '2025_04_12_180012_create_services_table', 1),
(74, '2025_04_12_180029_create_offre_stages_table', 1),
(75, '2025_04_12_180057_create_demande_stages_table', 1),
(76, '2025_05_03_175052_create_responsable_rh_service_table', 1);

-- --------------------------------------------------------

--
-- Structure de la table `offre_stages`
--

CREATE TABLE `offre_stages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `responsable_rh_id` bigint(20) UNSIGNED DEFAULT NULL,
  `service_id` bigint(20) UNSIGNED NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `departement` varchar(255) DEFAULT NULL,
  `duree` int(11) NOT NULL COMMENT 'Durée en unités (ex: 6 pour 6 mois)',
  `unite_duree` varchar(255) NOT NULL DEFAULT 'mois' COMMENT 'Unité de la durée: mois, semaines',
  `nombre_places` int(11) NOT NULL DEFAULT 1,
  `ville` varchar(255) NOT NULL,
  `date_debut` date DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `statut` varchar(255) NOT NULL DEFAULT 'brouillon',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `offre_stages`
--

INSERT INTO `offre_stages` (`id`, `responsable_rh_id`, `service_id`, `titre`, `description`, `departement`, `duree`, `unite_duree`, `nombre_places`, `ville`, `date_debut`, `date_expiration`, `statut`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'hgggg', 'hgvilubukui;gbvukvbuigvbljygyugu', 'jbjk', 7, 'mois', 18, 'Oujda', '2025-05-16', '2025-05-17', 'en_attente', '2025-05-16 00:37:35', '2025-05-16 00:37:35'),
(2, 1, 2, 'fef', 'shdbhsasdadbsajhfbfbshajsbfals', 'cdc', 3, 'mois', 11, 'Casablanca', '2025-05-16', '2025-05-17', 'publiee', '2025-05-16 13:14:18', '2025-05-18 14:35:26'),
(3, 1, 2, 'yguy', 'yuyffyufufufuyfyuyufyfyuuyhgjhvjv', 'hbjhvj', 4, 'mois', 17, 'Oujda', '2025-05-16', '2025-05-17', 'publiee', '2025-05-16 15:28:28', '2025-05-16 23:49:30'),
(4, 1, 1, 'hjjhj', 'yhlvuivlvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv', 'hh', 6, 'mois', 19, 'Oujda', '2025-05-16', '2025-05-17', 'publiee', '2025-05-16 17:19:22', '2025-05-16 19:01:20');

-- --------------------------------------------------------

--
-- Structure de la table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `responsable_rh_service`
--

CREATE TABLE `responsable_rh_service` (
  `responsable_rh_id` bigint(20) UNSIGNED NOT NULL,
  `service_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `responsable_rh_service`
--

INSERT INTO `responsable_rh_service` (`responsable_rh_id`, `service_id`) VALUES
(1, 28),
(1, 37);

-- --------------------------------------------------------

--
-- Structure de la table `responsable_r_h_s`
--

CREATE TABLE `responsable_r_h_s` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `ville` varchar(255) NOT NULL,
  `telephone` varchar(255) NOT NULL,
  `nom_entreprise` varchar(255) NOT NULL,
  `nombre_employes` int(11) NOT NULL,
  `photo_profil` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `responsable_r_h_s`
--

INSERT INTO `responsable_r_h_s` (`id`, `nom`, `prenom`, `email`, `mot_de_passe`, `ville`, `telephone`, `nom_entreprise`, `nombre_employes`, `photo_profil`, `created_at`, `updated_at`) VALUES
(1, 'mmmm', 'mmmm', 'tendoussama1@gmail.com', '$2y$12$HfQAX4YYlhjQNSG8H3yziexrFS7qiX04oT5oA0gvTytDySoOguBSW', 'Berkane', '0666483697', 'NEXT', 44, 'photos/responsables/F00Q5fhSULGg69Q7V6k5wSD87OlXFebDccavRNZQ.jpg', '2025-05-16 00:36:23', '2025-05-17 00:30:30');

-- --------------------------------------------------------

--
-- Structure de la table `services`
--

CREATE TABLE `services` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom_service` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `services`
--

INSERT INTO `services` (`id`, `nom_service`, `created_at`, `updated_at`) VALUES
(1, 'Ressources humaines', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(2, 'Informatique', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(3, 'Développement web', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(4, 'Support technique', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(5, 'Marketing', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(6, 'Communication', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(7, 'Comptabilité', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(8, 'Finance', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(9, 'Juridique', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(10, 'Logistique', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(11, 'Achats', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(12, 'Ventes', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(13, 'Production', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(14, 'Qualité', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(15, 'R&D (Recherche et Développement)', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(16, 'Gestion de projets', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(17, 'Relation client', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(18, 'Service après-vente', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(19, 'Gestion administrative', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(20, 'Sécurité', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(21, 'Transport', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(22, 'Import / Export', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(23, 'Design graphique', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(24, 'UI/UX', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(25, 'Développement mobile', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(26, 'Maintenance industrielle', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(27, 'Contrôle de gestion', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(28, 'Audit interne', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(29, 'Stratégie d’entreprise', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(30, 'Innovation', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(31, 'Formation', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(32, 'Service juridique international', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(33, 'Relations publiques', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(34, 'Développement commercial', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(35, 'Ingénierie', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(36, 'Gestion des risques', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(37, 'Assurance qualité', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(38, 'Développement durable', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(39, 'Gestion immobilière', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(40, 'Planification stratégique', '2025-05-16 00:29:35', '2025-05-16 00:29:35'),
(41, 'Responsabilité sociétale des entreprises (RSE)', '2025-05-16 00:29:35', '2025-05-16 00:29:35');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `administrateurs`
--
ALTER TABLE `administrateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `administrateurs_email_unique` (`email`);

--
-- Index pour la table `demande_stages`
--
ALTER TABLE `demande_stages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `demande_stages_etudiant_id_stage_id_unique` (`etudiant_id`,`stage_id`),
  ADD KEY `demande_stages_stage_id_foreign` (`stage_id`),
  ADD KEY `demande_stages_responsable_rh_id_foreign` (`responsable_rh_id`);

--
-- Index pour la table `etudiants`
--
ALTER TABLE `etudiants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `etudiants_email_unique` (`email`);

--
-- Index pour la table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Index pour la table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `offre_stages`
--
ALTER TABLE `offre_stages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `offre_stages_responsable_rh_id_index` (`responsable_rh_id`),
  ADD KEY `offre_stages_service_id_index` (`service_id`),
  ADD KEY `offre_stages_statut_index` (`statut`),
  ADD KEY `offre_stages_ville_index` (`ville`),
  ADD KEY `offre_stages_date_expiration_index` (`date_expiration`);

--
-- Index pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Index pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Index pour la table `responsable_rh_service`
--
ALTER TABLE `responsable_rh_service`
  ADD PRIMARY KEY (`responsable_rh_id`,`service_id`),
  ADD KEY `responsable_rh_service_service_id_foreign` (`service_id`);

--
-- Index pour la table `responsable_r_h_s`
--
ALTER TABLE `responsable_r_h_s`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `responsable_r_h_s_email_unique` (`email`);

--
-- Index pour la table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `administrateurs`
--
ALTER TABLE `administrateurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `demande_stages`
--
ALTER TABLE `demande_stages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `etudiants`
--
ALTER TABLE `etudiants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT pour la table `offre_stages`
--
ALTER TABLE `offre_stages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `responsable_r_h_s`
--
ALTER TABLE `responsable_r_h_s`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `services`
--
ALTER TABLE `services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `demande_stages`
--
ALTER TABLE `demande_stages`
  ADD CONSTRAINT `demande_stages_etudiant_id_foreign` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demande_stages_responsable_rh_id_foreign` FOREIGN KEY (`responsable_rh_id`) REFERENCES `responsable_r_h_s` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `demande_stages_stage_id_foreign` FOREIGN KEY (`stage_id`) REFERENCES `offre_stages` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `offre_stages`
--
ALTER TABLE `offre_stages`
  ADD CONSTRAINT `offre_stages_responsable_rh_id_foreign` FOREIGN KEY (`responsable_rh_id`) REFERENCES `responsable_r_h_s` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `offre_stages_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `responsable_rh_service`
--
ALTER TABLE `responsable_rh_service`
  ADD CONSTRAINT `responsable_rh_service_responsable_rh_id_foreign` FOREIGN KEY (`responsable_rh_id`) REFERENCES `responsable_r_h_s` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `responsable_rh_service_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
