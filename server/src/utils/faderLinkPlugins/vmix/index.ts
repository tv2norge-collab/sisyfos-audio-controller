import { sendVuLevel } from '../../vuServer'
import { VuType } from '../../../../../shared/src/utils/vu-server-types'
import {
    FaderLinkPluginDefinition,
    FaderLinkPluginContext,
    MixerFaderLinkPlugin,
} from '../FaderLinkPlugin'
import { MixerPluginConfig } from '../../../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import {
    VMixFaderLinkChannelMapping,
    VMixFaderLinkPluginOptions,
    defaultVMixFaderLinkPluginOptions,
} from '../../../../../shared/src/faderLinkPlugins/vmix/VMixFaderLinkPluginOptions'

const PLUGIN_ID = 'vmix'
const SET_VOLUME_CHANNEL_MIXER = 'SetVolumeChannelMixer'
const AUDIO_CHANNEL_MATRIX_APPLY_PRESET = 'AudioChannelMatrixApplyPreset'
const MATRIX_PRESET_1L = '1L'
const MATRIX_PRESET_LR = 'LR'

function normalizeMappings(
    options: VMixFaderLinkPluginOptions
): VMixFaderLinkChannelMapping[] {
    return options.channelMappings.filter((m) => typeof m.channelIndex === 'number')
}

class VMixFaderLinkPlugin implements MixerFaderLinkPlugin {
    private readonly mappings: VMixFaderLinkChannelMapping[]
    private readonly sendCommand: FaderLinkPluginContext['sendCommand']
    private readonly resolveInputNumber: FaderLinkPluginContext['resolveInputNumber']
    private readonly setLinkableCapability: FaderLinkPluginContext['setLinkableCapability']
    private readonly setLinked: FaderLinkPluginContext['setLinked']
    private readonly clearAllLinkCapabilities: FaderLinkPluginContext['clearAllLinkCapabilities']

    constructor(config: MixerPluginConfig, context: FaderLinkPluginContext) {
        const options: VMixFaderLinkPluginOptions = {
            ...defaultVMixFaderLinkPluginOptions,
            ...(config.options as Partial<VMixFaderLinkPluginOptions>),
        }
        this.mappings = normalizeMappings(options)
        this.sendCommand = context.sendCommand
        this.resolveInputNumber = context.resolveInputNumber
        this.setLinkableCapability = context.setLinkableCapability
        this.setLinked = context.setLinked
        this.clearAllLinkCapabilities = context.clearAllLinkCapabilities
    }

    private findPrefix(channelIndex: number): string | undefined {
        const prefix = this.mappings.find((m) => m.channelIndex === channelIndex)?.prefix
        return prefix || undefined
    }

    private resolveLinkPreset(primaryChannelIndex: number): string {
        const prefix = this.findPrefix(primaryChannelIndex)
        return prefix !== undefined ? `${prefix}_${MATRIX_PRESET_1L}` : MATRIX_PRESET_1L
    }

    private resolveUnlinkPreset(channelIndex: number): string {
        const prefix = this.findPrefix(channelIndex)
        return prefix !== undefined ? `${prefix}_${MATRIX_PRESET_LR}` : MATRIX_PRESET_LR
    }

    onFaderLink(primaryFaderIndex: number, linkOn: boolean): void {
        const primaryInput = this.resolveInputNumber(primaryFaderIndex)
        const secondaryInput = this.resolveInputNumber(primaryFaderIndex + 1)

        if (linkOn) {
            const preset =
                primaryInput !== undefined
                    ? this.resolveLinkPreset(primaryInput - 1)
                    : MATRIX_PRESET_1L
            if (primaryInput !== undefined) {
                this.sendCommand(AUDIO_CHANNEL_MATRIX_APPLY_PRESET, primaryInput, preset)
                this.sendCommand(SET_VOLUME_CHANNEL_MIXER, primaryInput, '1,100')
                this.sendCommand(SET_VOLUME_CHANNEL_MIXER, primaryInput, '2,100')
            }
            if (secondaryInput !== undefined) {
                this.sendCommand(SET_VOLUME_CHANNEL_MIXER, secondaryInput, '1,0')
                this.sendCommand(SET_VOLUME_CHANNEL_MIXER, secondaryInput, '2,0')
            }
        } else {
            if (primaryInput !== undefined) {
                this.sendCommand(
                    AUDIO_CHANNEL_MATRIX_APPLY_PRESET,
                    primaryInput,
                    this.resolveUnlinkPreset(primaryInput - 1)
                )
                this.sendCommand(SET_VOLUME_CHANNEL_MIXER, primaryInput, '1,100')
                this.sendCommand(SET_VOLUME_CHANNEL_MIXER, primaryInput, '2,0')
            }
            if (secondaryInput !== undefined) {
                this.sendCommand(
                    AUDIO_CHANNEL_MATRIX_APPLY_PRESET,
                    secondaryInput,
                    this.resolveUnlinkPreset(secondaryInput - 1)
                )
                this.sendCommand(SET_VOLUME_CHANNEL_MIXER, secondaryInput, '1,0')
                this.sendCommand(SET_VOLUME_CHANNEL_MIXER, secondaryInput, '2,100')
            }
        }
    }

    reset(): void {
        this.clearAllLinkCapabilities()
        for (const mapping of this.mappings) {
            if (mapping.isLinkablePrimary) {
                this.setLinkableCapability(mapping.channelIndex, true)
            }
        }
        for (const mapping of this.mappings) {
            if (mapping.isLinked) {
                this.setLinked(mapping.channelIndex, true)
            }
        }
    }

    sendVuLevels(
        faderIndex: number,
        levelL: number,
        levelR: number,
        isLinked: boolean,
        isLinkedPrimary: boolean
    ): void {
        if (isLinked) {
            sendVuLevel(faderIndex, VuType.Channel, 0, isLinkedPrimary ? levelL : levelR)
        } else {
            sendVuLevel(faderIndex, VuType.Channel, 0, levelL)
            sendVuLevel(faderIndex, VuType.Channel, 1, levelR)
        }
    }
}

export const vmixFaderLinkPluginDefinition: FaderLinkPluginDefinition = {
    manifest: {
        pluginId: PLUGIN_ID,
        label: 'vMix',
        supportedMixers: ['vMix'],
    },
    factory: (config, context) => new VMixFaderLinkPlugin(config, context),
}
