import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(date) {
  if (!date) return '—'
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(date)
}

export function formatWeight(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`
  return `${kg.toLocaleString()} kg`
}

// Per-flight AWB numeric prefixes (IATA standard, user-defined)
export const AWB_PREFIXES = {
  HC205: '490', HC206: '490',
  NT1804: '474', NT1805: '474',
  KP014: '032', KP015: '032',
  WT192: '221', WT193: '574',
}

export function getAWBPrefix(flightNumber) {
  if (!flightNumber) return '235'
  if (AWB_PREFIXES[flightNumber]) return AWB_PREFIXES[flightNumber]
  if (flightNumber.startsWith('L6')) return '495'
  if (flightNumber.startsWith('TK')) return '235'
  if (flightNumber.startsWith('AT')) return '147'
  if (flightNumber.startsWith('AH')) return '124'
  if (flightNumber.startsWith('TU')) return '221'
  return '235'
}

export function generateAWBNumber(prefix = '235') {
  const serial = Math.floor(10000000 + Math.random() * 90000000)
  return `${prefix}-${serial}`
}

export const STATUS_COLORS = {
  received:    { bg: 'bg-slate-700',  text: 'text-slate-200',  dot: 'bg-slate-400'  },
  processing:  { bg: 'bg-blue-900/50', text: 'text-blue-300',   dot: 'bg-blue-400'   },
  loaded:      { bg: 'bg-indigo-900/50', text: 'text-indigo-300', dot: 'bg-indigo-400' },
  in_transit:  { bg: 'bg-cyan-900/50', text: 'text-cyan-300',   dot: 'bg-cyan-400'   },
  delivered:   { bg: 'bg-emerald-900/50', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  blocked:     { bg: 'bg-red-900/50', text: 'text-red-300',     dot: 'bg-red-400'    },
  scheduled:   { bg: 'bg-slate-700',  text: 'text-slate-200',  dot: 'bg-slate-400'  },
  boarding:    { bg: 'bg-amber-900/50', text: 'text-amber-300', dot: 'bg-amber-400'  },
  departed:    { bg: 'bg-blue-900/50', text: 'text-blue-300',   dot: 'bg-blue-400'   },
  arrived:     { bg: 'bg-emerald-900/50', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  cancelled:   { bg: 'bg-red-900/50', text: 'text-red-300',     dot: 'bg-red-400'    },
  pending:     { bg: 'bg-amber-900/50', text: 'text-amber-300', dot: 'bg-amber-400'  },
  approved:    { bg: 'bg-emerald-900/50', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  rejected:    { bg: 'bg-red-900/50', text: 'text-red-300',     dot: 'bg-red-400'    },
}

export const DGR_CLASSES = [
  { value: '1', label: 'Class 1 — Explosives',            color: 'text-red-400' },
  { value: '2.1', label: 'Class 2.1 — Flammable Gas',     color: 'text-orange-400' },
  { value: '2.2', label: 'Class 2.2 — Non-flammable Gas', color: 'text-green-400' },
  { value: '2.3', label: 'Class 2.3 — Toxic Gas',         color: 'text-red-500' },
  { value: '3',   label: 'Class 3 — Flammable Liquids',   color: 'text-orange-400' },
  { value: '4.1', label: 'Class 4.1 — Flammable Solids',  color: 'text-orange-400' },
  { value: '4.2', label: 'Class 4.2 — Spontaneous Combustion', color: 'text-red-400' },
  { value: '4.3', label: 'Class 4.3 — Dangerous When Wet', color: 'text-blue-400' },
  { value: '5.1', label: 'Class 5.1 — Oxidizing Substances', color: 'text-yellow-400' },
  { value: '5.2', label: 'Class 5.2 — Organic Peroxides', color: 'text-yellow-400' },
  { value: '6.1', label: 'Class 6.1 — Toxic Substances',  color: 'text-purple-400' },
  { value: '6.2', label: 'Class 6.2 — Infectious Substances', color: 'text-purple-500' },
  { value: '7',   label: 'Class 7 — Radioactive',         color: 'text-yellow-500' },
  { value: '8',   label: 'Class 8 — Corrosives',          color: 'text-orange-500' },
  { value: '9',   label: 'Class 9 — Miscellaneous DGR',   color: 'text-slate-400' },
]

export const PACKING_GROUPS = ['I', 'II', 'III']

// Operational hub — AWBs leaving here are departures (export), arriving here are arrivals (import).
export const HUB_AIRPORT = 'NKC'

export function awbDirection(awb, hub = HUB_AIRPORT) {
  if (awb?.origin === hub) return 'departure'
  if (awb?.destination === hub) return 'arrival'
  return 'other'
}

export const IATA_AIRPORTS = [
  // Hub
  { code: 'NKC', name: 'Nouakchott–Oumtounsy Intl', country: 'MR' },
  // Approved airline destinations
  { code: 'IST', name: 'Istanbul Airport', country: 'TR' },           // Turkish Airlines
  { code: 'CDG', name: 'Paris Charles de Gaulle', country: 'FR' },    // Mauritania Airlines
  { code: 'CMN', name: 'Casablanca Mohammed V', country: 'MA' },      // Royal Air Maroc
  { code: 'ALG', name: 'Algiers Houari Boumediene', country: 'DZ' },  // Air Algerie
  { code: 'TUN', name: 'Tunis-Carthage International', country: 'TN' }, // Tunis Air
  { code: 'LPA', name: 'Gran Canaria Airport', country: 'ES' },       // Binter Canarias / Swift Air
  { code: 'DSS', name: 'Dakar Blaise Diagne Intl', country: 'SN' },  // Air Senegal
  { code: 'LFW', name: 'Lomé-Tokoin International', country: 'TG' },  // ASKY Airline
  // Common connecting hubs
  { code: 'DXB', name: 'Dubai International', country: 'AE' },
  { code: 'LHR', name: 'London Heathrow', country: 'GB' },
  { code: 'ABJ', name: 'Port Bouet – Abidjan', country: 'CI' },
  { code: 'BKO', name: 'Bamako–Sénou International', country: 'ML' },
  { code: 'NDJ', name: 'N\'Djamena Hassan Djamous', country: 'TD' },
]
