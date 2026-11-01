<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AWB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Barryvdh\DomPDF\Facade\Pdf;

class AWBController extends Controller
{
    public function index(Request $request)
    {
        $query = AWB::with(['flight', 'dgr', 'creator', 'charge'])
            ->when($request->status,      fn ($q, $s) => $q->where('status', $s))
            ->when($request->is_dgr,      fn ($q)     => $q->where('is_dgr', true))
            ->when($request->origin,      fn ($q, $s) => $q->where('origin', strtoupper($s)))
            ->when($request->destination, fn ($q, $s) => $q->where('destination', strtoupper($s)))
            ->when($request->search,      fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('awb_number', 'like', "%{$s}%")
                  ->orWhere('shipper_name', 'like', "%{$s}%")
                  ->orWhere('consignee_name', 'like', "%{$s}%")
                  ->orWhere('commodity', 'like', "%{$s}%");
            }))
            ->orderByDesc('created_at');

        return response()->json($query->paginate(25));
    }

    public function store(Request $request)
    {
        Gate::authorize('create_awb');

        $validated = $request->validate([
            'origin'             => 'required|string|size:3|alpha',
            'destination'        => 'required|string|size:3|alpha|different:origin',
            'shipper_name'       => 'required|string|max:255',
            'shipper_address'    => 'required|string',
            'shipper_country'    => 'required|string|size:2|alpha',
            'consignee_name'     => 'required|string|max:255',
            'consignee_address'  => 'required|string',
            'consignee_country'  => 'required|string|size:2|alpha',
            'pieces'             => 'required|integer|min:1',
            'weight_kg'          => 'required|numeric|min:0.1',
            'volume_m3'          => 'nullable|numeric|min:0',
            'commodity'          => 'required|string|max:255',
            'special_handling'   => 'nullable|array',
            'special_handling.*' => 'string|max:3',
            'is_dgr'             => 'boolean',
            'flight_id'          => 'nullable|exists:flights,id',
        ]);

        $awb = AWB::create([
            ...$validated,
            'awb_number' => AWB::generateNumber($this->prefixForFlight($validated['flight_id'] ?? null)),
            'status'     => 'received',
            'created_by' => $request->user()->id,
        ]);

        // Auto-generate billing charges
        \App\Models\AWBCharge::generateFor($awb);

        return response()->json($awb->load(['flight', 'creator', 'charge']), 201);
    }

    public function show(AWB $awb)
    {
        return response()->json($awb->load(['flight', 'dgr.approver', 'creator', 'charge']));
    }

    public function update(Request $request, AWB $awb)
    {
        Gate::authorize('edit_awb');

        $validated = $request->validate([
            'origin'             => 'sometimes|string|size:3|alpha',
            'destination'        => 'sometimes|string|size:3|alpha',
            'pieces'             => 'sometimes|integer|min:1',
            'weight_kg'          => 'sometimes|numeric|min:0.1',
            'volume_m3'          => 'nullable|numeric|min:0',
            'commodity'          => 'sometimes|string|max:255',
            'special_handling'   => 'nullable|array',
            'flight_id'          => 'nullable|exists:flights,id',
            'shipper_name'       => 'sometimes|string|max:255',
            'shipper_address'    => 'sometimes|string',
            'shipper_country'    => 'sometimes|string|size:2|alpha',
            'consignee_name'     => 'sometimes|string|max:255',
            'consignee_address'  => 'sometimes|string',
            'consignee_country'  => 'sometimes|string|size:2|alpha',
        ]);

        $awb->update($validated);
        return response()->json($awb->fresh(['flight', 'dgr']));
    }

    public function updateStatus(Request $request, AWB $awb)
    {
        $validated = $request->validate([
            'status'       => 'required|in:' . implode(',', AWB::STATUSES),
            'block_reason' => 'required_if:status,blocked|nullable|string',
        ]);

        // Blocking/unblocking a shipment is admin-only; advancing it through the
        // status workflow is for supervisors + admins (process_shipment).
        $isBlocking   = $validated['status'] === 'blocked';
        $isUnblocking = $awb->status === 'blocked' && $validated['status'] !== 'blocked';
        Gate::authorize(($isBlocking || $isUnblocking) ? 'block_shipment' : 'process_shipment');

        // Clear the stored reason once a shipment is unblocked.
        if ($isUnblocking) {
            $validated['block_reason'] = null;
        }

        $awb->update($validated);
        return response()->json($awb);
    }

    public function destroy(AWB $awb)
    {
        Gate::authorize('delete_awb');
        $awb->delete();
        return response()->json(null, 204);
    }

    private function prefixForFlight(?int $flightId): string
    {
        if (!$flightId) return '235';

        $fn = \App\Models\Flight::find($flightId)?->flight_number ?? '';

        $map = [
            'HC205' => '490', 'HC206' => '490',
            'NT1804' => '474', 'NT1805' => '474',
            'KP014' => '032', 'KP015' => '032',
            'WT192' => '221', 'WT193' => '574',
        ];
        if (isset($map[$fn])) return $map[$fn];
        if (str_starts_with($fn, 'L6')) return '495';
        if (str_starts_with($fn, 'TK')) return '235';
        if (str_starts_with($fn, 'AT')) return '147';
        if (str_starts_with($fn, 'AH')) return '124';
        if (str_starts_with($fn, 'TU')) return '221';
        return '235';
    }

    public function downloadPDF(AWB $awb)
    {
        $awb->load(['flight', 'dgr.approver', 'creator']);

        $pdf = Pdf::loadView('pdf.awb', compact('awb'))
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', 'Arial')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false);

        return $pdf->download("AWB_{$awb->awb_number}.pdf");
    }
}
