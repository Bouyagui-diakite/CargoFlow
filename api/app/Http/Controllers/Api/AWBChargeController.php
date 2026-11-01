<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AWB;
use App\Models\AWBCharge;
use Illuminate\Http\Request;

class AWBChargeController extends Controller
{
    /** GET /api/awbs/{awb}/charges */
    public function index(AWB $awb)
    {
        return response()->json($awb->charge);
    }

    /** PATCH /api/awbs/{awb}/charges */
    public function update(Request $request, AWB $awb)
    {
        $validated = $request->validate([
            'freight_charge' => 'sometimes|numeric|min:0',
            'handling_fee'   => 'sometimes|numeric|min:0',
            'security_levy'  => 'sometimes|numeric|min:0',
            'fuel_surcharge' => 'sometimes|numeric|min:0',
            'dgr_surcharge'  => 'sometimes|numeric|min:0',
            'other_charges'  => 'sometimes|numeric|min:0',
            'notes'          => 'nullable|string',
        ]);

        $charge = $awb->charge ?? AWBCharge::generateFor($awb);
        $charge->fill($validated);
        $charge->total = array_sum([
            $charge->freight_charge,
            $charge->handling_fee,
            $charge->security_levy,
            $charge->fuel_surcharge,
            $charge->dgr_surcharge,
            $charge->other_charges,
        ]);
        $charge->save();

        return response()->json($charge);
    }

    /** PATCH /api/awbs/{awb}/charges/pay */
    public function markPaid(Request $request, AWB $awb)
    {
        $request->validate([
            'status'            => 'required|in:paid,partial,pending,cancelled',
            'payment_method'    => 'nullable|in:cash,bank_transfer,bankily,masrivi,sedad,check',
            'payment_reference' => 'nullable|string|max:100',
        ]);

        $charge = $awb->charge ?? AWBCharge::generateFor($awb);
        $isPaid = in_array($request->status, ['paid', 'partial']);

        $charge->update([
            'status'            => $request->status,
            'payment_method'    => $isPaid ? $request->payment_method : null,
            'payment_reference' => $isPaid ? $request->payment_reference : null,
            'paid_at'           => $isPaid ? now() : null,
        ]);

        activity()->causedBy($request->user())
            ->performedOn($charge)
            ->log("AWB {$awb->awb_number} charges marked as {$request->status}" .
                  ($request->payment_method ? " via {$request->payment_method}" : ''));

        return response()->json($charge);
    }
}
