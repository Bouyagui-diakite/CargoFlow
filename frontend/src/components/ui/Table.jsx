import { cn } from '../../lib/utils'

export function Table({ className, children }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Th({ className, children }) {
  return (
    <th className={cn('text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap', className)}>
      {children}
    </th>
  )
}

export function Td({ className, children }) {
  return (
    <td className={cn('px-4 py-3 text-slate-300', className)}>
      {children}
    </td>
  )
}

export function Tr({ className, children, onClick }) {
  return (
    <tr
      className={cn('table-row', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}
