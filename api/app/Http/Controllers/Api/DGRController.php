<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DGR;
use App\Models\AWB;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Barryvdh\DomPDF\Facade\Pdf;

class DGRController extends Controller
{
    public function index(Request $request)
    {
        $query = DGR::with(['awb', 'approver', 'creator'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->awb_id, fn ($q, $id) => $q->where('awb_id', $id))
            ->orderByDesc('created_at');

        return response()->json($query->paginate(25));
    }

    public function store(Request $request)
    {
        Gate::authorize('create_dgr');

        $validated = $request->validate([
            'awb_id'               => 'required|exists:awbs,id',
            'dgr_class'            => 'required|string|max:5',
            'un_number'            => 'required|string|regex:/^UN\d{4}$/',
            'proper_shipping_name' => 'required|string|max:255',
            'packing_group'        => 'nullable|in:I,II,III',
            'erg_code'             => 'required|string|max:5',
            'net_quantity'         => 'required|string|max:30',
            'number_of_packages'   => 'required|integer|min:1',
            'packaging_type'       => 'nullable|string|max:255',
            'emergency_contact'    => 'required|string|max:30',
            'remarks'              => 'nullable|string',
        ]);

        $dgr = DGR::create([
            ...$validated,
            'status'     => 'pending',
            'created_by' => $request->user()->id,
        ]);

        // Mark AWB as DGR
        $awb = AWB::find($validated['awb_id']);
        $awb->update(['is_dgr' => true]);

        // Notify approvers (supervisors + admins) — except the agent who filed it
        Notification::notifyRoles(
            ['supervisor', 'admin'],
            'dgr_pending',
            'DGR pending approval',
            "{$dgr->un_number} (Class {$dgr->dgr_class}) on AWB {$awb->awb_number} awaits approval.",
            "/dgr/{$dgr->id}/edit",
            $request->user()->id,
        );

        return response()->json($dgr->load(['awb', 'creator']), 201);
    }

    public function show(DGR $dgr)
    {
        return response()->json($dgr->load(['awb.flight', 'approver', 'creator']));
    }

    public function update(Request $request, DGR $dgr)
    {
        Gate::authorize('edit_awb');

        if ($dgr->status !== 'pending') {
            return response()->json(['message' => 'Cannot edit an approved or rejected declaration.'], 422);
        }

        $validated = $request->validate([
            'net_quantity'       => 'sometimes|string|max:30',
            'number_of_packages' => 'sometimes|integer|min:1',
            'packaging_type'     => 'nullable|string|max:255',
            'remarks'            => 'nullable|string',
        ]);

        $dgr->update($validated);
        return response()->json($dgr->fresh());
    }

    public function approve(Request $request, DGR $dgr)
    {
        Gate::authorize('approve_dgr');

        if ($dgr->status !== 'pending') {
            return response()->json(['message' => 'Declaration is not pending approval.'], 422);
        }

        $dgr->approve($request->user());

        activity()->causedBy($request->user())
            ->performedOn($dgr)
            ->log("DGR declaration ({$dgr->un_number}) approved — NOTOC: {$dgr->notoc_ref}");

        if ($dgr->created_by) {
            Notification::notifyUser(
                $dgr->created_by,
                'dgr_approved',
                'DGR approved',
                "{$dgr->un_number} was approved by {$request->user()->name}. NOTOC {$dgr->notoc_ref} generated.",
                "/dgr/{$dgr->id}/notoc",
            );
        }

        return response()->json($dgr->fresh(['approver']));
    }

    public function reject(Request $request, DGR $dgr)
    {
        Gate::authorize('approve_dgr');

        $request->validate(['reason' => 'required|string|min:5']);

        if ($dgr->status !== 'pending') {
            return response()->json(['message' => 'Declaration is not pending.'], 422);
        }

        $dgr->reject($request->user(), $request->reason);

        activity()->causedBy($request->user())
            ->performedOn($dgr)
            ->log("DGR declaration ({$dgr->un_number}) rejected: {$request->reason}");

        if ($dgr->created_by) {
            Notification::notifyUser(
                $dgr->created_by,
                'dgr_rejected',
                'DGR rejected',
                "{$dgr->un_number} was rejected by {$request->user()->name}: {$request->reason}",
                "/dgr/{$dgr->id}/edit",
            );
        }

        return response()->json($dgr->fresh());
    }

    public function generateNOTOC(DGR $dgr)
    {
        if (! $dgr->notoc_generated) {
            return response()->json(['message' => 'NOTOC not yet generated. Approve the DGR first.'], 422);
        }

        return response()->json($dgr->load(['awb.flight', 'approver']));
    }

    public function downloadNOTOC(DGR $dgr)
    {
        if (! $dgr->notoc_generated) {
            return response()->json(['message' => 'NOTOC not available.'], 422);
        }

        $dgr->load(['awb.flight', 'approver']);

        // Gather all approved DGRs for the same flight
        $flightId = $dgr->awb?->flight_id;
        $dgrs = \App\Models\DGR::with(['awb'])
            ->where('status', 'approved')
            ->whereHas('awb', fn ($q) => $q->where('flight_id', $flightId))
            ->get();

        // AWBs with special handling but NOT DGR on same flight
        $specialCargo = \App\Models\AWB::where('flight_id', $flightId)
            ->where('is_dgr', false)
            ->whereNotNull('special_handling')
            ->where('special_handling', '!=', '[]')
            ->get()
            ->filter(fn ($a) => count($a->special_handling ?? []) > 0);

        $awbs = \App\Models\AWB::where('flight_id', $flightId)->with('flight')->get();

        $pdf = Pdf::loadView('pdf.notoc', [
                'dgrs'         => $dgrs,
                'specialCargo' => $specialCargo,
                'awbs'         => $awbs,
                'notocRef'     => $dgr->notoc_ref,
                'preparedBy'   => auth()->user()?->name ?? 'CF-SYSTEM',
            ])
            ->setPaper('a4', 'landscape')
            ->setOption('defaultFont', 'Arial')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false);

        return $pdf->download("NOTOC_{$dgr->notoc_ref}.pdf");
    }
}
