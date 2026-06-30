import React from 'react'
import './VMixFaderLinkPluginSettings.css'
import { MixerPluginConfig } from '../../../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import {
    VMixFaderLinkChannelMapping,
    VMixFaderLinkPluginOptions,
    defaultVMixFaderLinkPluginOptions,
} from '../../../../../shared/src/faderLinkPlugins/vmix/VMixFaderLinkPluginOptions'
import { FaderLinkPluginSettingsRendererProps } from '../../../utils/faderLinkPluginRegistry'
import PluginSettingsImportExport from '../../PluginSettingsImportExport'

const DISPLAY_OFFSET = 1

function resolveOptions(config: MixerPluginConfig): VMixFaderLinkPluginOptions {
    const raw = config.options as Partial<VMixFaderLinkPluginOptions> | undefined
    const mappings = Array.isArray(raw?.channelMappings)
        ? (raw!.channelMappings as VMixFaderLinkChannelMapping[])
        : defaultVMixFaderLinkPluginOptions.channelMappings
    return { channelMappings: mappings }
}

const VMixFaderLinkPluginSettings: React.FC<FaderLinkPluginSettingsRendererProps> =
    ({ config, mixerIndex, hasUnsavedChanges, onChange }) => {
        const options = resolveOptions(config)

        const updateMappings = (
            channelMappings: VMixFaderLinkChannelMapping[]
        ) => {
            onChange({ ...config, options: { channelMappings } })
        }

        const updateMapping = (
            index: number,
            key: keyof VMixFaderLinkChannelMapping,
            value: string | number
        ) => {
            updateMappings(
                options.channelMappings.map((m, i) =>
                    i === index ? { ...m, [key]: value } : m
                )
            )
        }

        const updateBoolMapping = (
            index: number,
            key: keyof VMixFaderLinkChannelMapping,
            value: boolean
        ) => {
            updateMappings(
                options.channelMappings.map((m, i) =>
                    i === index ? { ...m, [key]: value } : m
                )
            )
        }

        const addMapping = () => {
            updateMappings([
                ...options.channelMappings,
                { channelIndex: 0, prefix: '', isLinkablePrimary: false, isLinked: false },
            ])
        }

        const resetAssignments = () => {
            fetch(`/api/plugin-state/vmix/${mixerIndex}/reset`, { method: 'POST' })
                .then((response) => {
                    if (!response.ok) {
                        return response.text().then((text) => {
                            window.alert(text || 'Failed to reset')
                        })
                    }
                })
                .catch(() => {
                    window.alert('Failed to reset')
                })
        }

        const removeMapping = (index: number) => {
            updateMappings(options.channelMappings.filter((_, i) => i !== index))
        }

        return (
            <>
                <PluginSettingsImportExport
                    pluginId={config.pluginId}
                    mixerIndex={mixerIndex}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onImportedOptions={(imported) =>
                        updateMappings(
                            (imported.channelMappings as VMixFaderLinkChannelMapping[]) ??
                                []
                        )
                    }
                />
                <div className="vmix-fader-link-table-wrapper">
                    <table className="vmix-fader-link-table">
                        <thead>
                            <tr>
                                <th>Sisyfos channel</th>
                                <th>Preset prefix</th>
                                <th>Linkable primary</th>
                                <th>Linked</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {options.channelMappings.map((mapping, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            className="vmix-fader-link-table-input"
                                            type="number"
                                            value={
                                                mapping.channelIndex +
                                                DISPLAY_OFFSET
                                            }
                                            onChange={(e) =>
                                                updateMapping(
                                                    index,
                                                    'channelIndex',
                                                    Math.max(
                                                        0,
                                                        Number(e.target.value) -
                                                            DISPLAY_OFFSET
                                                    )
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="vmix-fader-link-table-input"
                                            type="text"
                                            value={mapping.prefix}
                                            onChange={(e) =>
                                                updateMapping(
                                                    index,
                                                    'prefix',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="e.g. EXT1"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={mapping.isLinkablePrimary ?? false}
                                            onChange={(e) =>
                                                updateBoolMapping(index, 'isLinkablePrimary', e.target.checked)
                                            }
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={mapping.isLinked ?? false}
                                            onChange={(e) =>
                                                updateBoolMapping(index, 'isLinked', e.target.checked)
                                            }
                                        />
                                    </td>
                                    <td>
                                        <button
                                            className="vmix-fader-link-remove-btn"
                                            type="button"
                                            onClick={() => removeMapping(index)}
                                            title="Remove mapping"
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!options.channelMappings.length && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="vmix-fader-link-table-empty"
                                    >
                                        No mappings configured.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <button
                    className="settings-channels-button"
                    type="button"
                    onClick={addMapping}
                >
                    Add mapping
                </button>
                <button
                    className="settings-plugin-import-export-button"
                    type="button"
                    onClick={resetAssignments}
                    disabled={hasUnsavedChanges}
                    title={hasUnsavedChanges ? 'Save settings before resetting' : undefined}
                >
                    Reset links
                </button>
            </>
        )
    }

export default VMixFaderLinkPluginSettings
