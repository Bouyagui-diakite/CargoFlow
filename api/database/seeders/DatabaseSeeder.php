<?php

namespace Database\Seeders;

use App\Models\AWB;
use App\Models\AWBCharge;
use App\Models\DGR;
use App\Models\Flight;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Permissions ───────────────────────────────────────────────────────
        $permissions = [
            'create_awb', 'edit_awb', 'delete_awb',
            'approve_dgr', 'create_dgr', 'manage_users', 'view_logs', 'manage_flights',
            'view_dashboard', 'block_shipment', 'process_shipment',
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        // ── Roles ─────────────────────────────────────────────────────────────
        $admin  = Role::firstOrCreate(['name' => 'admin',          'guard_name' => 'web']);
        $super  = Role::firstOrCreate(['name' => 'supervisor',     'guard_name' => 'web']);
        $agent  = Role::firstOrCreate(['name' => 'cargo_agent',    'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'ground_handler', 'guard_name' => 'web']);

        $admin->syncPermissions($permissions);
        $super->syncPermissions(['create_awb', 'edit_awb', 'approve_dgr', 'create_dgr', 'view_logs', 'manage_flights', 'view_dashboard', 'process_shipment']);
        $agent->syncPermissions(['create_awb', 'edit_awb']);

        // ── Users ─────────────────────────────────────────────────────────────
        $u1 = User::firstOrCreate(['email' => 'admin@cargoflow.mr'], [
            'name' => 'Omar Diallo', 'password' => Hash::make('admin123'), 'status' => 'active',
        ]);
        $u1->syncRoles(['admin']);

        $u2 = User::firstOrCreate(['email' => 'super@cargoflow.mr'], [
            'name' => 'Fatima Mint Ahmed', 'password' => Hash::make('super123'), 'status' => 'active',
        ]);
        $u2->syncRoles(['supervisor']);

        $u3 = User::firstOrCreate(['email' => 'agent@cargoflow.mr'], [
            'name' => 'Moussa Kane', 'password' => Hash::make('agent123'), 'status' => 'active',
        ]);
        $u3->syncRoles(['cargo_agent']);

        $u4 = User::firstOrCreate(['email' => 'agent2@cargoflow.mr'], [
            'name' => 'Aissata Barry', 'password' => Hash::make('agent123'), 'status' => 'active',
        ]);
        $u4->syncRoles(['cargo_agent']);

        // ────────────────────────────────────────────────────────────────────
        // FLIGHTS
        // Rule: lower number = arrival into NKC, higher number = departure from NKC
        // Rule: lower number = ARR (into NKC), higher number = DEP (from NKC)
        // Exceptions: TK571 and TK597 operate in BOTH directions (same flight number)
        // ────────────────────────────────────────────────────────────────────

        // ── TURKISH AIRLINES (IST ↔ NKC) ─────────────────────────────────────

        // TK571 — ARRIVAL (IST→NKC) — same number as departure (exception)
        $tk571_arr = Flight::firstOrCreate(['flight_number' => 'TK571', 'origin' => 'IST'], [
            'destination'  => 'NKC',
            'departure_at' => now()->addDays(2)->setTime(23, 55),
            'arrival_at'   => now()->addDays(3)->setTime(4, 45),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 18000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // TK571 — DEPARTURE (NKC→IST) — same number as arrival (exception)
        $tk571_dep = Flight::firstOrCreate(['flight_number' => 'TK571', 'origin' => 'NKC'], [
            'destination'  => 'IST',
            'departure_at' => now()->addDays(3)->setTime(6, 0),
            'arrival_at'   => now()->addDays(3)->setTime(12, 45),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 18000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // TK583 — ARRIVAL (IST→NKC)  |  TK584 — DEPARTURE (NKC→IST)
        $tk583 = Flight::firstOrCreate(['flight_number' => 'TK583', 'origin' => 'IST'], [
            'destination'  => 'NKC',
            'departure_at' => now()->subHours(6)->setTime(0, 30),
            'arrival_at'   => now()->setTime(5, 15),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 18000,
            'status' => 'arrived', 'created_by' => $u1->id,
        ]);

        $tk584 = Flight::firstOrCreate(['flight_number' => 'TK584', 'origin' => 'NKC'], [
            'destination'  => 'IST',
            'departure_at' => now()->setTime(6, 30),
            'arrival_at'   => now()->setTime(13, 20),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 18000,
            'status' => 'departed', 'created_by' => $u1->id,
        ]);

        // TK585 — ARRIVAL (IST→NKC)  |  TK586 — DEPARTURE (NKC→IST)
        $tk585 = Flight::firstOrCreate(['flight_number' => 'TK585', 'origin' => 'IST'], [
            'destination'  => 'NKC',
            'departure_at' => now()->addDay()->setTime(1, 15),
            'arrival_at'   => now()->addDay()->setTime(6, 0),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 18000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        $tk586 = Flight::firstOrCreate(['flight_number' => 'TK586', 'origin' => 'NKC'], [
            'destination'  => 'IST',
            'departure_at' => now()->addDay()->setTime(7, 30),
            'arrival_at'   => now()->addDay()->setTime(14, 15),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 18000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // TK597 — ARRIVAL (IST→NKC) — same number as departure (exception)
        $tk597_arr = Flight::firstOrCreate(['flight_number' => 'TK597', 'origin' => 'IST'], [
            'destination'  => 'NKC',
            'departure_at' => now()->addDays(3)->setTime(20, 30),
            'arrival_at'   => now()->addDays(4)->setTime(1, 15),
            'aircraft_type' => 'B737-800F', 'capacity_kg' => 22000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // TK597 — DEPARTURE (NKC→IST) — same number as arrival (exception)
        $tk597 = Flight::firstOrCreate(['flight_number' => 'TK597', 'origin' => 'NKC'], [
            'destination'  => 'IST',
            'departure_at' => now()->addDays(4)->setTime(3, 0),
            'arrival_at'   => now()->addDays(4)->setTime(9, 45),
            'aircraft_type' => 'B737-800F', 'capacity_kg' => 22000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // ── ROYAL AIR MAROC (CMN ↔ NKC) ──────────────────────────────────────
        // AT510 = DEPARTURE (NKC→CMN) | AT511 = ARRIVAL (CMN→NKC)
        $at510 = Flight::firstOrCreate(['flight_number' => 'AT510'], [
            'origin' => 'NKC', 'destination' => 'CMN',        // departure from NKC
            'departure_at' => now()->setTime(8, 0),
            'arrival_at'   => now()->setTime(11, 30),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 15000,
            'status' => 'departed', 'created_by' => $u1->id,
        ]);

        $at511 = Flight::firstOrCreate(['flight_number' => 'AT511'], [
            'origin' => 'CMN', 'destination' => 'NKC',        // arrival into NKC
            'departure_at' => now()->setTime(12, 30),
            'arrival_at'   => now()->setTime(16, 0),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 15000,
            'status' => 'boarding', 'created_by' => $u1->id,
        ]);

        // AT520 = DEPARTURE (NKC→CMN) | AT521 = ARRIVAL (CMN→NKC)
        $at520 = Flight::firstOrCreate(['flight_number' => 'AT520'], [
            'origin' => 'NKC', 'destination' => 'CMN',        // departure from NKC
            'departure_at' => now()->addDays(2)->setTime(6, 0),
            'arrival_at'   => now()->addDays(2)->setTime(9, 30),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 15000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        $at521 = Flight::firstOrCreate(['flight_number' => 'AT521'], [
            'origin' => 'CMN', 'destination' => 'NKC',        // arrival into NKC
            'departure_at' => now()->addDays(2)->setTime(10, 30),
            'arrival_at'   => now()->addDays(2)->setTime(14, 0),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 15000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // ── AIR ALGERIE (ALG ↔ NKC) ──────────────────────────────────────────
        $ah4014 = Flight::firstOrCreate(['flight_number' => 'AH4014'], [
            'origin' => 'ALG', 'destination' => 'NKC',        // arrival
            'departure_at' => now()->setTime(8, 30),
            'arrival_at'   => now()->setTime(11, 45),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 14000,
            'status' => 'arrived', 'created_by' => $u1->id,
        ]);

        $ah4015 = Flight::firstOrCreate(['flight_number' => 'AH4015'], [
            'origin' => 'NKC', 'destination' => 'ALG',        // departure
            'departure_at' => now()->setTime(12, 45),
            'arrival_at'   => now()->setTime(16, 0),
            'aircraft_type' => 'B737-800', 'capacity_kg' => 14000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // ── TUNIS AIR (TUN ↔ NKC) ─────────────────────────────────────────────
        $tu563 = Flight::firstOrCreate(['flight_number' => 'TU563'], [
            'origin' => 'TUN', 'destination' => 'NKC',        // arrival
            'departure_at' => now()->addDay()->setTime(7, 45),
            'arrival_at'   => now()->addDay()->setTime(10, 30),
            'aircraft_type' => 'A320', 'capacity_kg' => 12000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        $tu564 = Flight::firstOrCreate(['flight_number' => 'TU564'], [
            'origin' => 'NKC', 'destination' => 'TUN',        // departure
            'departure_at' => now()->addDay()->setTime(11, 30),
            'arrival_at'   => now()->addDay()->setTime(14, 15),
            'aircraft_type' => 'A320', 'capacity_kg' => 12000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // ── BINTER CANARIAS (LPA ↔ NKC) ──────────────────────────────────────
        $nt1804 = Flight::firstOrCreate(['flight_number' => 'NT1804'], [
            'origin' => 'LPA', 'destination' => 'NKC',        // arrival
            'departure_at' => now()->setTime(10, 0),
            'arrival_at'   => now()->setTime(12, 45),
            'aircraft_type' => 'ATR72-600', 'capacity_kg' => 6500,
            'status' => 'arrived', 'created_by' => $u1->id,
        ]);

        $nt1805 = Flight::firstOrCreate(['flight_number' => 'NT1805'], [
            'origin' => 'NKC', 'destination' => 'LPA',        // departure
            'departure_at' => now()->setTime(13, 45),
            'arrival_at'   => now()->setTime(16, 30),
            'aircraft_type' => 'ATR72-600', 'capacity_kg' => 6500,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // ── MAURITANIA AIRLINES (L6) ──────────────────────────────────────────
        // L6116 = DEPARTURE (NKC→CDG) | L6117 = ARRIVAL (CDG→NKC)
        $l6116 = Flight::firstOrCreate(['flight_number' => 'L6116'], [
            'origin' => 'NKC', 'destination' => 'CDG',        // departure from NKC
            'departure_at' => now()->subDay()->setTime(23, 0),
            'arrival_at'   => now()->setTime(6, 30),
            'aircraft_type' => 'B737-700', 'capacity_kg' => 14000,
            'status' => 'departed', 'created_by' => $u1->id,
        ]);

        $l6117 = Flight::firstOrCreate(['flight_number' => 'L6117'], [
            'origin' => 'CDG', 'destination' => 'NKC',        // arrival into NKC
            'departure_at' => now()->setTime(22, 30),
            'arrival_at'   => now()->addDay()->setTime(3, 0),
            'aircraft_type' => 'B737-700', 'capacity_kg' => 14000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // ── AIR SENEGAL (DSS ↔ NKC) ──────────────────────────────────────────
        $hc205 = Flight::firstOrCreate(['flight_number' => 'HC205'], [
            'origin' => 'DSS', 'destination' => 'NKC',        // arrival
            'departure_at' => now()->setTime(11, 0),
            'arrival_at'   => now()->setTime(13, 0),
            'aircraft_type' => 'A319', 'capacity_kg' => 10000,
            'status' => 'boarding', 'created_by' => $u1->id,
        ]);

        $hc206 = Flight::firstOrCreate(['flight_number' => 'HC206'], [
            'origin' => 'NKC', 'destination' => 'DSS',        // departure
            'departure_at' => now()->setTime(14, 0),
            'arrival_at'   => now()->setTime(16, 0),
            'aircraft_type' => 'A319', 'capacity_kg' => 10000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // ── SWIFT AIR (LPA ↔ NKC — cargo charter) ────────────────────────────
        // WT192 = DEPARTURE (NKC→LPA) | WT193 = ARRIVAL (LPA→NKC)
        $wt192 = Flight::firstOrCreate(['flight_number' => 'WT192'], [
            'origin' => 'NKC', 'destination' => 'LPA',        // departure from NKC
            'departure_at' => now()->addDay()->setTime(2, 0),
            'arrival_at'   => now()->addDay()->setTime(4, 45),
            'aircraft_type' => 'B737-400F', 'capacity_kg' => 20000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        $wt193 = Flight::firstOrCreate(['flight_number' => 'WT193'], [
            'origin' => 'LPA', 'destination' => 'NKC',        // arrival into NKC
            'departure_at' => now()->addDay()->setTime(6, 0),
            'arrival_at'   => now()->addDay()->setTime(8, 45),
            'aircraft_type' => 'B737-400F', 'capacity_kg' => 20000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // ── ASKY AIRLINE (LFW ↔ NKC) ─────────────────────────────────────────
        $kp014 = Flight::firstOrCreate(['flight_number' => 'KP014'], [
            'origin' => 'LFW', 'destination' => 'NKC',        // arrival
            'departure_at' => now()->addDay()->setTime(9, 30),
            'arrival_at'   => now()->addDay()->setTime(13, 15),
            'aircraft_type' => 'B737-700', 'capacity_kg' => 13000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        $kp015 = Flight::firstOrCreate(['flight_number' => 'KP015'], [
            'origin' => 'NKC', 'destination' => 'LFW',        // departure
            'departure_at' => now()->addDay()->setTime(14, 15),
            'arrival_at'   => now()->addDay()->setTime(18, 0),
            'aircraft_type' => 'B737-700', 'capacity_kg' => 13000,
            'status' => 'scheduled', 'created_by' => $u1->id,
        ]);

        // ────────────────────────────────────────────────────────────────────
        // AWBs — realistic cargo for each airline/route
        // Prefix convention: TK=235, AT=147, AH=124, TU=221,
        //   NT=474, L6=495, HC=490, WT192=221/WT193=574, KP=032
        // ────────────────────────────────────────────────────────────────────

        // ── TK583 (IST→NKC) arrived ───────────────────────────────────────────
        AWB::firstOrCreate(['awb_number' => '235-58301001'], [
            'origin' => 'IST', 'destination' => 'NKC',
            'shipper_name'    => 'Arçelik A.Ş.', 'shipper_address' => 'Karaağaç Cad. No:2, Sütlüce, Istanbul', 'shipper_country' => 'TR',
            'consignee_name'  => 'Mauritanie Électroménager SARL', 'consignee_address' => 'Ksar, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 24, 'weight_kg' => 3840, 'volume_m3' => 18.5,
            'commodity' => 'Household Appliances (Refrigerators)',
            'special_handling' => ['HEA'], 'is_dgr' => false,
            'status' => 'delivered', 'flight_id' => $tk583->id, 'created_by' => $u3->id,
        ]);

        AWB::firstOrCreate(['awb_number' => '235-58301002'], [
            'origin' => 'IST', 'destination' => 'NKC',
            'shipper_name'    => 'Vestel Electronics', 'shipper_address' => 'Organize Sanayi Bölgesi, Manisa', 'shipper_country' => 'TR',
            'consignee_name'  => 'NMC Telecom', 'consignee_address' => 'Av. Kennedy, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 60, 'weight_kg' => 1200, 'volume_m3' => 8.4,
            'commodity' => 'Television Sets & Electronics',
            'special_handling' => ['ELE'], 'is_dgr' => false,
            'status' => 'delivered', 'flight_id' => $tk583->id, 'created_by' => $u4->id,
        ]);

        AWB::firstOrCreate(['awb_number' => '235-58301003'], [
            'origin' => 'IST', 'destination' => 'NKC',
            'shipper_name'    => 'Pharmaceutical Distributors TR', 'shipper_address' => 'Bağcılar, Istanbul', 'shipper_country' => 'TR',
            'consignee_name'  => 'Ministère de la Santé — Mauritanie', 'consignee_address' => 'BP 232, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 48, 'weight_kg' => 680, 'volume_m3' => 4.2,
            'commodity' => 'Pharmaceutical Products (Vaccines)',
            'special_handling' => ['MED', 'PER', 'PIL'], 'is_dgr' => false,
            'status' => 'delivered', 'flight_id' => $tk583->id, 'created_by' => $u3->id,
        ]);

        // ── TK584 (NKC→IST) departed ─────────────────────────────────────────
        AWB::firstOrCreate(['awb_number' => '235-58401001'], [
            'origin' => 'NKC', 'destination' => 'IST',
            'shipper_name'    => 'SMCP Mauritania Fisheries', 'shipper_address' => 'Port de Pêche, Nouakchott', 'shipper_country' => 'MR',
            'consignee_name'  => 'İstanbul Balık Pazarı', 'consignee_address' => 'Kapalıçarşı, Istanbul', 'consignee_country' => 'TR',
            'pieces' => 120, 'weight_kg' => 6000, 'volume_m3' => 28.0,
            'commodity' => 'Frozen Octopus & Squid',
            'special_handling' => ['PER', 'ICE'], 'is_dgr' => false,
            'status' => 'in_transit', 'flight_id' => $tk584->id, 'created_by' => $u3->id,
        ]);

        AWB::firstOrCreate(['awb_number' => '235-58401002'], [
            'origin' => 'NKC', 'destination' => 'IST',
            'shipper_name'    => 'Mauritanie Artisanat Export', 'shipper_address' => 'Marché Capitale, Nouakchott', 'shipper_country' => 'MR',
            'consignee_name'  => 'Bazar Exotique Istanbul', 'consignee_address' => 'Grand Bazaar, Istanbul', 'consignee_country' => 'TR',
            'pieces' => 85, 'weight_kg' => 940, 'volume_m3' => 6.8,
            'commodity' => 'Handcrafted Leather Goods & Textiles',
            'special_handling' => [], 'is_dgr' => false,
            'status' => 'in_transit', 'flight_id' => $tk584->id, 'created_by' => $u4->id,
        ]);

        // ── TK585 (IST→NKC) scheduled ────────────────────────────────────────
        $awb_tk585_1 = AWB::firstOrCreate(['awb_number' => '235-58501001'], [
            'origin' => 'IST', 'destination' => 'NKC',
            'shipper_name'    => 'Tekfen Construction Turkey', 'shipper_address' => 'Levent, Istanbul', 'shipper_country' => 'TR',
            'consignee_name'  => 'SNIM Mines de Mauritanie', 'consignee_address' => 'BP 42, Zouerate', 'consignee_country' => 'MR',
            'pieces' => 18, 'weight_kg' => 9200, 'volume_m3' => 12.0,
            'commodity' => 'Mining Drilling Equipment & Spare Parts',
            'special_handling' => ['HEA'], 'is_dgr' => false,
            'status' => 'processing', 'flight_id' => $tk585->id, 'created_by' => $u3->id,
        ]);

        $awb_tk585_2 = AWB::firstOrCreate(['awb_number' => '235-58501002'], [
            'origin' => 'IST', 'destination' => 'NKC',
            'shipper_name'    => 'Aksa Akrilik Kimya', 'shipper_address' => 'Yalova, Turkey', 'shipper_country' => 'TR',
            'consignee_name'  => 'SOMAGAZ Mauritanie', 'consignee_address' => 'Zone Industrielle, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 30, 'weight_kg' => 4500, 'volume_m3' => 22.0,
            'commodity' => 'Propane Gas Cylinders',
            'special_handling' => ['CAO'], 'is_dgr' => true,
            'status' => 'received', 'flight_id' => $tk585->id, 'created_by' => $u4->id,
        ]);

        // ── AT510 (NKC→CMN) departure — exports from Mauritania ─────────────
        AWB::firstOrCreate(['awb_number' => '147-51001001'], [
            'origin' => 'NKC', 'destination' => 'CMN',
            'shipper_name'    => 'Mauritanie Pêche Export', 'shipper_address' => 'Zone Franche, Nouakchott', 'shipper_country' => 'MR',
            'consignee_name'  => 'Casablanca Poissonnerie Centrale', 'consignee_address' => 'Marché Central, Casablanca', 'consignee_country' => 'MA',
            'pieces' => 80, 'weight_kg' => 4800, 'volume_m3' => 20.0,
            'commodity' => 'Frozen Yellowfin Tuna',
            'special_handling' => ['PER', 'ICE'], 'is_dgr' => false,
            'status' => 'in_transit', 'flight_id' => $at510->id, 'created_by' => $u3->id,
        ]);

        AWB::firstOrCreate(['awb_number' => '147-51001002'], [
            'origin' => 'NKC', 'destination' => 'CMN',
            'shipper_name'    => 'SNIM Direction Commerciale', 'shipper_address' => 'Immeuble SNIM, Nouakchott', 'shipper_country' => 'MR',
            'consignee_name'  => 'OCP Group Morocco', 'consignee_address' => 'Bd de la Grande Ceinture, Casablanca', 'consignee_country' => 'MA',
            'pieces' => 12, 'weight_kg' => 5200, 'volume_m3' => 4.0,
            'commodity' => 'Iron Ore Samples for Analysis',
            'special_handling' => ['HEA'], 'is_dgr' => false,
            'status' => 'in_transit', 'flight_id' => $at510->id, 'created_by' => $u4->id,
        ]);

        // ── AT511 (CMN→NKC) arrival — imports to Mauritania ──────────────────
        AWB::firstOrCreate(['awb_number' => '147-51101001'], [
            'origin' => 'CMN', 'destination' => 'NKC',
            'shipper_name'    => 'OCP Group Morocco', 'shipper_address' => 'Bd de la Grande Ceinture, Casablanca', 'shipper_country' => 'MA',
            'consignee_name'  => 'Mauritanie Agriculture SA', 'consignee_address' => 'Rosso, Trarza', 'consignee_country' => 'MR',
            'pieces' => 40, 'weight_kg' => 8000, 'volume_m3' => 12.0,
            'commodity' => 'DAP Fertilizer (Diammonium Phosphate)',
            'special_handling' => [], 'is_dgr' => false,
            'status' => 'loaded', 'flight_id' => $at511->id, 'created_by' => $u3->id,
        ]);

        AWB::firstOrCreate(['awb_number' => '147-51101002'], [
            'origin' => 'CMN', 'destination' => 'NKC',
            'shipper_name'    => 'Royal Air Maroc Cargo', 'shipper_address' => 'Aéroport CMN, Casablanca', 'shipper_country' => 'MA',
            'consignee_name'  => 'Electro MAUR Distribution', 'consignee_address' => 'Av. Gamal Nasser, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 32, 'weight_kg' => 960, 'volume_m3' => 5.8,
            'commodity' => 'Air Conditioning Units',
            'special_handling' => [], 'is_dgr' => false,
            'status' => 'loaded', 'flight_id' => $at511->id, 'created_by' => $u4->id,
        ]);

        // ── AH4014 (ALG→NKC) arrived ─────────────────────────────────────────
        AWB::firstOrCreate(['awb_number' => '124-40141001'], [
            'origin' => 'ALG', 'destination' => 'NKC',
            'shipper_name'    => 'Sonatrach International', 'shipper_address' => 'Djenane el-Malik, Hydra, Alger', 'shipper_country' => 'DZ',
            'consignee_name'  => 'PETROSEN Mauritanie', 'consignee_address' => 'BP 5681, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 14, 'weight_kg' => 5600, 'volume_m3' => 8.4,
            'commodity' => 'Oilfield Wellhead Equipment',
            'special_handling' => ['HEA'], 'is_dgr' => false,
            'status' => 'received', 'flight_id' => $ah4014->id, 'created_by' => $u4->id,
        ]);

        $awb_ah_dgr = AWB::firstOrCreate(['awb_number' => '124-40141002'], [
            'origin' => 'ALG', 'destination' => 'NKC',
            'shipper_name'    => 'Batimat Algérie', 'shipper_address' => 'Zone Industrielle Rouiba, Alger', 'shipper_country' => 'DZ',
            'consignee_name'  => 'BTP Mauritanie SARL', 'consignee_address' => 'Ksar, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 20, 'weight_kg' => 2200, 'volume_m3' => 14.0,
            'commodity' => 'Waterproofing Chemical Coatings',
            'special_handling' => [], 'is_dgr' => true,
            'status' => 'received', 'flight_id' => $ah4014->id, 'created_by' => $u3->id,
        ]);

        // ── NT1804 (LPA→NKC) arrived ─────────────────────────────────────────
        AWB::firstOrCreate(['awb_number' => '401-18041001'], [
            'origin' => 'LPA', 'destination' => 'NKC',
            'shipper_name'    => 'Mercadona Exportación', 'shipper_address' => 'Pol. Ind. Táctica, Las Palmas', 'shipper_country' => 'ES',
            'consignee_name'  => 'Mauritanie Grande Distribution', 'consignee_address' => 'Basra, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 300, 'weight_kg' => 2700, 'volume_m3' => 15.0,
            'commodity' => 'Fresh Fruits & Vegetables (Mixed)',
            'special_handling' => ['PER'], 'is_dgr' => false,
            'status' => 'received', 'flight_id' => $nt1804->id, 'created_by' => $u4->id,
        ]);

        // ── NT1805 (NKC→LPA) scheduled ───────────────────────────────────────
        AWB::firstOrCreate(['awb_number' => '401-18051001'], [
            'origin' => 'NKC', 'destination' => 'LPA',
            'shipper_name'    => 'Polyhalieutique SA', 'shipper_address' => 'Km 5, Route de l\'Aéroport, Nouakchott', 'shipper_country' => 'MR',
            'consignee_name'  => 'Mercapalmas Las Palmas', 'consignee_address' => 'Muelle Santa Catalina, Las Palmas', 'consignee_country' => 'ES',
            'pieces' => 180, 'weight_kg' => 7200, 'volume_m3' => 32.0,
            'commodity' => 'Frozen Sardinella & Carangidae',
            'special_handling' => ['PER', 'ICE'], 'is_dgr' => false,
            'status' => 'processing', 'flight_id' => $nt1805->id, 'created_by' => $u3->id,
        ]);

        // ── L6116 (NKC→CDG) departure — exports from Mauritania ─────────────
        AWB::firstOrCreate(['awb_number' => '066-11601001'], [
            'origin' => 'NKC', 'destination' => 'CDG',
            'shipper_name'    => 'SAMIN Mines d\'Or', 'shipper_address' => 'Tasiast, Inchiri', 'shipper_country' => 'MR',
            'consignee_name'  => 'Bureau Veritas Precious Metals', 'consignee_address' => '67/71 Bd du Château, Neuilly-sur-Seine', 'consignee_country' => 'FR',
            'pieces' => 1, 'weight_kg' => 45, 'volume_m3' => 0.1,
            'commodity' => 'Gold Doré Bars — Certified Assay',
            'special_handling' => ['VAL', 'PRI'], 'is_dgr' => false,
            'status' => 'in_transit', 'flight_id' => $l6116->id, 'created_by' => $u3->id,
        ]);

        AWB::firstOrCreate(['awb_number' => '066-11601002'], [
            'origin' => 'NKC', 'destination' => 'CDG',
            'shipper_name'    => 'Mauritanie Artisanat Export', 'shipper_address' => 'Marché Capitale, Nouakchott', 'shipper_country' => 'MR',
            'consignee_name'  => 'Galeries Lafayette Paris', 'consignee_address' => '40 Bd Haussmann, Paris 75009', 'consignee_country' => 'FR',
            'pieces' => 120, 'weight_kg' => 1400, 'volume_m3' => 9.5,
            'commodity' => 'Handcrafted Leather Goods & Textiles',
            'special_handling' => [], 'is_dgr' => false,
            'status' => 'in_transit', 'flight_id' => $l6116->id, 'created_by' => $u4->id,
        ]);

        // ── L6117 (CDG→NKC) arrival — imports to Mauritania ─────────────────
        AWB::firstOrCreate(['awb_number' => '066-11701001'], [
            'origin' => 'CDG', 'destination' => 'NKC',
            'shipper_name'    => 'Ambassade de Mauritanie en France', 'shipper_address' => '5 Rue de Montevideo, Paris 75016', 'shipper_country' => 'FR',
            'consignee_name'  => 'Ministère des Affaires Étrangères', 'consignee_address' => 'Ilot K, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 4, 'weight_kg' => 120, 'volume_m3' => 0.8,
            'commodity' => 'Diplomatic Pouch & Official Documents',
            'special_handling' => ['DIP', 'PRI'], 'is_dgr' => false,
            'status' => 'received', 'flight_id' => $l6117->id, 'created_by' => $u3->id,
        ]);

        AWB::firstOrCreate(['awb_number' => '066-11701002'], [
            'origin' => 'CDG', 'destination' => 'NKC',
            'shipper_name'    => 'UNOPS Procurement Division', 'shipper_address' => '20 Rue Adrien-Lachenal, Genève', 'shipper_country' => 'CH',
            'consignee_name'  => 'UNHCR Mauritanie', 'consignee_address' => 'Ilot V, Tevragh-Zeina, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 150, 'weight_kg' => 4200, 'volume_m3' => 22.0,
            'commodity' => 'UNHCR Relief Items — Shelter Kits',
            'special_handling' => ['HUM'], 'is_dgr' => false,
            'status' => 'received', 'flight_id' => $l6117->id, 'created_by' => $u4->id,
        ]);

        // ── HC205 (DSS→NKC) boarding ─────────────────────────────────────────
        AWB::firstOrCreate(['awb_number' => '269-20501001'], [
            'origin' => 'DSS', 'destination' => 'NKC',
            'shipper_name'    => 'SONATEL Sénégal', 'shipper_address' => 'Route du Front de Terre, Dakar', 'shipper_country' => 'SN',
            'consignee_name'  => 'Mauritel SA', 'consignee_address' => 'Av. du Roi Fayçal, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 22, 'weight_kg' => 880, 'volume_m3' => 5.2,
            'commodity' => 'GSM Network Equipment (Base Stations)',
            'special_handling' => ['ELE'], 'is_dgr' => false,
            'status' => 'loaded', 'flight_id' => $hc205->id, 'created_by' => $u4->id,
        ]);

        // ── WT192 (NKC→LPA) departure — exports from Mauritania ─────────────
        AWB::firstOrCreate(['awb_number' => '453-19201001'], [
            'origin' => 'NKC', 'destination' => 'LPA',
            'shipper_name'    => 'Mauritanie Pêche Artisanale', 'shipper_address' => 'Port Artisanal, Nouakchott', 'shipper_country' => 'MR',
            'consignee_name'  => 'Lonja del Pescado Las Palmas', 'consignee_address' => 'Muelle Santa Catalina, Las Palmas', 'consignee_country' => 'ES',
            'pieces' => 320, 'weight_kg' => 14200, 'volume_m3' => 52.0,
            'commodity' => 'Fresh Atlantic Octopus & Cuttlefish',
            'special_handling' => ['PER', 'ICE'], 'is_dgr' => false,
            'status' => 'processing', 'flight_id' => $wt192->id, 'created_by' => $u3->id,
        ]);

        // ── WT193 (LPA→NKC) arrival — imports to Mauritania ─────────────────
        $awb_wt192_dgr = AWB::firstOrCreate(['awb_number' => '453-19201002'], [
            'origin' => 'LPA', 'destination' => 'NKC',
            'shipper_name'    => 'REPSOL España', 'shipper_address' => 'Méndez Álvaro 44, Madrid', 'shipper_country' => 'ES',
            'consignee_name'  => 'Chinguetti Petroleum Ltd', 'consignee_address' => 'BP 5059, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 8, 'weight_kg' => 12400, 'volume_m3' => 18.0,
            'commodity' => 'Chemical Additives for Petroleum Refining',
            'special_handling' => ['CAO'], 'is_dgr' => true,
            'status' => 'received', 'flight_id' => $wt193->id, 'created_by' => $u4->id,
        ]);

        // ── KP014 (LFW→NKC) scheduled ───────────────────────────────────────
        AWB::firstOrCreate(['awb_number' => '604-01401001'], [
            'origin' => 'LFW', 'destination' => 'NKC',
            'shipper_name'    => 'ECOBANK Togo Regional', 'shipper_address' => '20 Rue du Commerce, Lomé', 'shipper_country' => 'TG',
            'consignee_name'  => 'Banque Centrale de Mauritanie', 'consignee_address' => 'Av. de l\'Indépendance, Nouakchott', 'consignee_country' => 'MR',
            'pieces' => 2, 'weight_kg' => 180, 'volume_m3' => 0.5,
            'commodity' => 'Banknotes & Secure Documents',
            'special_handling' => ['VAL', 'PRI'], 'is_dgr' => false,
            'status' => 'processing', 'flight_id' => $kp014->id, 'created_by' => $u3->id,
        ]);

        // ── TK586 (NKC→IST) scheduled — BLOCKED ──────────────────────────────
        AWB::firstOrCreate(['awb_number' => '235-58601001'], [
            'origin' => 'NKC', 'destination' => 'IST',
            'shipper_name'    => 'Mauritanie Gypse Export', 'shipper_address' => 'Km 10, Route de Rosso', 'shipper_country' => 'MR',
            'consignee_name'  => 'Nuh Çimento Turkey', 'consignee_address' => 'Hereke, Kocaeli', 'consignee_country' => 'TR',
            'pieces' => 30, 'weight_kg' => 18000, 'volume_m3' => 20.0,
            'commodity' => 'Crude Gypsum (Industrial Grade)',
            'special_handling' => ['HEA'], 'is_dgr' => false,
            'status' => 'blocked',
            'block_reason' => 'Export permit not issued — awaiting MCINET validation',
            'flight_id' => $tk586->id, 'created_by' => $u4->id,
        ]);

        // ── TK597 (NKC→IST cargo special) ────────────────────────────────────
        AWB::firstOrCreate(['awb_number' => '235-59701001'], [
            'origin' => 'NKC', 'destination' => 'IST',
            'shipper_name'    => 'ENER Mauritanie SA', 'shipper_address' => 'Zone Franche, Nouakchott', 'shipper_country' => 'MR',
            'consignee_name'  => 'Zorlu Energy Group', 'consignee_address' => 'Maslak, Istanbul', 'consignee_country' => 'TR',
            'pieces' => 4, 'weight_kg' => 8600, 'volume_m3' => 14.0,
            'commodity' => 'Solar Panel Inverters & Control Units',
            'special_handling' => ['ELE', 'HEA'], 'is_dgr' => false,
            'status' => 'processing', 'flight_id' => $tk597->id, 'created_by' => $u3->id,
        ]);

        // ────────────────────────────────────────────────────────────────────
        // DGR DECLARATIONS
        // ────────────────────────────────────────────────────────────────────

        // 1. TK585 Propane cylinders — pending
        DGR::firstOrCreate(['awb_id' => $awb_tk585_2->id], [
            'dgr_class'            => '2.1',
            'un_number'            => 'UN1978',
            'proper_shipping_name' => 'Propane',
            'erg_code'             => '2F',
            'packing_group'        => null,
            'net_quantity'         => '900 kg',
            'number_of_packages'   => 30,
            'packaging_type'       => 'High-pressure steel cylinders, UN1A',
            'status'               => 'pending',
            'emergency_contact'    => '+90 212 444 05 89',
            'remarks'              => 'CAO — Cargo Aircraft Only. Secured upright position.',
            'created_by'           => $u4->id,
        ]);

        // 2. AH4014 waterproofing chemicals — pending approval
        DGR::firstOrCreate(['awb_id' => $awb_ah_dgr->id], [
            'dgr_class'            => '8',
            'un_number'            => 'UN3082',
            'proper_shipping_name' => 'Environmentally hazardous substance, liquid, n.o.s.',
            'erg_code'             => '9L',
            'packing_group'        => 'III',
            'net_quantity'         => '550 kg',
            'number_of_packages'   => 20,
            'packaging_type'       => 'UN certified 4G fibreboard boxes with inner plastic',
            'status'               => 'pending',
            'emergency_contact'    => '+213 21 54 32 10',
            'remarks'              => 'Keep away from water sources. Environmental hazard marker required.',
            'created_by'           => $u4->id,
        ]);

        // 4. WT192 petroleum refining additives — approved
        DGR::firstOrCreate(['awb_id' => $awb_wt192_dgr->id], [
            'dgr_class'            => '3',
            'un_number'            => 'UN1993',
            'proper_shipping_name' => 'Flammable liquid, n.o.s. (Petroleum additive mixture)',
            'erg_code'             => '3L',
            'packing_group'        => 'II',
            'net_quantity'         => '900 L',
            'number_of_packages'   => 24,
            'packaging_type'       => 'UN certified 1A1 steel drums, 40L each',
            'status'               => 'approved',
            'notoc_generated'      => true,
            'notoc_ref'            => 'NOTOC-' . now()->year . '-0831',
            'approved_by'          => $u2->id,
            'approved_at'          => now()->subHours(12),
            'emergency_contact'    => '+34 91 775 00 25',
            'remarks'              => 'CAO. Segregate from Class 1 and Class 5. Flash point 24°C.',
            'created_by'           => $u4->id,
        ]);

        // ── Auto-generate billing charges for all AWBs ───────────────────────
        AWB::doesntHave('charge')->each(fn ($awb) => AWBCharge::generateFor($awb));

        $this->command->info('');
        $this->command->info('✅ CargoFlow seeded with realistic airline data!');
        $this->command->info('');
        $this->command->table(
            ['Airline', 'Flights', 'Route'],
            [
                ['Turkish Airlines',   'TK571/583/584/585/586/597', 'IST ↔ NKC'],
                ['Royal Air Maroc',    'AT510/511/520/521',         'CMN ↔ NKC'],
                ['Air Algerie',        'AH4014/4015',               'ALG ↔ NKC'],
                ['Tunis Air',          'TU563/564',                 'TUN ↔ NKC'],
                ['Binter Canarias',    'NT1804/1805',               'LPA ↔ NKC'],
                ['Mauritania Airlines','L6116/117 + extensible',    'CDG ↔ NKC'],
                ['Air Senegal',        'HC205/206',                 'DSS ↔ NKC'],
                ['Swift Air',          'WT192/193',                 'LPA ↔ NKC'],
                ['ASKY Airline',       'KP014/015',                 'LFW ↔ NKC'],
            ]
        );
        $this->command->info('');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin',       'admin@cargoflow.mr', 'admin123'],
                ['Supervisor',  'super@cargoflow.mr', 'super123'],
                ['Cargo Agent', 'agent@cargoflow.mr', 'agent123'],
            ]
        );
    }
}
