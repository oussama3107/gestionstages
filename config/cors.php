<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'], // 'sanctum/csrf-cookie' est essentiel

    'allowed_methods' => ['*'], // Ou soyez plus spécifique: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

    'allowed_origins' => explode(',', env('SANCTUM_ALLOWED_ORIGINS', 'http://localhost:3000')), // URL de votre frontend React

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'], // Ou plus spécifique: ['Content-Type', 'X-Requested-With', 'Accept', 'Authorization', 'X-XSRF-TOKEN']

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // TRÈS IMPORTANT pour que Sanctum envoie/reçoive les cookies

];