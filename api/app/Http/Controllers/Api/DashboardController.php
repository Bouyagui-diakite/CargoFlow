<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AWB;
use App\Models\DGR;
use App\Models\Flight;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

class DashboardController extends Controller
{
    public function index()
    {
        Gate::authorize('view_dashboard');

        $week = Carbon::now()->startOfWeek();

        $stats = [
            'totalAWBs'         => AWB::count(),
            'activeFlights'     => Flight::whereIn('status', ['scheduled', 'boarding', 'departed'])->count(),
            'pendingDGRs'       => DGR::where('status', 'pending')->count(),
            'blockedShipments'  => AWB::where('status', 'blocked')->count(),
            'deliveredThisWeek' => AWB::where('status', 'delivered')->where('updated_at', '>=', $week)->count(),
            'totalWeightKg'     => (float) AWB::whereNotIn('status', ['blocked'])->sum('weight_kg'),
            'revenueUSD'        => 248500, // replace with real billing model
        ];

        // 6-month trend
        $trend = collect(range(5, 0))->map(function ($i) {
            $month = Carbon::now()->subMonths($i);
            return [
                'month'     => $month->format('M'),
                'awbs'      => AWB::whereYear('created_at', $month->year)->whereMonth('created_at', $month->month)->count(),
                'dgrEvents' => DGR::whereYear('created_at', $month->year)->whereMonth('created_at', $month->month)->count(),
            ];
        })->values();

        $total      = max(AWB::count(), 1);
        $dgrCount   = AWB::where('is_dgr', true)->count();
        $perCount   = AWB::whereJsonContains('special_handling', 'PER')->count();
        $valCount   = AWB::whereJsonContains('special_handling', 'VAL')->count();
        $humCount   = AWB::whereJsonContains('special_handling', 'HUM')->count();
        $rest       = max($total - $dgrCount - $perCount - $valCount - $humCount, 0);

        $cargoBreakdown = [
            ['name' => 'General Cargo', 'value' => (int) round($rest     / $total * 100), 'color' => '#3b82f6'],
            ['name' => 'Perishables',   'value' => (int) round($perCount / $total * 100), 'color' => '#10b981'],
            ['name' => 'DGR',           'value' => (int) round($dgrCount / $total * 100), 'color' => '#f97316'],
            ['name' => 'Valuable',      'value' => (int) round($valCount / $total * 100), 'color' => '#f59e0b'],
            ['name' => 'Humanitarian',  'value' => (int) round($humCount / $total * 100), 'color' => '#8b5cf6'],
        ];

        // Alerts
        $blocked    = AWB::where('status', 'blocked')
            ->select('id', 'awb_number', 'block_reason')->get();
        $pendingDGR = DGR::where('status', 'pending')
            ->select('id', 'un_number', 'proper_shipping_name')->get();
        $overloaded = Flight::whereIn('status', ['scheduled', 'boarding', 'departed'])
            ->with('awbs:id,flight_id,weight_kg')
            ->get()
            ->filter(fn ($f) => $f->awbs->sum('weight_kg') > $f->capacity_kg)
            ->map(fn ($f) => ['id' => $f->id, 'flight_number' => $f->flight_number, 'origin' => $f->origin, 'destination' => $f->destination])
            ->values();

        // Recent AWBs
        $recentAWBs = AWB::select('id', 'awb_number', 'origin', 'destination', 'weight_kg', 'is_dgr', 'status')
            ->orderByDesc('created_at')->limit(6)->get();

        // Active flights with computed load
        $activeFlights = Flight::whereIn('status', ['scheduled', 'boarding', 'departed'])
            ->with('awbs:id,flight_id,weight_kg')
            ->orderBy('departure_at')->limit(5)->get()
            ->map(fn ($f) => array_merge($f->toArray(), ['loaded_kg' => $f->awbs->sum('weight_kg')]));

        return response()->json([
            'stats'           => $stats,
            'trend'           => $trend,
            'cargo_breakdown' => $cargoBreakdown,
            'alerts'          => ['blocked' => $blocked, 'pending_dgr' => $pendingDGR, 'overloaded' => $overloaded],
            'recent_awbs'     => $recentAWBs,
            'active_flights'  => $activeFlights,
        ]);
    }
}
