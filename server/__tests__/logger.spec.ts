describe('logger', () => {
    const originalEnv = process.env
    let stdoutWrite: jest.SpyInstance
    let stderrWrite: jest.SpyInstance

    beforeEach(() => {
        jest.resetModules()
        process.env = { ...originalEnv }
        stdoutWrite = jest
            .spyOn(process.stdout, 'write')
            .mockImplementation(() => true)
        stderrWrite = jest
            .spyOn(process.stderr, 'write')
            .mockImplementation(() => true)
    })

    afterEach(() => {
        stdoutWrite.mockRestore()
        stderrWrite.mockRestore()
        process.env = originalEnv
    })

    function getLoggedOutput() {
        const stdoutOutput = stdoutWrite.mock.calls
            .map((call) => String(call[0]))
            .join('')
        const stderrOutput = stderrWrite.mock.calls
            .map((call) => String(call[0]))
            .join('')
        return stdoutOutput + stderrOutput
    }

    it('emits data logs as single-line JSON when JSON format is enabled', () => {
        process.env.SISYFOS_LOG_FORMAT = 'json'

        const { logger } = require('../src/utils/logger')

        logger
            .data({ address: '/ping/123', args: [] })
            .debug('RECEIVED AUTOMATION MESSAGE: /ping/123')

        expect(stdoutWrite).toHaveBeenCalledTimes(1)
        const output = getLoggedOutput()

        expect(output.trim().split('\n')).toHaveLength(1)
        expect(JSON.parse(output)).toMatchObject({
            data: { address: '/ping/123', args: [] },
            level: 'debug',
            message: 'RECEIVED AUTOMATION MESSAGE: /ping/123',
        })
    })

    it('keeps pretty multiline logs when explicitly requested', () => {
        process.env.SISYFOS_LOG_FORMAT = 'pretty'

        const { logger } = require('../src/utils/logger')

        logger
            .data({ address: '/ping/123', args: [] })
            .debug('RECEIVED AUTOMATION MESSAGE: /ping/123')

        const output = getLoggedOutput()

        expect(output.trim().split('\n').length).toBeGreaterThan(1)
        expect(output).toContain('RECEIVED AUTOMATION MESSAGE: /ping/123')
    })

    it('uses single-line JSON logs in production', () => {
        process.env.NODE_ENV = 'production'

        const { logger } = require('../src/utils/logger')

        logger
            .data({ address: '/ping/123', args: [] })
            .warn('RECEIVED AUTOMATION MESSAGE: /ping/123')

        const output = getLoggedOutput()

        expect(output.trim().split('\n')).toHaveLength(1)
        expect(JSON.parse(output)).toMatchObject({
            data: { address: '/ping/123', args: [] },
            level: 'warn',
            message: 'RECEIVED AUTOMATION MESSAGE: /ping/123',
        })
    })
})
