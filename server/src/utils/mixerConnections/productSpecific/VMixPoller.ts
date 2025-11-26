/** We usually poll 80 milliseconds after last XML requested */
const DEFAULT_POLL_INTERVAL_MS = 80
/** We try to limit polling to at least 20 milliseconds since last XML received */
const DEFAULT_MIN_POLL_INTERVAL_MS = 20
/** We fallback to polling aditionally in 500 milliseconds if no XML received */
const FALLBACK_POLL_INTERVAL_MS = 500

export class VMixPoller {
    private pollingTimeout: NodeJS.Timeout | null = null
    private lastRequestTime: number = 0

    constructor(
        private readonly sendRequest: () => void,
        private readonly isConnected: () => boolean,
        private readonly onFallbackTriggered: () => void
    ) {}

    start() {
        this.scheduleNextPoll()
    }

    onResponseReceived() {
        this.scheduleNextPoll()
    }

    stop() {
        this.clear()
    }

    private clear() {
        if (this.pollingTimeout) {
            clearTimeout(this.pollingTimeout)
            this.pollingTimeout = null
        }
    }

    private scheduleNextPoll() {
        this.clear()

        if (!this.isConnected()) {
            return
        }

        const elapsed = this.lastRequestTime
            ? performance.now() - this.lastRequestTime
            : 0
        const delay = Math.max(
            DEFAULT_MIN_POLL_INTERVAL_MS,
            DEFAULT_POLL_INTERVAL_MS - elapsed
        )

        this.pollingTimeout = setTimeout(() => {
            this.sendRequestAndScheduleFallback()
        }, delay)
    }

    private scheduleFallbackPoll() {
        this.clear()

        if (!this.isConnected()) {
            return
        }

        this.pollingTimeout = setTimeout(() => {
            this.onFallbackTriggered()
            this.sendRequestAndScheduleFallback()
        }, FALLBACK_POLL_INTERVAL_MS)
    }

    private sendRequestAndScheduleFallback() {
        if (!this.isConnected()) {
            return
        }
        this.lastRequestTime = performance.now()
        this.sendRequest()
        this.scheduleFallbackPoll()
    }
}
