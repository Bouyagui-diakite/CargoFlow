<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            // (flight_number, origin) blocks the same flight on different dates — wrong.
            // (flight_number, departure_at) correctly identifies each rotation.
            $table->dropUnique(['flight_number', 'origin']);
            $table->unique(['flight_number', 'departure_at']);
        });
    }

    public function down(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            $table->dropUnique(['flight_number', 'departure_at']);
            $table->unique(['flight_number', 'origin']);
        });
    }
};
