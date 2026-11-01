<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use App\Models\AWB;
use App\Models\DGR;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;

class FlightController extends Controller
{
    public function index(Request $request)
    {
        $query = Flight::withCount('awbs')
            ->with(['awbs' => fn ($q) => $q->select('id', 'awb_number', 'flight_id', 'is_dgr', 'status')])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderBy('departure_at');

        $flights = $query->get();

        $flights->each(function ($flight) {
            $flight->loaded_kg = $flight->awbs->sum('weight_kg');
        });

        return response()->json($flights);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage_flights');

        $validated = $request->validate([
            'flight_number' => [
                'required', 'string', 'max:10',
                Rule::unique('flights')->where('departure_at', $request->departure_at),
            ],
            'origin'        => 'required|string|size:3|alpha',
            'destination'   => 'required|string|size:3|alpha|different:origin',
            'departure_at'  => 'required|date|after:now',
            'arrival_at'    => 'required|date|after:departure_at',
            'aircraft_type' => 'required|string|max:30',
            'capacity_kg'   => 'required|numeric|min:100',
            'volume_m3'     => 'nullable|numeric|min:1',
            'uld_positions' => 'nullable|integer|min:0',
        ]);

        $flight = Flight::create([
            ...$validated,
            'flight_number' => strtoupper($validated['flight_number']),
            'status'        => 'scheduled',
            'created_by'    => $request->user()->id,
        ]);

        return response()->json($flight, 201);
    }

    public function show(Flight $flight)
    {
        $flight->load('awbs.dgr');
        $flight->loaded_kg = $flight->awbs->sum('weight_kg');
        return response()->json($flight);
    }

    public function update(Request $request, Flight $flight)
    {
        Gate::authorize('manage_flights');

        $validated = $request->validate([
            'status'       => 'sometimes|in:' . implode(',', Flight::STATUSES),
            'capacity_kg'  => 'sometimes|numeric|min:100',
            'departure_at' => 'sometimes|date',
            'arrival_at'   => 'sometimes|date',
        ]);

        $flight->update($validated);
        return response()->json($flight);
    }

    public function destroy(Flight $flight)
    {
        Gate::authorize('manage_flights');

        if ($flight->awbs()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a flight with assigned AWBs.'], 422);
        }

        $flight->delete();
        return response()->json(null, 204);
    }

    public function assignAWB(Flight $flight, AWB $awb)
    {
        Gate::authorize('edit_awb');

        $newLoad = $flight->loaded_kg + $awb->weight_kg;
        $awb->update(['flight_id' => $flight->id]);

        $warning = $newLoad > $flight->capacity_kg ? 'Flight is now overloaded.' : null;

        return response()->json(['message' => 'AWB assigned.', 'warning' => $warning]);
    }

    public function removeAWB(Flight $flight, AWB $awb)
    {
        Gate::authorize('edit_awb');
        $awb->update(['flight_id' => null]);
        return response()->json(['message' => 'AWB removed from flight.']);
    }

    public function downloadNOTOC(Request $request, Flight $flight)
    {
        if ($flight->origin !== 'NKC') {
            return response()->json(['message' => 'NOTOC is only generated for departure flights (origin: NKC).'], 422);
        }

        // All approved DGRs on this flight
        $dgrs = DGR::with(['awb'])
            ->where('status', 'approved')
            ->whereHas('awb', fn ($q) => $q->where('flight_id', $flight->id))
            ->get();

        // AWBs with special handling (non-DGR) on this flight
        $specialCargo = AWB::where('flight_id', $flight->id)
            ->where('is_dgr', false)
            ->get()
            ->filter(fn ($a) => count($a->special_handling ?? []) > 0)
            ->values();

        $awbs     = AWB::where('flight_id', $flight->id)->with('flight')->get();
        $notocRef = 'NOTOC-' . now()->year . '-' . strtoupper($flight->flight_number);

        $pdf = Pdf::loadView('pdf.notoc', [
            'dgrs'         => $dgrs,
            'specialCargo' => $specialCargo,
            'awbs'         => $awbs,
            'notocRef'     => $notocRef,
            'preparedBy'   => $request->user()?->name ?? 'CF-SYSTEM',
        ])
        ->setPaper('a4', 'landscape')
        ->setOption('defaultFont', 'Arial')
        ->setOption('isHtml5ParserEnabled', true)
        ->setOption('isRemoteEnabled', false);

        return $pdf->download("NOTOC_{$flight->flight_number}.pdf");
    }
}
