<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(
            User::with('roles')->orderBy('name')->paginate(25)
        );
    }

    public function store(Request $request)
    {
        // Only administrators may register new accounts (agents, supervisors, etc.).
        // Enforced here in addition to the route's can:manage_users middleware.
        Gate::authorize('manage_users');

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'role'     => 'required|in:admin,supervisor,cargo_agent,ground_handler',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status'   => 'active',
        ]);

        $user->assignRole($validated['role']);

        activity()->causedBy($request->user())->performedOn($user)->log("User {$user->name} registered with role {$validated['role']}");

        // Welcome the new account and let other admins know.
        Notification::notifyUser(
            $user->id,
            'welcome',
            'Welcome to CargoFlow',
            "Your {$validated['role']} account is active. You can now sign in.",
            '/',
        );
        Notification::notifyRoles(
            ['admin'],
            'user_registered',
            'New account registered',
            "{$user->name} ({$validated['role']}) was registered by {$request->user()->name}.",
            '/users',
            $request->user()->id,
        );

        return response()->json($user->load('roles'), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('roles'));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'role'  => 'sometimes|in:admin,supervisor,cargo_agent,ground_handler',
        ]);

        $user->update(['name' => $validated['name'] ?? $user->name]);

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        return response()->json($user->fresh('roles'));
    }

    public function toggleStatus(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot deactivate your own account.'], 422);
        }

        $user->update(['status' => $user->status === 'active' ? 'inactive' : 'active']);
        return response()->json($user);
    }

    public function destroy(User $user)
    {
        if ($user->hasRole('admin')) {
            return response()->json(['message' => 'Cannot delete an admin account.'], 422);
        }
        $user->delete();
        return response()->json(null, 204);
    }
}
