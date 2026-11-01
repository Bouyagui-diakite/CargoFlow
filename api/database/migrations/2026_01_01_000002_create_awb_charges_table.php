<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('awb_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('awb_id')->constrained('awbs')->cascadeOnDelete();

            // Charge breakdown (MRU)
            $table->decimal('freight_charge',  10, 2)->default(0); // weight × rate/kg
            $table->decimal('handling_fee',    10, 2)->default(0); // ground handling
            $table->decimal('security_levy',   10, 2)->default(0); // security screening
            $table->decimal('fuel_surcharge',  10, 2)->default(0); // 20% of freight
            $table->decimal('dgr_surcharge',   10, 2)->default(0); // extra for DGR shipments
            $table->decimal('other_charges',   10, 2)->default(0);
            $table->decimal('total',           10, 2)->default(0);

            $table->string('currency', 3)->default('MRU');
            $table->enum('status', ['pending', 'paid', 'partial', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['awb_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('awb_charges');
    }
};
