<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use App\Models\AWBCharge;

class AWB extends Model
{
    use SoftDeletes, LogsActivity;

    protected $table = 'awbs';

    protected $fillable = [
        'awb_number', 'origin', 'destination',
        'shipper_name', 'shipper_address', 'shipper_country', 'shipper_account',
        'consignee_name', 'consignee_address', 'consignee_country', 'consignee_account',
        'pieces', 'weight_kg', 'volume_m3',
        'commodity', 'special_handling',
        'is_dgr', 'status',
        'flight_id', 'created_by',
        'block_reason',
    ];

    protected $casts = [
        'special_handling' => 'array',
        'is_dgr'           => 'boolean',
        'weight_kg'        => 'decimal:2',
        'volume_m3'        => 'decimal:2',
    ];

    const STATUSES = ['received', 'processing', 'loaded', 'in_transit', 'delivered', 'blocked'];

    // AWB number format: <airline_prefix>-<8_digit_serial>
    // Prefix 235 = Tunisair Cargo
    public static function generateNumber(string $prefix = '235'): string
    {
        do {
            $serial = str_pad(random_int(10000000, 99999999), 8, '0', STR_PAD_LEFT);
            $number = "{$prefix}-{$serial}";
        } while (self::where('awb_number', $number)->exists());

        return $number;
    }

    public function flight()
    {
        return $this->belongsTo(Flight::class);
    }

    public function dgr()
    {
        return $this->hasOne(DGR::class, 'awb_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function charge()
    {
        return $this->hasOne(AWBCharge::class, 'awb_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'awb_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => "AWB {$this->awb_number} was {$eventName}");
    }
}
