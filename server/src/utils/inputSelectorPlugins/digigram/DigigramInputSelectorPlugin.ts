import WebSocket from 'ws'
import {
    DigigramChannelMapping,
    DigigramInputSelectorOptions,
} from '../../../../../shared/src/inputSelectorPlugins/digigram/DigigramInputSelectorPluginOptions'
import { logger } from '../../logger'
import {
    InputSelectorPluginStatus,
    InputSelectorUpdate,
    InputSelectorPluginContext,
    MixerInputSelectorPlugin,
} from '../InputSelectorPlugin'

interface DigigramStateMessage {
    channel: string
    successful?: boolean
    clientId?: string
    id?: string
    subscription?: string
    error?: string
    advice?: {
        reconnect?: string
        interval?: number
        timeout?: number
    }
    data?: {
        path?: string
        value?:
            | {
                  overwrite?: boolean
                  ins?: Array<{
                      io_group_id?: string
                      channel_id?: number
                  }>
                  outs?: Array<
                      Array<{
                          io_group_id?: string
                          channel_id?: number
                      }>
                  >
                  _connections?: Array<{
                      in?: {
                          io_group_id?: string
                          channel_id?: number
                      }
                      out?: {
                          io_group_id?: string
                          channel_id?: number
                      }
                  }>
              }
            | Array<{
                  in?: {
                      io_group_id?: string
                      channel_id?: number
                  }
                  out?: {
                      io_group_id?: string
                      channel_id?: number
                  }
              }>
    }
}

export class DigigramInputSelectorPlugin implements MixerInputSelectorPlugin {
    private static readonly HANDSHAKE_CHANNEL = '/meta/handshake'
    private static readonly CONNECT_CHANNEL = '/meta/connect'
    private static readonly SUBSCRIBE_CHANNEL = '/meta/subscribe'
    private static readonly SETTINGS_CHANNEL = '/ravenna/settings'
    private static readonly SERVICE_SETTINGS_CHANNEL =
        '/service/ravenna/settings'
    private static readonly COMMAND_CHANNEL = '/service/ravenna/commands'
    private static readonly CREATE_PATH = '$.actions.create_path'
    private static readonly DEFAULT_RECONNECT_DELAY_MS = 2000
    private static readonly DEFAULT_HEARTBEAT_INTERVAL_MS = 5000
    private static readonly DEFAULT_STALE_TIMEOUT_MS = 20000
    private static readonly DEFAULT_CONNECT_INTERVAL_MS = 1000
    private static readonly LOCAL_CHANGE_LOCK_MS = 1000

    private readonly configOptions: DigigramInputSelectorOptions
    private readonly context: InputSelectorPluginContext

    private socket: WebSocket | undefined
    private reconnectTimer: NodeJS.Timeout | undefined
    private heartbeatTimer: NodeJS.Timeout | undefined
    private connected = false
    private reconnectAttempts = 0
    private lastMessageAt: number | undefined
    private lastStateSyncAt: number | undefined
    private lastErrorAt: number | undefined
    private clientId: string | undefined
    private connectTimer: NodeJS.Timeout | undefined
    private messageSequence = 0
    private initialStateRequested = false
    private initialConnectSent = false
    private readonly localChangeLockByChannel = new Map<
        number,
        NodeJS.Timeout
    >()
    private readonly pendingExternalByChannel = new Map<
        number,
        { channelNumber: number; inputSelected: number }
    >()
    private readonly sisyfosToChannelMapping = new Map<
        number,
        DigigramChannelMapping
    >()
    private readonly digigramOutToChannelMapping = new Map<
        number,
        DigigramChannelMapping
    >()

    constructor(
        pluginOptions: DigigramInputSelectorOptions,
        context: InputSelectorPluginContext
    ) {
        this.configOptions = pluginOptions
        this.context = context
        this.initializeChannelMappings(pluginOptions.channelMappings)
    }

