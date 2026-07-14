import { existsSync } from 'fs'
import { JsonFormat, Level, PlainTextFormat } from '@tv2media/logger'
import { ConsoleVault, DefaultLogger } from '@tv2media/logger/node'

const JSON_LOG_ENVIRONMENTS = new Set(['production', 'stage', 'staging'])

function isRunningInContainer() {
    return existsSync('/.dockerenv')
}

function shouldUseJsonLogs() {
    const logFormat = process.env.SISYFOS_LOG_FORMAT?.toLowerCase()
    if (logFormat === 'json') return true
    if (logFormat === 'pretty' || logFormat === 'text') return false

    const nodeEnv = process.env.NODE_ENV?.toLowerCase() ?? ''
    return JSON_LOG_ENVIRONMENTS.has(nodeEnv) || isRunningInContainer()
}

export const logger = new DefaultLogger([
    new ConsoleVault({
        level: Level.TRACE,
        format: shouldUseJsonLogs()
            ? new JsonFormat({ isPretty: false })
            : new PlainTextFormat(),
        isFormatLocked: true,
    }),
])
