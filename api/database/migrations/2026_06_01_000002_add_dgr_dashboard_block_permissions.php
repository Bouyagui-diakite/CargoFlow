<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['create_dgr', 'view_dashboard', 'block_shipment'] as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // Supervisors + admins: create DGR declarations and view the dashboard.
        // Only admins: block / unblock shipments.
        if ($admin = Role::where('name', 'admin')->first()) {
            $admin->givePermissionTo(['create_dgr', 'view_dashboard', 'block_shipment']);
        }
        if ($super = Role::where('name', 'supervisor')->first()) {
            $super->givePermissionTo(['create_dgr', 'view_dashboard']);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        foreach (['create_dgr', 'view_dashboard', 'block_shipment'] as $name) {
            Permission::where('name', $name)->where('guard_name', 'web')->delete();
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
