import * as React from 'react'
import { useEffect, useMemo, useRef } from 'react'

import '../assets/css/VuMeter.css'

const PAINT_INTERVAL = 1000 / 15
const PEAK_WINDOW = 2000
const BASE_HEIGHT = 400

export interface SisyfosMeterConfig {
    min?: number
    max?: number
    zero?: number
    test?: number
}

export interface SisyfosVuMeterProps {
    getLevel: () => number
    meterConfig?: SisyfosMeterConfig
}

const COLORS = {
    LOWER: 'rgb(0, 122, 37)',
    MIDDLE: 'rgb(53, 167, 0)',
    UPPER: 'rgb(206, 0, 0)',
    WINDOW_PEAK_LOW: 'rgb(16, 56, 0)',
    WINDOW_PEAK_HIGH: 'rgb(100, 100, 100)',
    TOTAL_PEAK_LOW: 'rgb(64, 64, 64)',
    TOTAL_PEAK_HIGH: 'rgb(255, 0, 0)',
}

export function SisyfosVuMeter({
    getLevel,
    meterConfig,
}: SisyfosVuMeterProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const getLevelRef = useRef(getLevel)
    getLevelRef.current = getLevel

    const totalPeakRef = useRef(0)
    const dirtyRef = useRef(false)

    const { totalHeight, range, meterTest, meterZero } = useMemo(() => {
        const max = meterConfig?.max ?? 1
        const min = meterConfig?.min ?? 0
        const range = max - min
        return {
            range,
            totalHeight: BASE_HEIGHT / range,
            meterTest: meterConfig?.test ?? 0.75,
            meterZero: meterConfig?.zero ?? 0.75,
        }
    }, [meterConfig])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const canvasContext = canvas.getContext('2d')
        if (!canvasContext) return

        let animationFrame: number | undefined
        let previousValue = -1
        let lastPaintTime = 0
        let windowPeak = 0
        let windowLast = 0

        const paint = (now: DOMHighResTimeStamp) => {
            animationFrame = requestAnimationFrame(paint)

            if (now - lastPaintTime < PAINT_INTERVAL) return

            const value = getLevelRef.current()

            const windowStale =
                now - windowLast > PEAK_WINDOW && windowPeak !== value
            if (
                value === previousValue &&
                !windowStale &&
                !dirtyRef.current
            ) {
                return
            }
            lastPaintTime = now
            previousValue = value
            dirtyRef.current = false

            if (value > windowPeak || now - windowLast > PEAK_WINDOW) {
                windowPeak = value
                windowLast = now
            }
            if (value > totalPeakRef.current) {
                totalPeakRef.current = value
            }
            const totalPeak = totalPeakRef.current

            const lower = totalHeight * Math.min(value, meterTest)
            const middle =
                totalHeight *
                    (Math.max(meterTest, Math.min(value, meterZero)) -
                        meterTest) +
                1
            const upper =
                totalHeight * (Math.max(meterZero, value) - meterZero) + 1

            canvasContext.clearRect(0, 0, canvas.width, canvas.height)

            canvasContext.fillStyle = COLORS.LOWER
            canvasContext.fillRect(
                0,
                totalHeight - lower,
                canvas.width,
                lower
            )

            canvasContext.fillStyle = COLORS.MIDDLE
            canvasContext.fillRect(
                0,
                totalHeight * (range - meterTest) - middle,
                canvas.width,
                middle
            )

            canvasContext.fillStyle = COLORS.UPPER
            canvasContext.fillRect(
                0,
                totalHeight * (range - meterZero) - upper,
                canvas.width,
                upper
            )

            canvasContext.fillStyle =
                windowPeak < meterZero
                    ? COLORS.WINDOW_PEAK_LOW
                    : COLORS.WINDOW_PEAK_HIGH
            canvasContext.fillRect(
                0,
                totalHeight - totalHeight * windowPeak,
                canvas.width,
                2
            )

            canvasContext.fillStyle =
                totalPeak < meterZero
                    ? COLORS.TOTAL_PEAK_LOW
                    : COLORS.TOTAL_PEAK_HIGH
            canvasContext.fillRect(
                0,
                totalHeight - totalHeight * totalPeak,
                canvas.width,
                2
            )
        }

        const start = () => {
            if (animationFrame === undefined) {
                animationFrame = requestAnimationFrame(paint)
            }
        }
        const stop = () => {
            if (animationFrame !== undefined) {
                cancelAnimationFrame(animationFrame)
                animationFrame = undefined
            }
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    start()
                } else {
                    stop()
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(canvas)

        return () => {
            stop()
            observer.disconnect()
        }
    }, [totalHeight, range, meterTest, meterZero])

    const resetTotalPeak = () => {
        totalPeakRef.current = 0
        dirtyRef.current = true
    }

    return (
        <div className="vumeter-body" onClick={resetTotalPeak}>
            <canvas
                className="vumeter-canvas"
                style={{
                    height: totalHeight,
                    top: '10px',
                }}
                height={totalHeight}
                width={10}
                ref={canvasRef}
            ></canvas>
        </div>
    )
}

export default SisyfosVuMeter
