import { InputSelectorPluginOptions } from '../../../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'

export type FaderSelectorState = {
    /** 0-based mixer channel index */
    channelIndex: number
    inputSelected: number
    timestamp?: number
}

export interface InputSelectorPluginStatus {
    connected: boolean
    reconnectAttempts: number
    lastMessageAt?: number
    lastStateSyncAt?: number
    lastErrorAt?: number
}

export interface MixerInputSelectorPlugin {
    connect(): void
    disconnect(): void
    sendSelectorChange(change: FaderSelectorState): void
    requestState(): void
    getStatus(): InputSelectorPluginStatus
}

export interface InputSelectorPluginContext {
    mixerIndex: number
    onExternalUpdate: (update: FaderSelectorState) => void
    onStatus: (status: InputSelectorPluginStatus) => void
}

export type InputSelectorPluginFactory = (
    pluginOptions: InputSelectorPluginOptions,
    context: InputSelectorPluginContext
) => MixerInputSelectorPlugin | undefined
