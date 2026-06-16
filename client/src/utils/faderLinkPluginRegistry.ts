import React from 'react'
import { MixerPluginConfig } from '../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import VMixFaderLinkPluginSettings from '../components/faderLinkPlugins/vmix/VMixFaderLinkPluginSettings'

export interface FaderLinkPluginSettingsRendererProps {
    config: MixerPluginConfig
    mixerIndex: number
    onChange: (pluginConfig: MixerPluginConfig) => void
}

interface ClientFaderLinkPluginDefinition {
    SettingsRenderer: React.ComponentType<FaderLinkPluginSettingsRendererProps>
}

const registry: Record<string, ClientFaderLinkPluginDefinition> = {
    vmix: { SettingsRenderer: VMixFaderLinkPluginSettings },
}

export function getFaderLinkPluginSettingsRenderer(
    pluginId: string
): React.ComponentType<FaderLinkPluginSettingsRendererProps> | undefined {
    return registry[pluginId]?.SettingsRenderer
}
