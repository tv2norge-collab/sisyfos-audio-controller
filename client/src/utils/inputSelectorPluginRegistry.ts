import React from 'react'
import { MixerPluginConfig } from '../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import { Fader } from '../../../shared/src/reducers/fadersReducer'
import DigigramInputSelectorPluginSettings from '../components/inputSelectorPlugins/digigram/DigigramInputSelectorPluginSettings'
import DigigramInputSelectorPluginChannelLayout from '../components/inputSelectorPlugins/digigram/DigigramInputSelectorPluginChannelLayout'

export interface InputSelectorPluginSettingsRendererProps {
    config: MixerPluginConfig
    mixerIndex: number
    onChange: (pluginConfig: MixerPluginConfig) => void
}

export interface InputSelectorPluginChannelLayoutRendererProps {
    config: MixerPluginConfig
    faderIndex: number
    fader: Fader
    handleInputSelect: (selected: number) => void
}

interface ClientInputSelectorPluginDefinition {
    SettingsRenderer: React.ComponentType<InputSelectorPluginSettingsRendererProps>
    ChannelLayoutRenderer: React.ComponentType<InputSelectorPluginChannelLayoutRendererProps>
}

const registry: Record<string, ClientInputSelectorPluginDefinition> = {
    digigram: {
        SettingsRenderer: DigigramInputSelectorPluginSettings,
        ChannelLayoutRenderer: DigigramInputSelectorPluginChannelLayout,
    },
}

export function getInputSelectorPluginSettingsRenderer(
    pluginId: string
): React.ComponentType<InputSelectorPluginSettingsRendererProps> | undefined {
    return registry[pluginId]?.SettingsRenderer
}

export function getInputSelectorPluginChannelLayoutRenderer(
    pluginId: string
):
    | React.ComponentType<InputSelectorPluginChannelLayoutRendererProps>
    | undefined {
    return registry[pluginId]?.ChannelLayoutRenderer
}
