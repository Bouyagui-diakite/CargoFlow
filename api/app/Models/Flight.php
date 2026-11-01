<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Flight extends Model
{
    protected $fillable = [
        'flight_number', 'origin', 'destination',
        'departure_at', 'arrival_at',
        'aircraft_type', 'capacity_kg', 'volume_m3', 'uld_positions',
        'status', 'created_by',
    ];

    protected $casts = [
        'departure_at' => 'datetime',
        'arrival_at'   => 'datetime',
        'capacity_kg'  => 'decimal:2',
        'volume_m3'    => 'decimal:2',
    ];

    const STATUSES = ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled'];

    public function awbs()
    {
        return $this->hasMany(AWB::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getLoadedKgAttribute(): float
    {
        return $this->awbs()->sum('weight_kg');
    }

    public function getLoadPercentageAttribute(): float
    {
        if ($this->capacity_kg <= 0) return 0;
        return round($this->loaded_kg / $this->capacity_kg * 100, 1);
    }

    public function isOverloaded(): bool
    {
        return $this->loaded_kg > $this->capacity_kg;
    }

    public function hasDGR(): bool
    {
        return $this->awbs()->where('is_dgr', true)->exists();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => "Flight {$this->flight_number} was {$eventName}");
    }
}
