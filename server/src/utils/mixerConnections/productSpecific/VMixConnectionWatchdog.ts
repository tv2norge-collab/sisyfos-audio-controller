/** If no XML received within 2 seconds, reconnect the feedback connection */
const CONNECTION_WATCHDOG_MS = 2000

export class VMixConnectionWatchdog {
    private watchdogTimeout: NodeJS.Timeout | null = null

    constructor(private readonly onTimeout: () => void) {}

    start() {
        this.stop()
        this.watchdogTimeout = setTimeout(() => {
            this.onTimeout()
        }, CONNECTION_WATCHDOG_MS)
    }

    stop() {
        if (this.watchdogTimeout) {
            clearTimeout(this.watchdogTimeout)
            this.watchdogTimeout = null
        }
    }
}