    connect(): void {
        if (this.socket) return

        try {
            this.socket = new WebSocket(
                this.normalizeWebSocketUrl(this.configOptions.url)
            )
            this.socket.on('open', this.onOpen)
            this.socket.on('close', this.onClose)
            this.socket.on('error', this.onError)
            this.socket.on('message', this.onMessage)
        } catch (error) {
            logger.data(error).error('Digigram input selector websocket failed')
            this.lastErrorAt = Date.now()
            this.emitStatus()
            this.scheduleReconnect()
        }
    }

    disconnect(): void {
        this.clearReconnectTimer()
        this.clearHeartbeatTimer()
        this.clearConnectTimer()

        if (!this.socket) return

        this.socket.off('open', this.onOpen)
        this.socket.off('close', this.onClose)
        this.socket.off('error', this.onError)
        this.socket.off('message', this.onMessage)
        this.socket.close()
        this.socket = undefined
        this.clientId = undefined
        this.initialStateRequested = false
        this.initialConnectSent = false
        this.connected = false
        this.emitStatus()
    }

    requestState(): void {
        this.sendSubscribe(DigigramInputSelectorPlugin.SETTINGS_CHANNEL)
        this.sendUpdateCommand()
    }

    sendSelectorChange(change: InputSelectorUpdate): void {
        if (!this.clientId) {
            logger
                .data(change)
                .debug(
                    'Digigram selector change dropped: missing clientId (not handshaked yet)'
                )
            return
        }

        const channelNumber = change.channelIndex
        const digigramOutChannel = this.getDigigramOutChannel(channelNumber)
        const digigramInputChannel = this.resolveDigigramInputChannel(
            channelNumber,
            change.inputSelected
        )
        if (
            digigramOutChannel === undefined ||
            digigramInputChannel === undefined
        ) {
            logger
                .data({
                    change,
                    digigramOutChannel,
                    digigramInputChannel,
                })
                .debug(
                    'Digigram selector change dropped: unresolved channel mapping'
                )
            return
        }

        const existingLock = this.localChangeLockByChannel.get(channelNumber)
        if (existingLock) clearTimeout(existingLock)
        this.pendingExternalByChannel.delete(channelNumber)
        this.localChangeLockByChannel.set(
            channelNumber,
            setTimeout(() => {
                this.localChangeLockByChannel.delete(channelNumber)
                const pending = this.pendingExternalByChannel.get(channelNumber)
                if (pending) {
                    this.pendingExternalByChannel.delete(channelNumber)
                    const timestamp = Date.now()
                    this.context.onExternalUpdate({
                        channelIndex: pending.channelNumber,
                        inputSelected: pending.inputSelected,
                        timestamp,
                    })
                    this.lastStateSyncAt = timestamp
                    this.emitStatus()
                }
            }, DigigramInputSelectorPlugin.LOCAL_CHANGE_LOCK_MS)
        )

        this.send({
            channel: DigigramInputSelectorPlugin.SERVICE_SETTINGS_CHANNEL,
            clientId: this.clientId,
            id: this.nextMessageId(),
            data: {
                path: DigigramInputSelectorPlugin.CREATE_PATH,
                value: {
                    overwrite: true,
                    ins: [
                        {
                            io_group_id: '1',
                            channel_id: digigramInputChannel,
                        },
                    ],
                    outs: [
                        [
                            {
                                io_group_id: '30',
                                channel_id: digigramOutChannel,
                            },
                        ],
                    ],
                },
            },
        })
    }

    private onOpen = () => {
        this.connected = true
        this.reconnectAttempts = 0
        this.lastMessageAt = Date.now()
        this.clientId = undefined
        this.initialStateRequested = false
        this.initialConnectSent = false
        this.startHeartbeat()
        this.emitStatus()
        logger.info('Digigram input selector websocket connected')
        this.sendHandshake()
    }

