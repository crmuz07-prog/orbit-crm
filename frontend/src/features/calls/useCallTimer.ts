import { useEffect, useRef, useState } from 'react'

/** Live call timer; `seconds` can also be edited by hand when the call was not timed. */
export function useCallTimer() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const startedAt = useRef(0)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setSeconds(Math.round((Date.now() - startedAt.current) / 1000)), 500)
    return () => window.clearInterval(id)
  }, [running])

  const start = () => {
    startedAt.current = Date.now() - seconds * 1000
    setRunning(true)
  }

  return { seconds, setSeconds, running, start, stop: () => setRunning(false) }
}
