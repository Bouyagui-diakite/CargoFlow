<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        if ($user->status === 'inactive') {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated.'],
            ]);
        }

        $token = $user->createToken('cargoflow')->plainTextToken;

        activity()->causedBy($user)->log("Logged in");

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'role'   => $user->getRoleNames()->first(),
                'avatar' => strtoupper(substr($user->name, 0, 1) . (strpos($user->name, ' ') ? substr($user->name, strpos($user->name, ' ') + 1, 1) : '')),
            ],
        ]);
    }

    public function logout(Request $request)
    {
        activity()->causedBy($request->user())->log("Logged out");
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'role'   => $user->getRoleNames()->first(),
            'avatar' => strtoupper(substr($user->name, 0, 1) . (strpos($user->name, ' ') ? substr($user->name, strpos($user->name, ' ') + 1, 1) : '')),
        ]);
    }
}