    private onClose = () => {
        this.connected = false
        this.clearHeartbeatTimer()
        this.clearConnectTimer()
        this.socket = undefined
        this.clientId = undefined
        this.initialStateRequested = false
        this.initialConnectSent = false
        this.emitStatus()
        logger.warn('Digigram input selector websocket disconnected')
        this.scheduleReconnect()
    }

    private onError = (error: Error) => {
        this.lastErrorAt = Date.now()
        this.emitStatus()
        logger.data(error).error('Digigram input selector websocket error')
    }

    private onMessage = (raw: WebSocket.RawData) => {
        let payload: DigigramStateMessage | DigigramStateMessage[]
        const rawText = raw.toString()

        try {
            payload = JSON.parse(rawText) as
                | DigigramStateMessage
                | DigigramStateMessage[]
        } catch (error) {
            logger
                .data(error)
                .warn('Digigram input selector websocket payload not json')
            logger
                .data({ raw: rawText })
                .debug(
                    'Digigram input selector websocket received non-json payload'
                )
            return
        }

        logger
            .data({ payload: rawText.slice(0, 1000) })
            .debug('Digigram input selector websocket received payload')

        this.lastMessageAt = Date.now()
        const messages = Array.isArray(payload) ? payload : [payload]
        for (const message of messages) {
            this.handleMessage(message)
        }
    }

    private handleMessage(message: DigigramStateMessage) {
        if (message.channel === DigigramInputSelectorPlugin.HANDSHAKE_CHANNEL) {
            if (!message.successful || !message.clientId) {
                logger.warn('Digigram input selector cometd handshake failed')
                return
            }

            this.clientId = message.clientId
            this.sendConnect()
            this.emitStatus()
            return
        }

        if (message.channel === DigigramInputSelectorPlugin.CONNECT_CHANNEL) {
            if (message.successful && this.clientId) {
                if (!this.initialStateRequested) {
                    this.requestState()
                    this.initialStateRequested = true
                }
                this.clearConnectTimer()
                this.connectTimer = setTimeout(() => {
                    this.sendConnect()
                }, DigigramInputSelectorPlugin.DEFAULT_CONNECT_INTERVAL_MS)
            }
            return
        }

        if (message.channel === DigigramInputSelectorPlugin.SUBSCRIBE_CHANNEL) {
            if (!message.successful && message.subscription) {
                logger.warn(
                    `Digigram input selector cometd subscribe failed for ${message.subscription}`
                )
            }
            return
        }

        if (message.channel === DigigramInputSelectorPlugin.SETTINGS_CHANNEL) {
            const updates = this.extractSelectorUpdates(message)
            for (const update of updates) {
                if (this.localChangeLockByChannel.has(update.channelNumber)) {
                    this.pendingExternalByChannel.set(
                        update.channelNumber,
                        update
                    )
                    continue
                }
                const timestamp = Date.now()
                this.context.onExternalUpdate({
                    channelIndex: update.channelNumber,
                    inputSelected: update.inputSelected,
                    timestamp,
                })
                this.lastStateSyncAt = timestamp
            }

            if (updates.length) {
                this.emitStatus()
            }
        }
    }

    private extractSelectorUpdates(
        message: DigigramStateMessage
    ): Array<{ channelNumber: number; inputSelected: number }> {
        const updates: Array<{ channelNumber: number; inputSelected: number }> =
            []

        const directValue = message.data?.value
        if (directValue && !Array.isArray(directValue)) {
            const directInputChannel = directValue.ins?.[0]?.channel_id
            const directOutChannel = directValue.outs?.[0]?.[0]?.channel_id
            const directUpdate = this.mapDigigramChannelsToSelectorUpdate(
                directOutChannel,
                directInputChannel
            )
            if (directUpdate) {
                updates.push(directUpdate)
            }
        }

        const connections = this.extractConnectionsFromMessage(message)
        for (const connection of connections) {
            const inGroupId = connection.in?.io_group_id
            const outGroupId = connection.out?.io_group_id
            const inChannel = connection.in?.channel_id
            const outChannel = connection.out?.channel_id

            // For selector assignments, we only care about Routing input (group 1)
            // connected to Routing output bus (group 30).
            if (inGroupId !== '1' || outGroupId !== '30') {
                continue
            }

            const mapped = this.mapDigigramChannelsToSelectorUpdate(
                outChannel,
                inChannel
            )
            if (mapped) {
                updates.push(mapped)
            }
        }

        return updates
    }

