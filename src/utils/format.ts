/** Format number as SGD with thousands separator */
export function fmtSGD(n: number | null | undefined): string {
  if (n == null || isNaN(n) || !isFinite(n)) return '—'
  return Math.round(n).toLocaleString('en-SG')
}

/** Compact currency: $1.2M, $450K, $999 */
export function fmtSGDCompact(n: number | null | undefined): string {
  if (n == null || isNaN(n) || !isFinite(n)) return 'S$—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `S$${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `S$${(n / 1_000).toFixed(0)}K`
  return `S$${Math.round(n)}`
}

/** Dollar sign prefix, rounded */
export function fmtDollar(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '$—'
  return '$' + Math.round(n).toLocaleString('en-SG')
}

/** Percentage, fixed decimal places */
export function fmtPct(n: number | null | undefined, dec = 1): string {
  if (n == null || isNaN(n)) return '—%'
  return n.toFixed(dec) + '%'
}

/** Compact K/M label for chart axes */
export function fmtAxisLabel(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${Math.round(v)}`
}
