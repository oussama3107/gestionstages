<?php
// config/auth.php

// No major changes needed here based on the provided code,
// assuming the individual models implement JWTSubject.
// Comments added for clarity.

return [
    /*
    |--------------------------------------------------------------------------
    | Default Authentication Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the authentication driver that will be utilized.
    | This driver manages the retrieval and authentication of the users
    | attempting to get access to protected areas of your application.
    |
    | Supported: "session", "token"
    |
    */
    'defaults' => [
        'guard' => 'api', // Use 'api' guard (JWT) by default for API requests
        'passwords' => 'users',
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Here you may define every authentication guard for your application.
    | Of course, a great default configuration has been defined for you
    | here which uses session storage and the Eloquent user provider.
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database or other storage
    | mechanisms used by this application to persist your user's data.
    |
    | Supported: "session", "token" (for Sanctum), "jwt" (for tymon/jwt-auth)
    |
    */
    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users', // Default provider for web routes
        ],

        // This is the guard used by the 'auth:api' middleware in your routes/api.php
        'api' => [
            'driver' => 'jwt',       // Using the tymon/jwt-auth driver
            'provider' => 'users',   // Specifies which provider to use to fetch user details
                                     // based on the token's subject claim (usually user ID).
                                     // IMPORTANT: The provider's model (`App\Models\User` here)
                                     //            OR the specific models used for login (`Etudiant`, `ResponsableRh`, `Administrateur`)
                                     //            MUST implement Tymon\JWTAuth\Contracts\JWTSubject.
                                     //            Implementing it on the specific models is often clearer for multi-auth systems.
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database or other storage
    | mechanisms used by this application to persist your user's data.
    |
    | If you have multiple user tables or models you may configure multiple
    | sources which represent each model / table. These sources may then
    | be assigned to any extra authentication guards you have defined.
    |
    | Supported: "database", "eloquent"
    |
    */
    'providers' => [
        // The 'users' provider is linked to the 'api' guard above.
        // It tells Laravel how to find a user based on the ID in the JWT token.
        // Make sure this model exists and ideally implements JWTSubject,
        // OR ensure the models used in AuthController::login implement it.
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class, // Default Laravel User model. Check if you use this or only the specific ones.
                                                // If you ONLY use Etudiant, ResponsableRh, Admin, you might not need this exact entry
                                                // IF those models implement JWTSubject correctly.
        ],

        // Providers for specific user types (can be used by custom guards if needed,
        // but also useful documentation)
        'etudiants' => [
            'driver' => 'eloquent',
            'model' => App\Models\Etudiant::class,
        ],
        'responsables' => [
            'driver' => 'eloquent',
            'model' => App\Models\ResponsableRh::class,
        ],
        'administrateurs' => [
            'driver' => 'eloquent',
            'model' => App\Models\Administrateur::class, // Ensure this model exists
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | Here you may set the options for resetting passwords including the view
    | that is your password reset e-mail. You may also set the name of the
    | table that holds the reset tokens for your application.
    |
    | The expire time is the number of minutes that the reset token should be
    | considered valid. This security feature keeps tokens short-lived so
    | they have less time to be guessed. You may change this as needed.
    |
    */
    'passwords' => [
        'users' => [
            'provider' => 'users', // Must match a provider defined above
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
        // Add brokers for etudiants, responsables if they have password reset functionality
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    |
    | Here you may define the amount of seconds before a password confirmation
    | times out and the user is prompted to re-enter their password via the
    | confirmation screen. By default, the timeout lasts for three hours.
    |
    */
    'password_timeout' => 10800, // 3 hours

];