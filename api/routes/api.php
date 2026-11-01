<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AWBController;
use App\Http\Controllers\Api\DGRController;
use App\Http\Controllers\Api\FlightController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AWBChargeController;
use App\Http\Controllers\Api\NotificationController;

// Public — throttled to slow brute-force / credential stuffing.
Route::post('/login',  [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // AWBs
    Route::apiResource('awbs', AWBController::class);
    Route::patch('/awbs/{awb}/status',       [AWBController::class,       'updateStatus']);
    Route::get('/awbs/{awb}/pdf',            [AWBController::class,       'downloadPDF']);
    Route::get('/awbs/{awb}/charges',        [AWBChargeController::class, 'index']);
    Route::patch('/awbs/{awb}/charges',      [AWBChargeController::class, 'update']);
    Route::patch('/awbs/{awb}/charges/pay',  [AWBChargeController::class, 'markPaid']);

    // DGR
    Route::apiResource('dgr', DGRController::class);
    Route::patch('/dgr/{dgr}/approve',  [DGRController::class, 'approve'])->middleware('can:approve_dgr');
    Route::patch('/dgr/{dgr}/reject',   [DGRController::class, 'reject'])->middleware('can:approve_dgr');
    Route::get('/dgr/{dgr}/notoc',      [DGRController::class, 'generateNOTOC']);
    Route::get('/dgr/{dgr}/notoc/pdf',  [DGRController::class, 'downloadNOTOC']);

    // Flights
    Route::apiResource('flights', FlightController::class);
    Route::post('/flights/{flight}/awbs/{awb}',   [FlightController::class, 'assignAWB']);
    Route::delete('/flights/{flight}/awbs/{awb}', [FlightController::class, 'removeAWB']);
    Route::get('/flights/{flight}/notoc/pdf',     [FlightController::class, 'downloadNOTOC']);

    // Users (admin only)
    Route::middleware('can:manage_users')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
    });

    // Documents
    Route::apiResource('documents', DocumentController::class)->except(['update']);
    Route::post('/documents/upload', [DocumentController::class, 'upload']);

    // Audit log
    Route::get('/activity-log', [ActivityLogController::class, 'index'])->middleware('can:view_logs');

    // Notifications
    Route::get('/notifications',                    [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',        [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/read-all',          [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}',    [NotificationController::class, 'destroy']);
});
