import React from 'react'
import { InputSelectorPluginConfig } from '../../../shared/src/InputSelectorPluginConfig'
import { Fader } from '../../../shared/src/reducers/fadersReducer'

export interface InputSelectorPluginSettingsRendererProps {
    config: InputSelectorPluginConfig
    mixerIndex: number
    onChange: (pluginConfig: InputSelectorPluginConfig) => void
}

export interface InputSelectorPluginChannelLayoutRendererProps {
    config: InputSelectorPluginConfig
    faderIndex: number
    fader: Fader
    handleInputSelect: (selected: number) => void
}

interface ClientInputSelectorPluginDefinition {
    SettingsRenderer: React.ComponentType<InputSelectorPluginSettingsRendererProps>
    ChannelLayoutRenderer: React.ComponentType<InputSelectorPluginChannelLayoutRendererProps>
}

const registry: Record<string, ClientInputSelectorPluginDefinition> = {}

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