    private extractConnectionsFromMessage(
        message: DigigramStateMessage
    ): Array<{
        in?: { io_group_id?: string; channel_id?: number }
        out?: { io_group_id?: string; channel_id?: number }
    }> {
        const value = message.data?.value
        if (!value) {
            return []
        }

        if (Array.isArray(value)) {
            return value
        }

        if (Array.isArray(value._connections)) {
            return value._connections
        }

        return []
    }

    private mapDigigramChannelsToSelectorUpdate(
        digigramOutChannel: number | undefined,
        digigramInputChannel: number | undefined
    ): { channelNumber: number; inputSelected: number } | undefined {
        if (
            typeof digigramOutChannel !== 'number' ||
            typeof digigramInputChannel !== 'number'
        ) {
            return undefined
        }

        const channelNumber = this.getSisyfosChannel(digigramOutChannel)
        const inputSelected = this.getSisyfosInputSelected(
            digigramOutChannel,
            digigramInputChannel
        )

        if (
            typeof channelNumber !== 'number' ||
            typeof inputSelected !== 'number'
        ) {
            return undefined
        }

        return { channelNumber, inputSelected }
    }

    private send(payload: object): void {
        if (!this.socket || !this.connected) return
        logger
            .data(payload)
            .debug('Digigram input selector websocket send payload')
        this.socket.send(JSON.stringify([payload]))
    }

    private nextMessageId(): string {
        this.messageSequence += 1
        return `${this.messageSequence}`
    }

    private sendHandshake() {
        this.send({
            channel: DigigramInputSelectorPlugin.HANDSHAKE_CHANNEL,
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
            id: this.nextMessageId(),
        })
    }

    private sendConnect() {
        if (!this.clientId) return
        const payload: {
            channel: string
            connectionType: string
            clientId: string
            id: string
            advice?: { timeout: number }
        } = {
            channel: DigigramInputSelectorPlugin.CONNECT_CHANNEL,
            connectionType: 'websocket',
            clientId: this.clientId,
            id: this.nextMessageId(),
        }

        if (!this.initialConnectSent) {
            payload.advice = {
                timeout: 0,
            }
            this.initialConnectSent = true
        }

        this.send(payload)
    }

    private sendSubscribe(subscription: string) {
        if (!this.clientId) return
        this.send({
            channel: DigigramInputSelectorPlugin.SUBSCRIBE_CHANNEL,
            clientId: this.clientId,
            subscription,
            id: this.nextMessageId(),
        })
    }

    private sendUpdateCommand() {
        if (!this.clientId) return
        this.send({
            channel: DigigramInputSelectorPlugin.COMMAND_CHANNEL,
            clientId: this.clientId,
            id: this.nextMessageId(),
            data: {
                command: 'update',
            },
        })
    }

    private initializeChannelMappings(
        channelMappings: DigigramChannelMapping[]
    ) {
        channelMappings.forEach((mapping) => {
            this.sisyfosToChannelMapping.set(mapping.sisyfosChannel, mapping)
            this.digigramOutToChannelMapping.set(
                mapping.digigramOutChannel,
                mapping
            )
        })
    }

    private getDigigramOutChannel(channelNumber: number): number | undefined {
        return this.sisyfosToChannelMapping.get(channelNumber)
            ?.digigramOutChannel
    }

    private getSisyfosChannel(digigramOutChannel: number): number | undefined {
        return this.digigramOutToChannelMapping.get(digigramOutChannel)
            ?.sisyfosChannel
    }

