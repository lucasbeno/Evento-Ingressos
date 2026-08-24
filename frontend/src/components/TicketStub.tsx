import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import type { TicketResponse } from '../types'
import { Badge } from './Badge'
import { formatDateTime } from '../lib/format'
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from '../lib/status'

export function TicketStub({ ticket }: { ticket: TicketResponse }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/ingressos/compartilhado/${ticket.shareToken}`

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="ticket-perforation flex overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-1 flex-col justify-between gap-4 p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-magenta">
            {formatDateTime(ticket.eventDatetime)}
          </span>
          <h3 className="mt-1 font-display text-3xl tracking-wide text-text">{ticket.eventTitle}</h3>
          <p className="mt-1 text-sm text-text-muted">
            {ticket.venueName} · {ticket.venueCity}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Badge>
          {ticket.usedAt && <span className="text-xs text-text-faint">em {formatDateTime(ticket.usedAt)}</span>}
        </div>

        <button
          onClick={copyLink}
          className="w-fit text-xs font-semibold text-text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-lime"
        >
          {copied ? 'Link copiado!' : 'Copiar link de compartilhamento'}
        </button>
      </div>

      <div className="flex w-44 flex-none flex-col items-center justify-center gap-3 border-l border-dashed border-border bg-surface-raised p-5">
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG value={ticket.qrCode} size={104} />
        </div>
        <span className="text-center text-[10px] uppercase tracking-wider text-text-faint">
          Apresente na entrada
        </span>
      </div>
    </div>
  )
}
