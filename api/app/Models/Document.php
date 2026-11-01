<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'type', 'path', 'mime_type', 'size_bytes',
        'awb_id', 'dgr_id', 'flight_id', 'uploaded_by',
    ];

    public function awb()
    {
        return $this->belongsTo(AWB::class, 'awb_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
