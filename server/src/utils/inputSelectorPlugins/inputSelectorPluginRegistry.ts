import { InputSelectorPluginManifest } from '../../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import {
    InputSelectorPluginFactory,
    MixerInputSelectorPlugin,
    InputSelectorPluginContext,
} from './InputSelectorPlugin'
import { digigramInputSelectorPluginDefinition } from './digigram'

interface InputSelectorPluginDefinition {
    manifest: InputSelectorPluginManifest
    factory: InputSelectorPluginFactory
    settings: {
        /** Keys from the options object that are safe to export/import */
        importExportKeys: string[]
    }
}

const registry: Record<string, InputSelectorPluginDefinition> = {
    [digigramInputSelectorPluginDefinition.manifest.pluginId]:
        digigramInputSelectorPluginDefinition,
}

export function getInputSelectorPluginDefinition(
    pluginId: string
): InputSelectorPluginDefinition | undefined {
    return registry[pluginId]
}

export function getAllInputSelectorPluginManifests(): InputSelectorPluginManifest[] {
    return Object.values(registry).map((def) => def.manifest)
}

export function createInputSelectorPlugin(
    pluginId: string,
    pluginOptions: Record<string, unknown>,
    context: InputSelectorPluginContext
): MixerInputSelectorPlugin | undefined {
    const definition = registry[pluginId]
    if (!definition) return undefined
    return definition.factory(pluginOptions, context)
}
