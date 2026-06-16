import { MixerPluginConfig, MixerPluginManifest } from '../../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'

export interface FaderLinkPluginContext {
    mixerIndex: number
    sendCommand: (fn: string, inputNumber: number, value: string | number | undefined) => void
    resolveInputNumber: (faderIndex: number) => number | undefined
}

export interface MixerFaderLinkPlugin {
    onFaderLink(primaryFaderIndex: number, linkOn: boolean): void
    sendVuLevels(faderIndex: number, levelL: number, levelR: number, isLinked: boolean, isLinkedPrimary: boolean): void
}

export interface FaderLinkPluginDefinition {
    manifest: MixerPluginManifest
    factory: FaderLinkPluginFactory
}

export type FaderLinkPluginFactory = (
    config: MixerPluginConfig,
    context: FaderLinkPluginContext
) => MixerFaderLinkPlugin
