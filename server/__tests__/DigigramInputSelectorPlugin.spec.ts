import { DigigramInputSelectorPlugin } from '../src/utils/inputSelectorPlugins/digigram/DigigramInputSelectorPlugin'
import { DigigramInputSelectorOptions } from '../../shared/src/inputSelectorPlugins/digigram/DigigramInputSelectorPluginOptions'

type SocketEvent = 'open' | 'close' | 'error' | 'message'

type SocketHandlers = {
    open?: () => void
    close?: () => void
    error?: (error: Error) => void
    message?: (raw: Buffer) => void
}

type TestSocket = {
    handlers: SocketHandlers
    sentPayloads: string[]
    on: (
        event: SocketEvent,
        handler: (...args: unknown[]) => void
    ) => TestSocket
    off: (
        event: SocketEvent,
        handler: (...args: unknown[]) => void
    ) => TestSocket
    send: (payload: string) => void
    close: () => void
    terminate: () => void
}

jest.mock('ws', () => jest.fn())

describe('DigigramInputSelectorPlugin', () => {
    let socket: TestSocket
    const createdPlugins: DigigramInputSelectorPlugin[] = []

    const emit = (event: SocketEvent, payload?: Buffer | Error) => {
        if (event === 'open') {
            socket.handlers.open?.()
            return
        }

        if (event === 'close') {
            socket.handlers.close?.()
            return
        }

        if (event === 'error' && payload instanceof Error) {
            socket.handlers.error?.(payload)
            return
        }

        if (event === 'message' && payload instanceof Buffer) {
            socket.handlers.message?.(payload)
        }
    }

    const emitMessage = (payload: object[]) => {
        emit('message', Buffer.from(JSON.stringify(payload)))
    }

    const parsedSentPayloads = (): object[] =>
        socket.sentPayloads.flatMap(
            (payload) => JSON.parse(payload) as object[]
        )

    beforeEach(() => {
        createdPlugins.length = 0
        socket = {
            handlers: {},
            sentPayloads: [],
            on(event, handler) {
                if (event === 'open') this.handlers.open = handler as () => void
                if (event === 'close') {
                    this.handlers.close = handler as () => void
                }
                if (event === 'error') {
                    this.handlers.error = handler as (error: Error) => void
                }
                if (event === 'message') {
                    this.handlers.message = handler as (raw: Buffer) => void
                }
                return this
            },
            off(event, handler) {
                if (event === 'open' && this.handlers.open === handler) {
                    delete this.handlers.open
                }
                if (event === 'close' && this.handlers.close === handler) {
                    delete this.handlers.close
                }
                if (event === 'error' && this.handlers.error === handler) {
                    delete this.handlers.error
                }
                if (event === 'message' && this.handlers.message === handler) {
                    delete this.handlers.message
                }
                return this
            },
            send(payload) {
                this.sentPayloads.push(payload)
            },
            close() {
                // no-op for test socket
            },
            terminate() {
                // no-op for test socket
            },
        }

        const mockWsCtor = jest.requireMock('ws') as jest.Mock
        mockWsCtor.mockReset()
        mockWsCtor.mockImplementation(() => socket)
    })

    afterEach(() => {
        for (const plugin of createdPlugins) {
            plugin.disconnect()
        }
        createdPlugins.length = 0
    })

    const createPlugin = (
        onExternalUpdate = jest.fn(),
        onStatus = jest.fn(),
        options: Partial<DigigramInputSelectorOptions> = {}
    ) => {
        const plugin = new DigigramInputSelectorPlugin(
            {
                url: 'ws://localhost:1234',
                channelMappings: [
                    {
                        sisyfosChannel: 7,
                        digigramOutChannel: 30,
                        inputChannelFirst: 10,
                        inputChannelLast: 15,
                    },
                ],
                ...options,
            },
            {
                mixerIndex: 0,
                onExternalUpdate,
                onStatus,
            }
        )
        createdPlugins.push(plugin)
        return plugin
    }

    it('starts disconnected with zero reconnect attempts', () => {
        const plugin = createPlugin()

        expect(plugin.getStatus()).toEqual({
            connected: false,
            reconnectAttempts: 0,
            lastMessageAt: undefined,
            lastStateSyncAt: undefined,
            lastErrorAt: undefined,
        })
    })

    it('does not throw when selector change is sent before handshake', () => {
        const plugin = createPlugin()

        expect(() => {
            plugin.sendSelectorChange({
                channelIndex: 7,
                inputSelected: 12,
            })
        }).not.toThrow()
    })

    it('disconnect is safe before connect', () => {
        const plugin = createPlugin()

        expect(() => plugin.disconnect()).not.toThrow()
    })

    it('sends handshake payload on socket open', () => {
        const plugin = createPlugin()

        plugin.connect()
        emit('open')

        expect(parsedSentPayloads()).toContainEqual({
            channel: '/meta/handshake',
            version: '1.0',
            minimumVersion: '0.9',
            supportedConnectionTypes: [
                'websocket',
                'long-polling',
                'callback-polling',
            ],
            advice: {
                timeout: 60000,
                interval: 0,
            },
            id: '1',
        })
    })

    it('sends connect payload after successful handshake', () => {
        const plugin = createPlugin()

        plugin.connect()
        emit('open')
        emitMessage([
            {
                channel: '/meta/handshake',
                successful: true,
                clientId: 'client-1',
            },
        ])

        expect(parsedSentPayloads()).toContainEqual({
            channel: '/meta/connect',
            connectionType: 'websocket',
            clientId: 'client-1',
            id: '2',
            advice: {
                timeout: 0,
            },
        })
    })

    it('sends selector change payload mapped to digigram channels', () => {
        const plugin = createPlugin()

        plugin.connect()
        emit('open')
        emitMessage([
            {
                channel: '/meta/handshake',
                successful: true,
                clientId: 'client-1',
            },
        ])

        plugin.sendSelectorChange({
            channelIndex: 7,
            inputSelected: 12,
        })

        expect(parsedSentPayloads()).toContainEqual({
            channel: '/service/ravenna/settings',
            clientId: 'client-1',
            id: '3',
            data: {
                path: '$.actions.create_path',
                value: {
                    overwrite: true,
                    ins: [
                        {
                            io_group_id: '1',
                            channel_id: 12,
                        },
                    ],
                    outs: [
                        [
                            {
                                io_group_id: '30',
                                channel_id: 30,
                            },
                        ],
                    ],
                },
            },
        })
    })

    it('maps ravenna settings payload to external update callback', () => {
        const onExternalUpdate = jest.fn()
        const plugin = createPlugin(onExternalUpdate)

        plugin.connect()
        emit('open')
        emitMessage([
            {
                channel: '/ravenna/settings',
                data: {
                    value: {
                        ins: [
                            {
                                io_group_id: '1',
                                channel_id: 12,
                            },
                        ],
                        outs: [
                            [
                                {
                                    io_group_id: '30',
                                    channel_id: 30,
                                },
                            ],
                        ],
                    },
                },
            },
        ])

        expect(onExternalUpdate).toHaveBeenCalledWith({
            channelIndex: 7,
            inputSelected: 12,
            timestamp: expect.any(Number),
        })
    })
})
