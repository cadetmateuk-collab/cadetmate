'use client'

import { useEffect, useState } from 'react'

const PORTS = [
  { name: 'Houston',     tz: 'America/Chicago',  lat: '29.7°N', lng: '95.3°W'  },  // -95.3
  { name: 'Southampton', tz: 'Europe/London',    lat: '50.9°N', lng: '1.4°W'   },  // -1.4
  { name: 'Rotterdam',   tz: 'Europe/Amsterdam', lat: '51.9°N', lng: '4.5°E'   },  // +4.5
  { name: 'Hamburg',     tz: 'Europe/Berlin',    lat: '53.5°N', lng: '10.0°E'  },  // +10.0
  { name: 'Jebel Ali',   tz: 'Asia/Dubai',       lat: '24.9°N', lng: '55.1°E'  },  // +55.1
  { name: 'Singapore',   tz: 'Asia/Singapore',   lat: '1.3°N',  lng: '103.8°E' },  // +103.8
  { name: 'Manila',      tz: 'Asia/Manila',      lat: '14.6°N', lng: '120.9°E' },  // +120.9
  { name: 'Shanghai',    tz: 'Asia/Shanghai',    lat: '31.2°N', lng: '121.5°E' },  // +121.5
  { name: 'Busan',       tz: 'Asia/Seoul',       lat: '35.1°N', lng: '129.0°E' },  // +129.0
  { name: 'Tokyo',       tz: 'Asia/Tokyo',       lat: '35.6°N', lng: '139.7°E' },  // +139.7
] as const

function getTime(tz: string) {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function PortClocks() {
  const [times, setTimes] = useState<Record<string, string>>({})

  useEffect(() => {
    const tick = () => {
      const next: Record<string, string> = {}
      for (const p of PORTS) next[p.name] = getTime(p.tz)
      setTimes(next)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-5">
      {PORTS.map((port, i) => (
        <div key={port.name} className="flex items-center gap-4">
          {i > 0 && <div className="h-6 w-px bg-border" aria-hidden="true" />}
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold leading-tight">{port.name}</span>
            <span className="text-[11px] font-mono font-bold tabular-nums text-primary leading-tight">
              {times[port.name] ?? '--:--'}
            </span>
            <span className="text-[9px] text-muted-foreground/50 leading-tight tabular-nums">{port.lat} {port.lng}</span>
          </div>
        </div>
      ))}
    </div>
  )
}