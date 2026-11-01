<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; color: #000; background: #fff; }
.page { padding: 6mm 6mm 5mm 6mm; }

table { border-collapse: collapse; width: 100%; }
td, th { vertical-align: top; }

/* ── Header ── */
.header-outer { border: 1pt solid #ccc; padding: 5pt 8pt; margin-bottom: 4pt; }
.logo-circle {
  display: inline-block;
  width: 28pt; height: 28pt;
  background: #d40000;
  border-radius: 50%;
  text-align: center;
  line-height: 28pt;
  font-size: 14pt;
  font-weight: bold;
  color: #fff;
  vertical-align: middle;
}
.carrier-name {
  display: inline-block;
  vertical-align: middle;
  margin-left: 5pt;
  font-size: 11pt;
  font-weight: bold;
  color: #1a1a2e;
  letter-spacing: 0.5pt;
}
.notoc-title {
  text-align: center;
  font-size: 12pt;
  font-weight: bold;
  letter-spacing: 0.5pt;
  text-transform: uppercase;
}
.header-meta {
  font-size: 7.5pt;
  line-height: 1.7;
}
.meta-key { display: inline-block; width: 36pt; font-weight: normal; color: #555; }

/* ── Flight info strip ── */
.flight-strip {
  border: 1pt solid #000;
  margin-bottom: 5pt;
}
.flight-strip td {
  border-right: 0.5pt solid #000;
  padding: 3pt 5pt;
  font-size: 7.5pt;
  vertical-align: middle;
}
.flight-strip td:last-child { border-right: none; }
.fl-label { font-size: 6pt; color: #555; display: block; }
.fl-val { font-size: 9pt; font-weight: bold; font-family: 'Courier New', monospace; display: block; margin-top: 1pt; }

/* ── Section title ── */
.section-title {
  font-size: 8.5pt;
  font-weight: bold;
  text-transform: uppercase;
  margin: 4pt 0 2pt 0;
  letter-spacing: 0.3pt;
}

/* ── DGR Table ── */
.dgr-table { border: 1pt solid #555; margin-bottom: 6pt; }
.dgr-table th {
  background: #d8d8d8;
  font-size: 6pt;
  font-weight: bold;
  text-align: center;
  padding: 2.5pt 2pt;
  border: 0.4pt solid #888;
  vertical-align: bottom;
  line-height: 1.3;
}
.dgr-table td {
  border: 0.4pt solid #aaa;
  padding: 3pt 3pt;
  font-size: 7.5pt;
  text-align: center;
  vertical-align: middle;
  color: #0000cc;
}
.dgr-table td.left { text-align: left; }

/* ── Other Special Load Table ── */
.osl-table { border: 1pt solid #555; }
.osl-table th {
  background: #d8d8d8;
  font-size: 6pt;
  font-weight: bold;
  text-align: center;
  padding: 2.5pt 2pt;
  border: 0.4pt solid #888;
  vertical-align: bottom;
  line-height: 1.3;
}
.osl-table td {
  border: 0.4pt solid #aaa;
  padding: 3pt 3pt;
  font-size: 7.5pt;
  text-align: center;
  vertical-align: middle;
  color: #0000cc;
}
.osl-table td.left { text-align: left; }

/* empty row */
.empty-row td { height: 14pt; }

.footer { font-size: 5.5pt; color: #888; text-align: center; border-top: 0.3pt solid #ccc; padding-top: 3pt; margin-top: 5pt; }
</style>
</head>
<body>
<div class="page">

@php
  $flight     = $awbs->first()?->flight ?? null;
  $preparedBy = $preparedBy ?? 'CF-SYSTEM';
  $now        = now();

  // IMP codes mapping for special handling
  $impCodes = [
    'PER' => 'PER',
    'ICE' => 'ICE',
    'HEA' => 'HEA',
    'MED' => 'EAP,EAW',
    'PRI' => 'PRI',
    'CAO' => 'CAO',
    'ELE' => 'ELI',
    'HUM' => 'HUM',
    'AVI' => 'AVI',
    'VAL' => 'VAL',
    'DIP' => 'DIP',
  ];
@endphp

{{-- ═══════════════════════════════
     HEADER
═══════════════════════════════ --}}
<table class="header-outer" style="border:1pt solid #ccc; margin-bottom:4pt;">
  <tr>
    {{-- Logo + Airline name --}}
    <td style="width:28%; vertical-align:middle; padding:3pt 5pt;">
      <span class="logo-circle">CF</span>
      <span class="carrier-name">CARGOFLOW<br><span style="font-size:7pt; font-weight:normal; color:#555; letter-spacing:0;">CARGO</span></span>
    </td>

    {{-- Title --}}
    <td style="width:44%; text-align:center; vertical-align:middle; padding:3pt;">
      <div class="notoc-title">Special Load Notification to Captain</div>
    </td>

    {{-- Date / Staff --}}
    <td style="width:28%; vertical-align:middle; padding:3pt 5pt;" class="header-meta">
      <div><span class="meta-key">Date</span>: {{ $now->format('d-M-Y') }}&nbsp;&nbsp;{{ $now->format('H:i') }}</div>
      <div><span class="meta-key">Staff Id</span>: {{ $preparedBy }}</div>
      @if($notocRef)
      <div><span class="meta-key">Ref</span>: <strong>{{ $notocRef }}</strong></div>
      @endif
    </td>
  </tr>
</table>

{{-- ═══════════════════════════════
     FLIGHT INFO STRIP
═══════════════════════════════ --}}
<table class="flight-strip">
  <tr>
    <td style="width:18%;">
      <span class="fl-label">Station Of Loading</span>
      <span class="fl-val">{{ $flight?->origin ?? 'NKC' }}</span>
    </td>
    <td style="width:16%;">
      <span class="fl-label">Flight No</span>
      <span class="fl-val">{{ $flight?->flight_number ?? '—' }}</span>
    </td>
    <td style="width:18%;">
      <span class="fl-label">Flight Date</span>
      <span class="fl-val" style="font-size:8pt;">{{ optional($flight?->departure_at)->format('d-M-Y') ?? '—' }}</span>
    </td>
    <td style="width:22%;">
      <span class="fl-label">Aircraft Registration</span>
      <span class="fl-val">{{ $flight?->aircraft_type ?? '—' }}</span>
    </td>
    <td style="width:26%;">
      <span class="fl-label">Prepared By</span>
      <span class="fl-val" style="font-size:8pt;">{{ $preparedBy }}</span>
    </td>
  </tr>
</table>

{{-- ═══════════════════════════════
     DANGEROUS GOODS
═══════════════════════════════ --}}
@if($dgrs->count() > 0)
<div class="section-title">Dangerous Goods</div>
<table class="dgr-table">
  <thead>
    <tr>
      <th style="width:8%;">Station Of<br>Unloading</th>
      <th style="width:11%;">Air Waybill<br>Number</th>
      <th style="width:14%;">Proper Shipping<br>Name</th>
      <th style="width:8%;">Class or<br>Division<br>and for<br>Class 1<br>Compat.<br>Grp.<br>Letter</th>
      <th style="width:7%;">UN or ID<br>Number</th>
      <th style="width:5%;">Sub<br>Hazard</th>
      <th style="width:5%;">No of<br>Pkgs</th>
      <th style="width:6%;">Packing<br>Height</th>
      <th style="width:8%;">Net Qty or TI<br>per Pkg</th>
      <th style="width:8%;">Radioactive<br>Material<br>Category</th>
      <th style="width:5%;">Pkg<br>Group</th>
      <th style="width:7%;">IMP<br>Code<br>(see<br>reverse)</th>
      <th style="width:5%;">ERG<br>Code</th>
      <th style="width:4%;">CAO<br>(X)</th>
      <th colspan="2" style="width:9%;">Loaded</th>
    </tr>
    <tr>
      <th colspan="14" style="height:0; padding:0; border:none;"></th>
      <th style="width:5%; font-size:5.5pt;">ULD /BULK ID</th>
      <th style="width:4%; font-size:5.5pt;">Position</th>
    </tr>
  </thead>
  <tbody>
    @foreach($dgrs as $dgr)
    <tr>
      <td>{{ $dgr->awb?->destination ?? $flight?->destination ?? '—' }}</td>
      <td class="left" style="font-family:'Courier New',monospace; font-size:7pt;">{{ $dgr->awb?->awb_number ?? '—' }}</td>
      <td class="left" style="font-size:6.5pt;">{{ $dgr->proper_shipping_name }}</td>
      <td>{{ $dgr->dgr_class }}</td>
      <td style="font-family:'Courier New',monospace;">{{ $dgr->un_number }}</td>
      <td>—</td>
      <td>{{ $dgr->number_of_packages }}</td>
      <td>—</td>
      <td>{{ $dgr->net_quantity }}</td>
      <td>—</td>
      <td>{{ $dgr->packing_group ?? '—' }}</td>
      <td>
        @if($dgr->dgr_class == '3') FLI
        @elseif($dgr->dgr_class == '2.1') FLG
        @elseif($dgr->dgr_class == '2.2') NGZ
        @elseif($dgr->dgr_class == '6.1') TOX
        @elseif($dgr->dgr_class == '6.2') BIO
        @elseif($dgr->dgr_class == '7') RAD
        @elseif($dgr->dgr_class == '8') COR
        @elseif($dgr->dgr_class == '9') MIS
        @elseif(str_starts_with($dgr->dgr_class, '4')) FLS
        @elseif(str_starts_with($dgr->dgr_class, '5')) OXY
        @else DGR @endif
        @if(in_array('HEA', $dgr->awb?->special_handling ?? [])), HEA @endif
      </td>
      <td style="font-family:'Courier New',monospace;">{{ $dgr->erg_code }}</td>
      <td>{{ in_array('CAO', $dgr->awb?->special_handling ?? []) ? 'X' : '' }}</td>
      <td style="font-size:6.5pt;">BLK</td>
      <td>—</td>
    </tr>
    @endforeach
    @if($dgrs->count() == 0)
    <tr class="empty-row"><td colspan="16"></td></tr>
    @endif
  </tbody>
</table>
@endif

{{-- ═══════════════════════════════
     OTHER SPECIAL LOAD
═══════════════════════════════ --}}
@if($specialCargo->count() > 0)
<div class="section-title">Other Special Load</div>
<table class="osl-table">
  <thead>
    <tr>
      <th style="width:10%;">Station Of<br>Unloading</th>
      <th style="width:14%;">Air Waybill<br>Number</th>
      <th style="width:22%;">Contents and Description</th>
      <th style="width:9%;">No of Pkgs</th>
      <th style="width:9%;">Total Qty</th>
      <th style="width:20%;">Supplementary Information</th>
      <th style="width:9%;">IMP Code<br>(see reverse)</th>
      <th style="width:4%;">ULD /<br>BULK ID</th>
      <th style="width:3%;">Position</th>
    </tr>
  </thead>
  <tbody>
    @foreach($specialCargo as $awb)
    @php
      $codes = $awb->special_handling ?? [];
      $imp   = collect($codes)->map(fn($c) => $impCodes[$c] ?? $c)->join(',');
      $supp  = collect($codes)
        ->filter(fn($c) => in_array($c, ['PER','ICE','HEA','VAL','AVI']))
        ->map(fn($c) => [
          'PER'=>'Keep refrigerated', 'ICE'=>'+2/+8°C WHENEVER POSSIBLE',
          'HEA'=>'Heavy piece >150kg', 'VAL'=>'Secured storage', 'AVI'=>'Live animals',
        ][$c] ?? $c)
        ->join(' / ');
    @endphp
    <tr>
      <td>{{ $awb->destination }}</td>
      <td class="left" style="font-family:'Courier New',monospace; font-size:7pt;">{{ $awb->awb_number }}</td>
      <td class="left" style="font-size:7pt;">{{ strtoupper($awb->commodity) }}</td>
      <td>{{ $awb->pieces }}</td>
      <td>{{ number_format($awb->weight_kg, 1) }}</td>
      <td class="left" style="font-size:6.5pt;">{{ $supp ?: '—' }}</td>
      <td style="font-family:'Courier New',monospace; font-size:6.5pt;">{{ $imp }}</td>
      <td style="font-size:6.5pt;">BLK</td>
      <td>—</td>
    </tr>
    @endforeach
    @if($specialCargo->count() == 0)
    <tr class="empty-row"><td colspan="9"></td></tr>
    @endif
  </tbody>
</table>
@endif

{{-- ═══════════════════════════════
     SIGNATURE BLOCK
═══════════════════════════════ --}}
<table style="margin-top:6pt; border:0.5pt solid #ccc;">
  <tr>
    <td style="width:50%; padding:4pt 6pt; border-right:0.5pt solid #ccc;">
      <span style="font-size:6pt; color:#555; text-transform:uppercase; font-weight:bold;">Ground Operations Supervisor</span>
      <div style="border-bottom:0.4pt solid #000; margin:10pt 0 2pt 0;"></div>
      <div style="display:table; width:100%;">
        <div style="display:table-cell;"><span style="font-size:5.5pt; color:#666;">Signature / Name</span></div>
        <div style="display:table-cell; text-align:right;"><span style="font-size:5.5pt; color:#666;">Date / Time (UTC)</span></div>
      </div>
    </td>
    <td style="width:50%; padding:4pt 6pt;">
      <span style="font-size:6pt; color:#555; text-transform:uppercase; font-weight:bold;">Captain Acknowledgement</span>
      <div style="border-bottom:0.4pt solid #000; margin:10pt 0 2pt 0;"></div>
      <div style="display:table; width:100%;">
        <div style="display:table-cell;"><span style="font-size:5.5pt; color:#666;">Signature / Name</span></div>
        <div style="display:table-cell; text-align:right;"><span style="font-size:5.5pt; color:#666;">Date / Time (UTC)</span></div>
      </div>
    </td>
  </tr>
</table>

<div class="footer">
  CargoFlow Air Freight Management System &nbsp;·&nbsp;
  NOTOC {{ $notocRef }} &nbsp;·&nbsp;
  Flight {{ $flight?->flight_number ?? '—' }} &nbsp;·&nbsp;
  {{ optional($flight?->departure_at)->format('d M Y') ?? now()->format('d M Y') }} &nbsp;·&nbsp;
  Generated {{ $now->format('d M Y H:i') }} UTC &nbsp;·&nbsp;
  Compliant with IATA DGR 65th Edition
</div>

</div>
</body>
</html>
