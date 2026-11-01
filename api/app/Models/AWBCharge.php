<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AWBCharge extends Model
{
    protected $table = 'awb_charges';

    protected $fillable = [
        'awb_id',
        'freight_charge', 'handling_fee', 'security_levy',
        'fuel_surcharge', 'dgr_surcharge', 'other_charges', 'total',
        'currency', 'status', 'payment_method', 'payment_reference',
        'notes', 'due_date', 'paid_at', 'created_by',
    ];

    protected $casts = [
        'freight_charge' => 'decimal:2',
        'handling_fee'   => 'decimal:2',
        'security_levy'  => 'decimal:2',
        'fuel_surcharge' => 'decimal:2',
        'dgr_surcharge'  => 'decimal:2',
        'other_charges'  => 'decimal:2',
        'total'          => 'decimal:2',
        'due_date'       => 'date',
        'paid_at'        => 'datetime',
    ];

    // Rates (USD per kg)
    const RATE_FREIGHT  = 2.50;
    const RATE_HANDLING = 0.35;
    const RATE_SECURITY = 0.15;
    const RATE_FUEL_PCT = 0.20;   // 20% of freight
    const RATE_DGR_FLAT = 150.00; // flat DGR surcharge per declaration

    public function awb()
    {
        return $this->belongsTo(AWB::class, 'awb_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Auto-generate charges from AWB weight and type.
     */
    public static function generateFor(AWB $awb): self
    {
        $kg       = (float) $awb->weight_kg;
        $freight  = round($kg * self::RATE_FREIGHT,  2);
        $handling = round($kg * self::RATE_HANDLING, 2);
        $security = round($kg * self::RATE_SECURITY, 2);
        $fuel     = round($freight * self::RATE_FUEL_PCT, 2);
        $dgr      = $awb->is_dgr ? self::RATE_DGR_FLAT : 0;
        $total    = $freight + $handling + $security + $fuel + $dgr;

        return self::create([
            'awb_id'         => $awb->id,
            'freight_charge' => $freight,
            'handling_fee'   => $handling,
            'security_levy'  => $security,
            'fuel_surcharge' => $fuel,
            'dgr_surcharge'  => $dgr,
            'other_charges'  => 0,
            'total'          => $total,
            'currency'       => 'MRU',
            'status'         => 'pending',
            'due_date'       => now()->addDays(30)->toDateString(),
            'created_by'     => $awb->created_by,
        ]);
    }
}
