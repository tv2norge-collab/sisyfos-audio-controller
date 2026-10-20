import React from 'react'
import './DigigramInputSelectorPluginSettings.css'
import {
    MixerPluginConfig,
    MixerPluginOptions,
} from '../../../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import {
    defaultDigigramInputSelectorOptions,
    DigigramChannelMapping,
    DigigramInputSelectorOptions,
} from '../../../../../shared/src/inputSelectorPlugins/digigram/DigigramInputSelectorPluginOptions'
import PluginSettingsImportExport from '../../PluginSettingsImportExport'

interface DigigramInputSelectorPluginSettingsProps {
    config: MixerPluginConfig
    mixerIndex: number
    hasUnsavedChanges: boolean
    onChange: (pluginConfig: MixerPluginConfig) => void
}

const DISPLAY_OFFSET = 1

const toDisplayValue = (value: number) => value + DISPLAY_OFFSET

const fromDisplayValue = (value: number) => Math.max(0, value - DISPLAY_OFFSET)

const normalizeChannelMappings = (
    value: MixerPluginConfig['options']
): DigigramChannelMapping[] => {
    const mappings = value?.channelMappings
    if (!Array.isArray(mappings)) {
        return []
    }

    return mappings.flatMap((mapping) => {
        if (!mapping || Array.isArray(mapping) || typeof mapping !== 'object') {
            return []
        }

        return [
            {
                sisyfosChannel:
                    typeof mapping.sisyfosChannel === 'number'
                        ? mapping.sisyfosChannel
                        : 0,
                digigramOutChannel:
                    typeof mapping.digigramOutChannel === 'number'
                        ? mapping.digigramOutChannel
                        : 0,
                inputChannelFirst:
                    typeof mapping.inputChannelFirst === 'number'
                        ? mapping.inputChannelFirst
                        : 0,
                inputCount:
                    typeof mapping.inputCount === 'number'
                        ? mapping.inputCount
                        : 8,
                defaultInput:
                    typeof mapping.defaultInput === 'number'
                        ? mapping.defaultInput
                        : undefined,
            },
        ]
    })
}

const resolveDigigramOptions = (
    config: MixerPluginConfig
): DigigramInputSelectorOptions => {
    const options = config.options || {}
    return {
        ...defaultDigigramInputSelectorOptions,
        url:
            typeof options.url === 'string'
                ? options.url
                : defaultDigigramInputSelectorOptions.url,
        channelMappings: normalizeChannelMappings(config.options),
    }
}

const DigigramInputSelectorPluginSettings: React.FC<
    DigigramInputSelectorPluginSettingsProps