    private resolveDigigramInputChannel(
        channelNumber: number,
        inputSelected: number
    ): number | undefined {
        const mapping = this.sisyfosToChannelMapping.get(channelNumber)
        if (!mapping) {
            return undefined
        }

        if (
            inputSelected < mapping.inputChannelFirst ||
            inputSelected > mapping.inputChannelFirst + mapping.inputCount - 1
        ) {
            return undefined
        }

        return inputSelected
    }

    private getSisyfosInputSelected(
        digigramOutChannel: number,
        digigramInputChannel: number
    ): number | undefined {
        const mapping = this.digigramOutToChannelMapping.get(digigramOutChannel)
        if (!mapping) {
            return undefined
        }

        if (
            digigramInputChannel < mapping.inputChannelFirst ||
            digigramInputChannel >
                mapping.inputChannelFirst + mapping.inputCount - 1
        ) {
            return undefined
        }

        return digigramInputChannel
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return
        this.reconnectAttempts += 1
        this.emitStatus()
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined
            this.connect()
        }, DigigramInputSelectorPlugin.DEFAULT_RECONNECT_DELAY_MS)
    }

    reset(): void {
        for (const mapping of this.configOptions.channelMappings) {
            // No default input configured means something else decides what is
            // selected, so leave the channel alone.
            if (mapping.defaultInput === undefined) continue

            this.sendSelectorChange({
                channelIndex: mapping.sisyfosChannel,
                inputSelected: mapping.defaultInput,
            })
            this.context.onExternalUpdate({
                channelIndex: mapping.sisyfosChannel,
                inputSelected: mapping.defaultInput,
            })
        }
    }

    getStatus(): InputSelectorPluginStatus {
        return {
            connected: this.connected,
            reconnectAttempts: this.reconnectAttempts,
            lastMessageAt: this.lastMessageAt,
            lastStateSyncAt: this.lastStateSyncAt,
            lastErrorAt: this.lastErrorAt,
        }
    }

    private startHeartbeat() {
        this.clearHeartbeatTimer()
        this.heartbeatTimer = setInterval(() => {
            if (!this.socket || !this.connected) return

            const now = Date.now()
            const staleTimeoutMs =
                DigigramInputSelectorPlugin.DEFAULT_STALE_TIMEOUT_MS
            const lastMessageAge = this.lastMessageAt
                ? now - this.lastMessageAt
                : staleTimeoutMs + 1

            if (lastMessageAge > staleTimeoutMs) {
                logger.warn(
                    `Digigram input selector websocket stale (${lastMessageAge}ms), reconnecting`
                )
                this.socket.terminate()
                return
            }
        }, DigigramInputSelectorPlugin.DEFAULT_HEARTBEAT_INTERVAL_MS)
    }

    private clearReconnectTimer() {
        if (!this.reconnectTimer) return
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = undefined
    }

    private clearHeartbeatTimer() {
        if (!this.heartbeatTimer) return
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = undefined
    }

    private clearConnectTimer() {
        if (!this.connectTimer) return
        clearTimeout(this.connectTimer)
        this.connectTimer = undefined
    }

    private normalizeWebSocketUrl(rawUrl: string): string {
        const trimmedUrl = rawUrl.trim()
        if (!trimmedUrl) {
            return trimmedUrl
        }

        const normalizedUrl =
            trimmedUrl.startsWith('ws://') || trimmedUrl.startsWith('wss://')
                ? new URL(trimmedUrl)
                : trimmedUrl.startsWith('http://') ||
                    trimmedUrl.startsWith('https://')
                  ? new URL(trimmedUrl.replace(/^http/, 'ws'))
                  : new URL(`ws://${trimmedUrl}`)

        if (
            !normalizedUrl.pathname ||
            normalizedUrl.pathname === '/' ||
            normalizedUrl.pathname === '/cometd'
        ) {
            normalizedUrl.pathname = '/cometd/handshake'
        }

        return normalizedUrl.toString()
    }

    private emitStatus() {
        this.context.onStatus(this.getStatus())
    }
}
