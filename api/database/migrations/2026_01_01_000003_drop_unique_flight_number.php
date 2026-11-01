<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            // Allow duplicate flight numbers: same number can be ARR and DEP
            $table->dropUnique(['flight_number']);
            // New unique: flight_number + origin (ARR and DEP have different origins)
            $table->unique(['flight_number', 'origin']);
        });
    }

    public function down(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            $table->dropUnique(['flight_number', 'origin']);
            $table->unique('flight_number');
        });
    }
};
