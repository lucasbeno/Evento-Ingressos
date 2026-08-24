import { BrowserQRCodeReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { apiErrorMessage } from '../../api/client'
import { listPublishedEvents } from '../../api/events'
import { validateTicket } from '../../api/gate'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { formatDateTime } from '../../lib/format'
import { GATE_RESULT_LABEL, GATE_RESULT_TONE } from '../../lib/status'
import type { GateValidationResponse } from '../../types'

export function GatePage() {
  const [eventId, setEventId] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [result, setResult] = useState<GateValidationResponse | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  const { data: events } = useQuery({ queryKey: ['events'], queryFn: listPublishedEvents })

  useEffect(() => () => controlsRef.current?.stop(), [])

  async function runValidation(code: string) {
    if (!eventId) {
      setValidationError('Selecione o evento primeiro')
      return
    }
    setValidating(true)
    setValidationError(null)
    try {
      const response = await validateTicket(eventId, code)
      setResult(response)
    } catch (err) {
      setValidationError(apiErrorMessage(err, 'Não foi possível validar o ingresso'))
    } finally {
      setValidating(false)
    }
  }

  async function startScanning() {
    if (!eventId) {
      setCameraError('Selecione o evento primeiro')
      return
    }
    setCameraError(null)
    setScanning(true)
    try {
      const codeReader = new BrowserQRCodeReader()
      const controls = await codeReader.decodeFromVideoDevice(undefined, videoRef.current!, (scanResult) => {
        if (scanResult) {
          controls.stop()
          controlsRef.current = null
          setScanning(false)
          runValidation(scanResult.getText())
        }
      })
      controlsRef.current = controls
    } catch {
      setCameraError('Não foi possível acessar a câmera. Use a digitação manual abaixo.')
      setScanning(false)
    }
  }

  function stopScanning() {
    controlsRef.current?.stop()
    controlsRef.current = null
    setScanning(false)
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualCode.trim()) return
    runValidation(manualCode.trim())
  }

  function scanNext() {
    setResult(null)
    setManualCode('')
    setValidationError(null)
  }

  return (
    <div className="mx-auto max-w-md">
      <span className="text-sm font-semibold uppercase tracking-widest text-magenta">Portaria</span>
      <h1 className="mt-1 font-display text-5xl tracking-wide text-text">Validar ingresso</h1>

      <label className="mt-6 flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text-muted">Evento em check-in</span>
        <select
          value={eventId}
          onChange={(e) => {
            setEventId(e.target.value)
            setResult(null)
          }}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-lime/60"
        >
          <option value="">Selecione…</option>
          {events?.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} — {formatDateTime(event.eventDatetime)}
            </option>
          ))}
        </select>
      </label>

      {result ? (
        <ResultCard result={result} onScanNext={scanNext} />
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
            <video
              ref={videoRef}
              className={`aspect-square w-full bg-black object-cover ${scanning ? '' : 'hidden'}`}
              muted
              playsInline
            />
            {!scanning && (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 text-text-faint">
                <span className="text-4xl">📷</span>
                <span className="text-sm">Câmera desligada</span>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="mt-2 text-sm text-danger">{cameraError}</p>
          )}

          <Button
            type="button"
            variant={scanning ? 'danger' : 'primary'}
            className="mt-4 w-full"
            onClick={scanning ? stopScanning : startScanning}
          >
            {scanning ? 'Parar câmera' : 'Escanear QR pela câmera'}
          </Button>

          <div className="mt-6 flex items-center gap-3 text-xs text-text-faint">
            <div className="h-px flex-1 bg-border" />
            ou digite o código manualmente
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Código do ingresso"
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-lime/60"
            />
            <Button type="submit" variant="secondary" disabled={validating}>
              {validating ? 'Validando…' : 'Validar'}
            </Button>
          </form>

          {validationError && (
            <div className="mt-4">
              <ErrorState message={validationError} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ResultCard({ result, onScanNext }: { result: GateValidationResponse; onScanNext: () => void }) {
  const tone = GATE_RESULT_TONE[result.result]
  const emoji = result.result === 'VALID' ? '✓' : result.result === 'ALREADY_USED' ? '↺' : '✕'
  const toneClasses =
    tone === 'success'
      ? 'border-success/40 bg-success/10 text-success'
      : tone === 'warning'
        ? 'border-warning/40 bg-warning/10 text-warning'
        : 'border-danger/40 bg-danger/10 text-danger'

  return (
    <div className={`mt-6 rounded-2xl border p-6 text-center ${toneClasses}`}>
      <div className="text-5xl">{emoji}</div>
      <Badge tone={tone}>{GATE_RESULT_LABEL[result.result]}</Badge>
      <p className="mt-3 text-sm text-text">{result.message}</p>
      {result.customerName && (
        <p className="mt-1 text-xs text-text-muted">
          {result.customerName} · {result.eventTitle}
        </p>
      )}
      <Button onClick={onScanNext} className="mt-6 w-full">
        Validar próximo
      </Button>
    </div>
  )
}
