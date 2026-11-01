<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Spatie roles are stored under 'web' guard; Sanctum authenticates via
        // the 'api' guard. We explicitly pass 'web' so the guard mismatch doesn't
        // block authorization checks on API routes.
        $abilities = [
            'create_awb', 'edit_awb', 'delete_awb',
            'approve_dgr', 'manage_users', 'view_logs', 'manage_flights',
        ];

        foreach ($abilities as $ability) {
            Gate::define($ability, fn ($user) => $user->hasPermissionTo($ability, 'web'));
        }

        // Admins pass every gate
        Gate::before(fn ($user) => $user->hasRole('admin', 'web') ? true : null);
    }
}
