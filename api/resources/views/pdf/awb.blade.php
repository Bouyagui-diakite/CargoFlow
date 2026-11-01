<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 7pt; color: #000; background: #fff; }
.page { padding: 6mm 6mm 5mm 6mm; }

/* Grid system */
table { border-collapse: collapse; width: 100%; }
td, th { vertical-align: top; }
.b  { border: 0.4pt solid #000; }
.bt { border-top: 0.4pt solid #000; }
.bb { border-bottom: 0.4pt solid #000; }
.br { border-right: 0.4pt solid #000; }
.bl { border-left: 0.4pt solid #000; }

.cell { padding: 1.5pt 2.5pt; }

/* Labels */
.lbl {
  font-size: 5.5pt;
  color: #555;
  font-weight: normal;
  display: block;
  line-height: 1.2;
}
.val      { font-size: 7.5pt; font-weight: bold; display:block; margin-top: 1pt; }
.val-sm   { font-size: 6.5pt; font-weight: bold; display:block; margin-top: 1pt; }
.val-lg   { font-size: 11pt; font-weight: bold; display:block; font-family: 'Courier New', monospace; letter-spacing: 1pt; }
.val-mono { font-family: 'Courier New', monospace; font-weight: bold; }
.center   { text-align: center; }
.right    { text-align: right; }
.muted    { color: #777; }

/* Top right title */
.title-box {
  text-align: center;
  padding: 2pt 4pt;
  border-bottom: 0.4pt solid #000;
}
.title-main { font-size: 10pt; font-weight: bold; letter-spacing: 0.5pt; }
.title-sub  { font-size: 6pt; color: #555; margin-top: 1pt; }

/* AWB number */
.awb-num-box {
  text-align: center;
  padding: 3pt 4pt;
}
.awb-num { font-size: 16pt; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 2pt; }
.awb-lbl { font-size: 5.5pt; color: #555; display: block; margin-top: 1pt; }

/* Airline names */
.airline-names {
  padding: 2pt 4pt;
  border-top: 0.4pt solid #000;
  font-size: 7pt;
  font-weight: bold;
  text-align: center;
  line-height: 1.5;
  color: #1a1a2e;
}

/* Cargo table */
.cargo-th {
  background: #f0f0f0;
  font-size: 5.5pt;
  text-align: center;
  font-weight: bold;
  padding: 2pt;
  border: 0.4pt solid #000;
  vertical-align: bottom;
}
.cargo-td {
  font-size: 8pt;
  font-weight: bold;
  text-align: center;
  padding: 3pt 2pt;
  border: 0.4pt solid #000;
  vertical-align: middle;
}
.nature-td {
  padding: 3pt 4pt;
  border: 0.4pt solid #000;
  font-size: 7.5pt;
  min-height: 18pt;
}

/* Handling codes */
.hcode {
  display: inline-block;
  border: 0.3pt solid #555;
  padding: 0.5pt 3pt;
  margin: 0.5pt;
  font-size: 6.5pt;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  background: #fafafa;
}

/* DGR box */
.dgr-box {
  border: 1pt solid #cc0000;
  background: #fff9f9;
  padding: 3pt 5pt;
}
.dgr-hdr { font-size: 7.5pt; font-weight: bold; color: #cc0000; margin-bottom: 2pt; }
.dgr-row { font-size: 6.5pt; line-height: 1.6; }
.dgr-key { font-weight: bold; display: inline-block; width: 90pt; }

/* Status badge */
.status {
  display: inline-block;
  font-size: 6.5pt;
  font-weight: bold;
  padding: 1pt 5pt;
  border-radius: 2pt;
  text-transform: uppercase;
  letter-spacing: 0.5pt;
}
.st-delivered  { background:#e8f5e9; color:#2e7d32; border: 0.4pt solid #4caf50; }
.st-in_transit { background:#e3f2fd; color:#1565c0; border: 0.4pt solid #42a5f5; }
.st-loaded     { background:#ede7f6; color:#4527a0; border: 0.4pt solid #7e57c2; }
.st-processing { background:#e3f2fd; color:#1565c0; border: 0.4pt solid #42a5f5; }
.st-received   { background:#f5f5f5; color:#333;    border: 0.4pt solid #aaa; }
.st-blocked    { background:#ffebee; color:#c62828; border: 0.4pt solid #ef5350; }

/* Signature */
.sig-line { border-bottom: 0.4pt solid #000; margin: 8pt 0 2pt 0; }
.sig-lbl  { font-size: 5.5pt; color: #666; }

.footer { font-size: 5.5pt; color: #888; text-align: center; border-top: 0.3pt solid #ccc; padding-top: 2pt; margin-top: 4pt; }
</style>
</head>
<body>
<div class="page">

{{-- ═══════════════════════════════════════════════
     ROW 1 — Shipper Acct | Issued By | Not Negotiable + AWB No.
═══════════════════════════════════════════════ --}}
<table>
  <tr>
    {{-- Shipper account --}}
    <td style="width:28%;" class="b cell" rowspan="2">
      <span class="lbl">Shipper's Account Number</span>
      <span class="val muted">{{ $awb->shipper_account ?? '—' }}</span>
    </td>

    {{-- Issued by / not negotiable --}}
    <td style="width:35%;" class="b">
      <div class="title-box">
        <div class="title-main">Not Negotiable</div>
        <div class="title-main">Air Waybill</div>
        <div class="title-sub">Issued by CargoFlow Air Freight Management</div>
      </div>
    </td>

    {{-- AWB Number --}}
    <td style="width:37%;" class="b" rowspan="3">
      <div class="awb-num-box">
        <div style="font-size:6pt; color:#555; margin-bottom:2pt; letter-spacing:1pt; text-transform:uppercase;">Air Waybill No.</div>
        <div class="awb-num">{{ $awb->awb_number }}</div>
        <div style="margin-top:4pt;">
          <span class="status st-{{ $awb->status }}">{{ strtoupper(str_replace('_',' ',$awb->status)) }}</span>
        </div>
      </div>
      <div class="airline-names">
        CARGOFLOW AIR FREIGHT INC<br>
        @if($awb->flight)
          {{ strtoupper($awb->flight->flight_number) }} &nbsp;·&nbsp;
          {{ $awb->origin }} → {{ $awb->destination }}
        @endif
      </div>
      <div class="cell">
        <span class="lbl">Copy — For Shipper</span>
        <span class="val-sm">{{ now()->format('d M Y H:i') }} UTC</span>
        <span class="lbl" style="margin-top:2pt;">Issued by</span>
        <span class="val-sm">{{ $awb->creator->name ?? 'System' }}</span>
      </div>
    </td>
  </tr>

  <tr>
    {{-- Consignee account --}}
    <td class="b cell">
      <span class="lbl">Consignee's Account Number</span>
      <span class="val muted">{{ $awb->consignee_account ?? '—' }}</span>
    </td>
  </tr>

  {{-- Row 3 — Shipper name/address --}}
  <tr>
    <td class="b cell" colspan="2">
      <span class="lbl">Shipper's Name and Address</span>
      <span class="val">{{ $awb->shipper_name }}</span>
      <span style="font-size:7pt; line-height:1.5; display:block; margin-top:1pt;">{{ $awb->shipper_address }}</span>
      <span style="display:inline-block; margin-top:3pt; font-size:6pt; font-weight:bold; background:#1a1a2e; color:#fff; padding:1pt 5pt; letter-spacing:1pt;">{{ $awb->shipper_country }}</span>
    </td>
  </tr>
</table>

{{-- ═══════════════════════════════════════════════
     ROW 4 — Consignee | Agent
═══════════════════════════════════════════════ --}}
<table>
  <tr>
    {{-- Consignee --}}
    <td style="width:50%;" class="b bt cell" style="min-height:24mm;">
      <span class="lbl">Consignee's Name and Address</span>
      <span class="val">{{ $awb->consignee_name }}</span>
      <span style="font-size:7pt; line-height:1.5; display:block; margin-top:1pt;">{{ $awb->consignee_address }}</span>
      <span style="display:inline-block; margin-top:3pt; font-size:6pt; font-weight:bold; background:#1a1a2e; color:#fff; padding:1pt 5pt; letter-spacing:1pt;">{{ $awb->consignee_country }}</span>
    </td>

    {{-- Issuing Carrier's Agent --}}
    <td style="width:50%;" class="b bt bl cell">
      <span class="lbl">Issuing Carrier's Agent Name and City</span>
      <span class="val">CargoFlow Cargo Station — Nouakchott (NKC)</span>
      <span class="lbl" style="margin-top:3pt;">Agent's IATA Code</span>
      <span class="val-sm">NKC-CF-001</span>
      <span class="lbl" style="margin-top:3pt;">Account No.</span>
      <span class="val-sm">CF-2026-{{ str_pad($awb->id, 4, '0', STR_PAD_LEFT) }}</span>
    </td>
  </tr>
</table>

{{-- ═══════════════════════════════════════════════
     ROW 5 — Airport of Departure | Routing | Currency / Charges
═══════════════════════════════════════════════ --}}
<table>
  <tr>
    <td style="width:22%;" class="b cell">
      <span class="lbl">Airport of Departure (Addr. of First Carrier) and Requested Routing</span>
      <span class="val" style="font-size:14pt; font-family:'Courier New',monospace;">{{ $awb->origin }}</span>
    </td>
    <td style="width:10%;" class="b bl cell center">
      <span class="lbl">To</span>
      <span class="val" style="font-size:12pt; font-family:'Courier New',monospace;">{{ $awb->destination }}</span>
    </td>
    <td style="width:16%;" class="b bl cell">
      <span class="lbl">By First Carrier</span>
      <span class="val-sm val-mono">{{ $awb->flight->flight_number ?? '—' }}</span>
      <span class="lbl" style="margin-top:2pt;">Aircraft</span>
      <span class="val-sm">{{ $awb->flight->aircraft_type ?? '—' }}</span>
    </td>
    <td style="width:10%;" class="b bl cell center">
      <span class="lbl">Currency</span>
      <span class="val-sm">MRU</span>
    </td>
    <td style="width:10%;" class="b bl cell center">
      <span class="lbl">WT/VAL</span>
      <span class="val-sm">PP</span>
    </td>
    <td style="width:10%;" class="b bl cell center">
      <span class="lbl">Other</span>
      <span class="val-sm">—</span>
    </td>
    <td style="width:22%;" class="b bl cell">
      <span class="lbl">Declared Value for Carriage</span>
      <span class="val-sm">NVD</span>
      <span class="lbl" style="margin-top:2pt;">Declared Value for Customs</span>
      <span class="val-sm">NCV</span>
    </td>
  </tr>
</table>

{{-- ═══════════════════════════════════════════════
     ROW 6 — Airport of Destination | Flight dates
═══════════════════════════════════════════════ --}}
<table>
  <tr>
    <td style="width:30%;" class="b cell">
      <span class="lbl">Airport of Destination</span>
      <span class="val" style="font-size:14pt; font-family:'Courier New',monospace;">{{ $awb->destination }}</span>
    </td>
    <td style="width:25%;" class="b bl cell">
      <span class="lbl">Flight / Date</span>
      <span class="val-sm val-mono">{{ $awb->flight->flight_number ?? '—' }} / {{ optional($awb->flight?->departure_at)->format('d M Y') ?? '—' }}</span>
    </td>
    <td style="width:25%;" class="b bl cell">
      <span class="lbl">Departure (UTC)</span>
      <span class="val-sm">{{ optional($awb->flight?->departure_at)->format('H:i') ?? '—' }}</span>
    </td>
    <td style="width:20%;" class="b bl cell">
      <span class="lbl">Arrival (UTC)</span>
      <span class="val-sm">{{ optional($awb->flight?->arrival_at)->format('d M Y H:i') ?? '—' }}</span>
    </td>
  </tr>
</table>

{{-- ═══════════════════════════════════════════════
     ROW 7 — Cargo table header + data
═══════════════════════════════════════════════ --}}
<table>
  <thead>
    <tr>
      <th class="cargo-th" style="width:8%;">No. of<br>Pieces<br>RCP</th>
      <th class="cargo-th" style="width:12%;">Gross<br>Weight</th>
      <th class="cargo-th" style="width:6%;">kg<br>lb</th>
      <th class="cargo-th" style="width:8%;">Rate<br>Class</th>
      <th class="cargo-th" style="width:11%;">Commodity<br>Item No.</th>
      <th class="cargo-th" style="width:12%;">Chargeable<br>Weight</th>
      <th class="cargo-th" style="width:11%;">Rate/<br>Charge</th>
      <th class="cargo-th" style="width:10%;">Total</th>
      <th class="cargo-th" style="width:22%;">Nature and Quantity of Goods<br>(incl. Dimensions or Volume)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="cargo-td" style="font-size:12pt;">{{ $awb->pieces }}</td>
      <td class="cargo-td" style="font-size:12pt;">{{ number_format($awb->weight_kg, 1) }}</td>
      <td class="cargo-td">K</td>
      <td class="cargo-td">{{ $awb->is_dgr ? 'Q' : 'N' }}</td>
      <td class="cargo-td">{{ str_pad($awb->id, 6, '0', STR_PAD_LEFT) }}</td>
      <td class="cargo-td">{{ number_format($awb->weight_kg, 1) }}</td>
      <td class="cargo-td">—</td>
      <td class="cargo-td">—</td>
      <td class="nature-td" style="text-align:left;">
        <strong>{{ $awb->commodity }}</strong>
        @if($awb->volume_m3)
          <br><span style="font-size:6.5pt;">Volume: {{ number_format($awb->volume_m3, 2) }} m³</span>
        @endif
        @if($awb->is_dgr)
          <br><span style="color:#cc0000; font-size:6.5pt; font-weight:bold;">⚠ DANGEROUS GOODS — SEE BELOW</span>
        @endif
      </td>
    </tr>
    {{-- Totals row --}}
    <tr>
      <td class="cargo-td" style="font-size:9pt; background:#f5f5f5;">{{ $awb->pieces }}</td>
      <td class="cargo-td" style="font-size:9pt; background:#f5f5f5;">{{ number_format($awb->weight_kg, 1) }}</td>
      <td class="cargo-td" style="background:#f5f5f5;"></td>
      <td class="cargo-td" colspan="4" style="text-align:right; font-size:6pt; color:#555; background:#f5f5f5;">Total Pieces / Total Gross Weight →</td>
      <td class="cargo-td" style="background:#f5f5f5;">—</td>
      <td class="nature-td" style="background:#f5f5f5;"></td>
    </tr>
  </tbody>
</table>

{{-- ═══════════════════════════════════════════════
     ROW 8 — Handling Information
═══════════════════════════════════════════════ --}}
<table>
  <tr>
    <td class="b cell">
      <span class="lbl">Handling Information</span>
      @if($awb->special_handling && count($awb->special_handling) > 0)
        <div style="margin-top:2pt;">
          @foreach($awb->special_handling as $code)
            <span class="hcode">{{ $code }}</span>
          @endforeach
        </div>
        @php
          $codeDesc = [
            'PER'=>'Perishable', 'ICE'=>'Dry Ice/Temperature Controlled',
            'HEA'=>'Heavy Cargo', 'MED'=>'Medical/Pharmaceutical', 'PRI'=>'Priority',
            'CAO'=>'Cargo Aircraft Only', 'ELE'=>'Electronic Equipment',
            'HUM'=>'Humanitarian Aid', 'AVI'=>'Live Animals', 'VAL'=>'Valuable Cargo',
            'DIP'=>'Diplomatic Cargo',
          ];
        @endphp
        <div style="font-size:6pt; color:#555; margin-top:2pt;">
          @foreach($awb->special_handling as $code)
            {{ $codeDesc[$code] ?? $code }}@if(!$loop->last) · @endif
          @endforeach
        </div>
      @else
        <span class="val-sm muted">No special handling</span>
      @endif
      @if($awb->block_reason)
        <div style="margin-top:3pt; color:#cc0000; font-size:7pt; font-weight:bold;">
          ⛔ BLOCKED: {{ $awb->block_reason }}
        </div>
      @endif
    </td>
  </tr>
</table>

{{-- ═══════════════════════════════════════════════
     DGR DECLARATION (conditional)
═══════════════════════════════════════════════ --}}
@if($awb->is_dgr && $awb->dgr)
@php $dgr = $awb->dgr; @endphp
<div style="margin-top:2pt;" class="dgr-box">
  <div class="dgr-hdr">⚠ SHIPPER'S DECLARATION FOR DANGEROUS GOODS — IATA DGR</div>
  <table>
    <tr>
      <td style="width:25%;" class="dgr-row">
        <span class="dgr-key">UN Number:</span>
        <strong style="font-family:'Courier New',monospace; color:#cc0000;">{{ $dgr->un_number }}</strong>
      </td>
      <td style="width:20%;" class="dgr-row">
        <span class="dgr-key">Hazard Class:</span>
        <strong>Class {{ $dgr->dgr_class }}</strong>
      </td>
      <td style="width:15%;" class="dgr-row">
        <span class="dgr-key">Pkg Group:</span>
        <strong>{{ $dgr->packing_group ?? 'N/A' }}</strong>
      </td>
      <td style="width:15%;" class="dgr-row">
        <span class="dgr-key">ERG Code:</span>
        <strong style="font-family:'Courier New',monospace;">{{ $dgr->erg_code }}</strong>
      </td>
      <td style="width:12%;" class="dgr-row">
        <span class="dgr-key">Net Qty:</span>
        <strong>{{ $dgr->net_quantity }}</strong>
      </td>
      <td style="width:13%;" class="dgr-row center">
        <div style="font-size:6pt; color:#555;">Status</div>
        <strong style="color:{{ $dgr->status==='approved'?'#2e7d32':'#cc0000' }};">{{ strtoupper($dgr->status) }}</strong>
      </td>
    </tr>
  </table>
  <div class="dgr-row" style="margin-top:2pt;">
    <span class="dgr-key">Proper Shipping Name:</span> {{ $dgr->proper_shipping_name }}
  </div>
  <div class="dgr-row">
    <span class="dgr-key">Packaging:</span> {{ $dgr->packaging_type ?? '—' }}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <span class="dgr-key">Packages:</span> {{ $dgr->number_of_packages }}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <span class="dgr-key">Emergency Contact:</span> {{ $dgr->emergency_contact }}
  </div>
  @if($dgr->notoc_generated)
  <div class="dgr-row" style="color:#2e7d32; margin-top:2pt;">
    ✓ NOTOC: <strong>{{ $dgr->notoc_ref }}</strong>
    @if($dgr->approver) — Approved by {{ $dgr->approver->name }} ({{ optional($dgr->approved_at)->format('d M Y H:i') }}) @endif
  </div>
  @endif
  <div style="font-size:5.5pt; color:#888; margin-top:3pt; font-style:italic; border-top:0.3pt solid #ccc; padding-top:2pt;">
    I hereby declare that the contents of this consignment are fully and accurately described above by the Proper Shipping Name and are classified,
    packaged, marked, and labeled/placarded, and are in all respects in proper condition for transport according to applicable international
    and national governmental regulations — IATA DGR 65th Edition.
  </div>
</div>
@endif

{{-- ═══════════════════════════════════════════════
     ROW 9 — Charges + Signatures
═══════════════════════════════════════════════ --}}
<table style="margin-top:2pt;">
  <tr>
    <td style="width:10%;" class="b cell center">
      <span class="lbl">Prepaid</span>
      <span class="val-sm">—</span>
    </td>
    <td style="width:18%;" class="b bl cell center">
      <span class="lbl">Weight Charge</span>
      <span class="val-sm">—</span>
    </td>
    <td style="width:18%;" class="b bl cell center">
      <span class="lbl">Valuation Charge</span>
      <span class="val-sm">—</span>
    </td>
    <td style="width:10%;" class="b bl cell center">
      <span class="lbl">Tax</span>
      <span class="val-sm">—</span>
    </td>
    <td style="width:19%;" class="b bl cell center">
      <span class="lbl">Other Charges Due Agent</span>
      <span class="val-sm">—</span>
    </td>
    <td style="width:25%;" class="b bl cell" rowspan="2">
      <span class="lbl" style="font-size:5.5pt;">Shipper's Certification</span>
      <div style="font-size:5.5pt; line-height:1.4; color:#444; margin-top:1pt;">
        I hereby certify that the particulars on the face hereof are correct and that insofar as any part of the consignment contains
        dangerous goods, such part is properly described by name and is in proper condition for carriage by air.
      </div>
      <div class="sig-line"></div>
      <div style="display:table; width:100%;">
        <div style="display:table-cell;"><span class="sig-lbl">Signature of Shipper or Agent</span></div>
        <div style="display:table-cell; text-align:right;"><span class="sig-lbl">Date</span></div>
      </div>
    </td>
  </tr>
  <tr>
    <td class="b bt cell center"><span class="lbl">Collect</span><span class="val-sm">—</span></td>
    <td class="b bt bl cell center"><span class="lbl">Weight Charge</span><span class="val-sm">—</span></td>
    <td class="b bt bl cell center"><span class="lbl">Valuation Charge</span><span class="val-sm">—</span></td>
    <td class="b bt bl cell center"><span class="lbl">Tax</span><span class="val-sm">—</span></td>
    <td class="b bt bl cell center"><span class="lbl">Other Charges Due Carrier</span><span class="val-sm">—</span></td>
  </tr>
</table>

{{-- Carrier execution --}}
<table>
  <tr>
    <td style="width:50%;" class="b bt cell">
      <span class="lbl">For Carrier — Executed on</span>
      <span class="val-sm">{{ now()->format('d M Y') }} at Nouakchott (NKC)</span>
      <span class="lbl" style="margin-top:2pt;">By (Carrier's Agent)</span>
      <span class="val-sm">{{ $awb->creator->name ?? 'CargoFlow System' }}</span>
      <div class="sig-line"></div>
      <div style="display:table; width:100%;">
        <div style="display:table-cell;"><span class="sig-lbl">Authorized Signature</span></div>
        <div style="display:table-cell; text-align:right;"><span class="sig-lbl">Stamp</span></div>
      </div>
    </td>
    <td style="width:50%;" class="b bt bl cell">
      <span class="lbl">For Carrier Use Only — Charges at Destination</span>
      <div style="margin-top:3pt;">
        <table>
          <tr>
            <td style="font-size:6pt; padding:1pt 3pt; border:0.3pt solid #ccc;">Total Collect Charges</td>
            <td style="font-size:6pt; padding:1pt 3pt; border:0.3pt solid #ccc; text-align:center;">—</td>
          </tr>
        </table>
      </div>
    </td>
  </tr>
</table>

<div class="footer">
  CargoFlow Air Freight Management System &nbsp;·&nbsp;
  AWB {{ $awb->awb_number }} &nbsp;·&nbsp;
  {{ $awb->origin }} → {{ $awb->destination }} &nbsp;·&nbsp;
  Generated {{ now()->format('d M Y H:i') }} UTC &nbsp;·&nbsp;
  Non-Negotiable — Shipper's Copy
</div>

</div>
</body>
</html>
