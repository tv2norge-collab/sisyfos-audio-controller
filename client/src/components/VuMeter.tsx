import * as React from 'react'
import { connect } from 'react-redux'
import { vuMeters } from '../utils/SocketClientHandlers'

const FPS_INTERVAL = 1000 / 15

//assets:
import '../assets/css/VuMeter.css'
//Utils:

export interface VuMeterInjectedProps {
    faderIndex: number
    channel: number
}

interface VuMeterProps {
    faderIndex: number
}

// Define colors as constants to avoid object creation in render loop
const COLORS = {
    LOWER: 'rgb(0, 122, 37)',
    MIDDLE: 'rgb(53, 167, 0)',
    UPPER: 'rgb(206, 0, 0)',
    WINDOW_PEAK_LOW: 'rgb(16, 56, 0)',
    WINDOW_PEAK_HIGH: 'rgb(100, 100, 100)',
    TOTAL_PEAK_LOW: 'rgb(64, 64, 64)',
    TOTAL_PEAK_HIGH: 'rgb(255, 0, 0)'
}


export class VuMeter extends React.PureComponent<VuMeterInjectedProps> {
    private canvas: HTMLCanvasElement | undefined
    private _context: CanvasRenderingContext2D | undefined
    private animationFrame: number | undefined
    
    private totalHeight: number = 400
    private totalPeak: number = 0
    private windowPeak: number = 0
    private windowLast: number = 0
    private meterMax: number = 1
    private meterMin: number = 0
    private range: number = 1
    private meterTest: number = 0.75
    private meterZero: number = 0.75
    private readonly WINDOW: number = 2000

    private _previousVal = -1
    private _value = 0

    private lastUpdateTime = Date.now()

    constructor(props: any) {
        super(props)
        this.meterMax = window.mixerProtocol.meter?.max || 1
        this.meterMin = window.mixerProtocol.meter?.min || 0
        this.range = this.meterMax - this.meterMin
        this.meterTest = window.mixerProtocol.meter?.test || 0.75
        this.meterZero = window.mixerProtocol.meter?.zero || 0.75
        this.totalHeight = 400
    }

    componentDidMount() {
        this.initializeCanvas()
        this.paintVuMeter()
    }

    componentWillUnmount() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
        }
    }

    shouldComponentUpdate(): boolean {
        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime < FPS_INTERVAL) {
            return false;
        }
        this.lastUpdateTime = currentTime;
        return true;
    }


    private initializeCanvas() {
        if (!this.canvas) return
        
        this._context = this.canvas.getContext('2d', {
            antialias: false,
            stencil: false,
            preserveDrawingBuffer: true
        }) as CanvasRenderingContext2D

        this.totalHeight = (this.canvas.height ?? 400) / (this.meterMax - this.meterMin)
    }

    getTotalPeak = () => {
        if (this._value > this.totalPeak) {
            this.totalPeak = this._value
        }
        return this.totalHeight * this.totalPeak
    }

    getWindowPeak = () => {
        if (
            this._value > this.windowPeak ||
            Date.now() - this.windowLast > this.WINDOW
        ) {
            this.windowPeak = this._value
            this.windowLast = Date.now()
        }
        return this.totalHeight * this.windowPeak
    }

    private calcLower = () => {
        return this.totalHeight * Math.min(this._value, this.meterTest)
    }

    private calcMiddle = () => {
        const val = Math.max(this.meterTest, Math.min(this._value, this.meterZero))
        return this.totalHeight * (val - this.meterTest) + 1
    }

    private calcUpper = () => {
        const val = Math.max(this.meterZero, this._value)
        return this.totalHeight * (val - this.meterZero) + 1
    }

    private setRef = (el: HTMLCanvasElement) => {
        this.canvas = el
        this.initializeCanvas()
        this.paintVuMeter()
    }

    resetTotalPeak = () => {
        this.totalPeak = 0
    }

    paintVuMeter = () => {
        if (!this.canvas || !this._context) {
            this.animationFrame = requestAnimationFrame(this.paintVuMeter)
            return
        }

        this._value = vuMeters[this.props.faderIndex]?.[this.props.channel] || 0

        if (this._value === this._previousVal) {
            window.requestAnimationFrame(this.paintVuMeter)
            return
        }
        this._previousVal = this._value

        if (!this._context) return
        this._context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // lower part
        this._context.fillStyle = COLORS.LOWER
        this._context.fillRect(
            0,
            this.totalHeight - this.calcLower(),
            this.canvas.height,
            this.calcLower(),
        )

        // middle part
        this._context.fillStyle = COLORS.MIDDLE
        this._context.fillRect(
            0,
            this.totalHeight * (this.range - this.meterTest) - this.calcMiddle(),
            this.canvas.width,
            this.calcMiddle(),
        )

        // upper part (too high/clip)
        this._context.fillStyle = COLORS.UPPER
        this._context.fillRect(
            0,
            this.totalHeight * (this.range - this.meterZero) - this.calcUpper(),
            this.canvas.width,
            this.calcUpper(),
        )


        // windowed peak
        const windowPeak = this.getWindowPeak()
        this._context.fillStyle = this.windowPeak < this.meterZero ? 
            COLORS.WINDOW_PEAK_LOW : 
            COLORS.WINDOW_PEAK_HIGH
        this._context.fillRect(0, this.totalHeight - windowPeak, this.canvas.width, 2)

        // Draw total peak
        this._context.fillStyle = this.totalPeak < this.meterZero ? 
            COLORS.TOTAL_PEAK_LOW : 
            COLORS.TOTAL_PEAK_HIGH
        this._context.fillRect(0, this.totalHeight - this.getTotalPeak(), this.canvas.width, 2)


        window.requestAnimationFrame(this.paintVuMeter)
    }

    render() {
        return (
            <div className="vumeter-body" onClick={this.resetTotalPeak}>
                <canvas
                    className="vumeter-canvas"
                    style={{
                        height: this.totalHeight,
                        top: '10px',
                    }}
                    height={this.totalHeight}
                    width={10}
                    ref={this.setRef}
                ></canvas>
            </div>
        )
    }    
}

const mapStateToProps = (state: any, props: any): VuMeterInjectedProps => {
    return {
        faderIndex: props.faderIndex,
        channel: props.channel,
    }
}

export default connect<VuMeterInjectedProps, any, any>(mapStateToProps)(VuMeter)