> = ({ config, mixerIndex, hasUnsavedChanges, onChange }) => {
    const options = resolveDigigramOptions(config)

    const resetAssignments = () => {
        fetch(`/api/plugin-state/digigram/${mixerIndex}/reset`, {
            method: 'POST',
        })
            .then((response) => {
                if (!response.ok) {
                    return response.text().then((text) => {
                        window.alert(text || 'Failed to reset inputs')
                    })
                }
            })
            .catch(() => {
                window.alert('Failed to reset inputs')
            })
    }

    const updateOptions = (nextOptions: DigigramInputSelectorOptions) => {
        onChange({
            ...config,
            options: nextOptions as unknown as MixerPluginOptions,
        })
    }

    const updateMapping = (
        mappingIndex: number,
        key: keyof DigigramChannelMapping,
        value: number | undefined
    ) => {
        const channelMappings = options.channelMappings.map((mapping, index) =>
            index === mappingIndex ? { ...mapping, [key]: value } : mapping
        )

        updateOptions({
            ...options,
            channelMappings,
        })
    }

    const updateDisplayedMapping = (
        mappingIndex: number,
        key: keyof DigigramChannelMapping,
        value: number
    ) => {
        updateMapping(mappingIndex, key, fromDisplayValue(value))
    }

    const updateOptionalDisplayedMapping = (
        mappingIndex: number,
        key: keyof DigigramChannelMapping,
        value: string
    ) => {
        updateMapping(
            mappingIndex,
            key,
            value === '' ? undefined : fromDisplayValue(Number(value))
        )
    }

    const addMapping = () => {
        updateOptions({
            ...options,
            channelMappings: [
                ...options.channelMappings,
                {
                    sisyfosChannel: 0,
                    digigramOutChannel: 0,
                    inputChannelFirst: 0,
                    inputCount: 8,
                },
            ],
        })
    }

    const removeMapping = (mappingIndex: number) => {
        updateOptions({
            ...options,
            channelMappings: options.channelMappings.filter(
                (_, index) => index !== mappingIndex
            ),
        })
    }

    return (
        <>
            <PluginSettingsImportExport
                pluginId={config.pluginId}
                mixerIndex={mixerIndex}
                hasUnsavedChanges={hasUnsavedChanges}
                onImportedOptions={(importedOptions) =>
                    updateOptions({
                        ...options,
                        ...(importedOptions as Partial<DigigramInputSelectorOptions>),
                    })
                }
            />
            <label className="settings-input-field">
                WEBSOCKET URL:
                <input
                    type="text"
                    value={options.url}
                    onChange={(event) =>
                        updateOptions({
                            ...options,
                            url: event.target.value,
                        })
                    }
                />
            </label>
            <br />

            <div className="settings-subheader">Digigram channel mapping</div>

            <div className="digigram-channel-selector-table-wrapper">
                <table className="digigram-channel-selector-table">
                    <thead>
                        <tr>
                            <th>Sisyfos channel</th>
                            <th>Digigram out</th>
                            <th>Input first</th>
                            <th>Input count</th>
                            <th>Default input</th>
                            <th aria-label="Actions" />
                        </tr>
                    </thead>
                    <tbody>
                        {options.channelMappings.map((mapping, index) => (
                            <tr key={index}>
                                <td>
                                    <input
                                        className="digigram-channel-selector-table-input"
                                        type="number"
                                        value={toDisplayValue(
                                            mapping.sisyfosChannel
                                        )}
                                        onChange={(event) =>
                                            updateDisplayedMapping(
                                                index,
                                                'sisyfosChannel',
                                                Number(event.target.value)
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <input
                                        className="digigram-channel-selector-table-input"
                                        type="number"
                                        value={toDisplayValue(
                                            mapping.digigramOutChannel
                                        )}
                                        onChange={(event) =>
                                            updateDisplayedMapping(
                                                index,
                                                'digigramOutChannel',
                                                Number(event.target.value)
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <input
                                        className="digigram-channel-selector-table-input"
                                        type="number"
                                        value={toDisplayValue(
                                            mapping.inputChannelFirst
                                        )}
                                        onChange={(event) =>
                                            updateDisplayedMapping(
                                                index,
                                                'inputChannelFirst',
                                                Number(event.target.value)
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <input
                                        className="digigram-channel-selector-table-input"
                                        type="number"
                                        value={mapping.inputCount}
                                        onChange={(event) =>
                                            updateMapping(
                                                index,
                                                'inputCount',
                                                Number(event.target.value)
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <input
                                        className="digigram-channel-selector-table-input"
                                        type="number"
                                        value={
                                            mapping.defaultInput === undefined
                                                ? ''
                                                : toDisplayValue(
                                                      mapping.defaultInput
                                                  )
                                        }
                                        placeholder="None"
                                        onChange={(event) =>
                                            updateOptionalDisplayedMapping(
                                                index,
                                                'defaultInput',
                                                event.target.value
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <button
                                        className="digigram-channel-selector-remove-btn"
                                        type="button"
                                        onClick={() => removeMapping(index)}
                                        title="Remove mapping"
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!options.channelMappings.length ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="digigram-channel-selector-table-empty"
                                >
                                    No mappings configured.
                                </td>
                            </tr>
                        ) : null}
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
                title={
                    hasUnsavedChanges
                        ? 'Save settings before resetting'
                        : undefined
                }
            >
                Reset selectors
            </button>
        </>
    )
}

export default DigigramInputSelectorPluginSettings
