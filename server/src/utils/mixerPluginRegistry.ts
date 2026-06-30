import {
    MixerPluginConfig,
    MixerPluginManifest,
    MixerPluginOptions,
} from '../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import {
    InputSelectorPluginFactory,
    InputSelectorPluginContext,
    MixerInputSelectorPlugin,
} from './inputSelectorPlugins/InputSelectorPlugin'
import {
    FaderLinkPluginFactory,
    FaderLinkPluginContext,
    MixerFaderLinkPlugin,
} from './faderLinkPlugins/FaderLinkPlugin'
import { digigramInputSelectorPluginDefinition } from './inputSelectorPlugins/digigram'
import { vmixFaderLinkPluginDefinition } from './faderLinkPlugins/vmix'

interface BaseEntry {
    manifest: MixerPluginManifest
}

export interface InputSelectorEntry extends BaseEntry {
    stateKey: 'inputSelectorPlugin'
    factory: InputSelectorPluginFactory
}

export interface FaderLinkEntry extends BaseEntry {
    stateKey: 'faderLinkPlugin'
    factory: FaderLinkPluginFactory
}

export type PluginEntry = InputSelectorEntry | FaderLinkEntry

const registry: Record<string, PluginEntry> = {
    [digigramInputSelectorPluginDefinition.manifest.pluginId]: {
        stateKey: 'inputSelectorPlugin',
        manifest: digigramInputSelectorPluginDefinition.manifest,
        factory: digigramInputSelectorPluginDefinition.factory,
    },
    [vmixFaderLinkPluginDefinition.manifest.pluginId]: {
        stateKey: 'faderLinkPlugin',
        manifest: vmixFaderLinkPluginDefinition.manifest,
        factory: vmixFaderLinkPluginDefinition.factory,
    },
}

export function getPluginEntry(pluginId: string): PluginEntry | undefined {
    return registry[pluginId]
}

export function createInputSelectorPlugin(
    pluginId: string,
    pluginOptions: MixerPluginOptions,
    context: InputSelectorPluginContext
): MixerInputSelectorPlugin | undefined {
    const entry = registry[pluginId]
    if (entry?.stateKey !== 'inputSelectorPlugin') return undefined
    return entry.factory(pluginOptions, context)
}

export function createFaderLinkPlugin(
    config: MixerPluginConfig,
    context: FaderLinkPluginContext
): MixerFaderLinkPlugin | undefined {
    const entry = registry[config.pluginId]
    if (entry?.stateKey !== 'faderLinkPlugin') return undefined
    return entry.factory(config, context)
}

const inputSelectorInstances = new Map<number, MixerInputSelectorPlugin>()

export function registerInputSelectorPlugin(
    mixerIndex: number,
    plugin: MixerInputSelectorPlugin | undefined
): void {
    if (plugin) {
        inputSelectorInstances.set(mixerIndex, plugin)
    } else {
        inputSelectorInstances.delete(mixerIndex)
    }
}

export function getInputSelectorPlugin(
    mixerIndex: number
): MixerInputSelectorPlugin | undefined {
    return inputSelectorInstances.get(mixerIndex)
}

export function getInputSelectorManifests(): MixerPluginManifest[] {
    return Object.values(registry)
        .filter((e): e is InputSelectorEntry => e.stateKey === 'inputSelectorPlugin')
        .map((e) => e.manifest)
}

export function getFaderLinkManifests(): MixerPluginManifest[] {
    return Object.values(registry)
        .filter((e): e is FaderLinkEntry => e.stateKey === 'faderLinkPlugin')
        .map((e) => e.manifest)
}
