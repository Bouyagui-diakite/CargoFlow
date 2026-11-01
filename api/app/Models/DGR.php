<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class DGR extends Model
{
    protected $table = 'dgr_declarations';

    protected $fillable = [
        'awb_id',
        'dgr_class', 'un_number', 'proper_shipping_name',
        'packing_group', 'erg_code',
        'net_quantity', 'number_of_packages', 'packaging_type',
        'status',
        'notoc_generated', 'notoc_ref', 'notoc_path',
        'approved_by', 'approved_at',
        'rejection_reason',
        'emergency_contact', 'remarks',
        'created_by',
    ];

    protected $casts = [
        'notoc_generated' => 'boolean',
        'approved_at'     => 'datetime',
    ];

    const STATUSES = ['pending', 'approved', 'rejected'];

    // IATA DGR classes
    const CLASSES = [
        '1', '2.1', '2.2', '2.3',
        '3', '4.1', '4.2', '4.3',
        '5.1', '5.2', '6.1', '6.2',
        '7', '8', '9',
    ];

    public function awb()
    {
        return $this->belongsTo(AWB::class, 'awb_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function generateNOTOCRef(): string
    {
        return 'NOTOC-' . now()->format('Y') . '-' . str_pad(
            self::whereYear('created_at', now()->year)->count() + 1,
            4,
            '0',
            STR_PAD_LEFT,
        );
    }

    public function approve(User $approver): void
    {
        $this->update([
            'status'          => 'approved',
            'approved_by'     => $approver->id,
            'approved_at'     => now(),
            'notoc_generated' => true,
            'notoc_ref'       => $this->generateNOTOCRef(),
        ]);
    }

    public function reject(User $approver, string $reason): void
    {
        $this->update([
            'status'           => 'rejected',
            'approved_by'      => $approver->id,
            'approved_at'      => now(),
            'rejection_reason' => $reason,
        ]);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => "DGR declaration ({$this->un_number}) was {$eventName}");
    }
}
