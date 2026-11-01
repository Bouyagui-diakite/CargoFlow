<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('flight_number', 10)->unique();
            $table->char('origin', 3);
            $table->char('destination', 3);
            $table->dateTime('departure_at');
            $table->dateTime('arrival_at');
            $table->string('aircraft_type', 30);
            $table->decimal('capacity_kg', 10, 2);
            $table->decimal('volume_m3', 8, 2)->nullable();
            $table->unsignedTinyInteger('uld_positions')->nullable();
            $table->enum('status', ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled'])->default('scheduled');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->index(['status', 'departure_at']);
            $table->index(['origin', 'destination']);
        });

        Schema::create('awbs', function (Blueprint $table) {
            $table->id();
            $table->string('awb_number', 12)->unique();     // e.g. 235-12847391
            $table->char('origin', 3);
            $table->char('destination', 3);

            // Shipper
            $table->string('shipper_name');
            $table->text('shipper_address');
            $table->char('shipper_country', 2);
            $table->string('shipper_account')->nullable();

            // Consignee
            $table->string('consignee_name');
            $table->text('consignee_address');
            $table->char('consignee_country', 2);
            $table->string('consignee_account')->nullable();

            // Cargo
            $table->unsignedSmallInteger('pieces');
            $table->decimal('weight_kg', 10, 2);
            $table->decimal('volume_m3', 8, 2)->nullable();
            $table->string('commodity');
            $table->json('special_handling')->nullable();

            // DGR flag
            $table->boolean('is_dgr')->default(false);

            // Status
            $table->enum('status', ['received', 'processing', 'loaded', 'in_transit', 'delivered', 'blocked'])
                  ->default('received');
            $table->text('block_reason')->nullable();

            // Relations
            $table->foreignId('flight_id')->nullable()->constrained('flights')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');

            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('awb_number');
            $table->index('is_dgr');
        });

        Schema::create('dgr_declarations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('awb_id')->constrained('awbs')->cascadeOnDelete();

            // IATA DGR fields
            $table->string('dgr_class', 5);               // e.g. 2.2, 6.1
            $table->string('un_number', 6);               // e.g. UN1993
            $table->string('proper_shipping_name');
            $table->char('packing_group', 3)->nullable(); // I, II, III
            $table->string('erg_code', 5);                // e.g. 3L, 6C
            $table->string('net_quantity', 30);
            $table->unsignedSmallInteger('number_of_packages');
            $table->string('packaging_type')->nullable();

            // Approval
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->boolean('notoc_generated')->default(false);
            $table->string('notoc_ref')->nullable();
            $table->string('notoc_path')->nullable();     // path to generated PDF
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            // Contact
            $table->string('emergency_contact', 30);
            $table->text('remarks')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index('status');
            $table->index('un_number');
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type');           // awb, dgr, notoc, certificate, packing_list
            $table->string('path');           // storage path
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->foreignId('awb_id')->nullable()->constrained('awbs')->nullOnDelete();
            $table->foreignId('dgr_id')->nullable()->constrained('dgr_declarations')->nullOnDelete();
            $table->foreignId('flight_id')->nullable()->constrained('flights')->nullOnDelete();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
        Schema::dropIfExists('dgr_declarations');
        Schema::dropIfExists('awbs');
        Schema::dropIfExists('flights');
    }
};
