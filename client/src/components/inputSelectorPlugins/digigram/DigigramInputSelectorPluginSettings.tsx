import React from 'react'
import './DigigramInputSelectorPluginSettings.css'
import {
    InputSelectorPluginConfig,
    InputSelectorPluginOptions,
} from '../../../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import {
    defaultDigigramInputSelectorOptions,
    DigigramChannelMapping,
    DigigramInputSelectorOptions,
} from '../../../../../shared/src/inputSelectorPlugins/digigram/DigigramInputSelectorPluginOptions'
import PluginSettingsImportExport from '../../PluginSettingsImportExport'

interface DigigramInputSelectorPluginSettingsProps {
    config: InputSelectorPluginConfig
    mixerIndex: number
    onChange: (pluginConfig: InputSelectorPluginConfig) => void
}

const DISPLAY_OFFSET = 1

const toDisplayValue = (value: number) => value + DISPLAY_OFFSET

const fromDisplayValue = (value: number) => Math.max(0, value - DISPLAY_OFFSET)

const normalizeChannelMappings = (
    value: InputSelectorPluginConfig['options']
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
                inputChannelLast:
                    typeof mapping.inputChannelLast === 'number'
                        ? mapping.inputChannelLast
                        : 7,
            },
        ]
    })
}

const resolveDigigramOptions = (
    config: InputSelectorPluginConfig
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
> = ({ config, mixerIndex, onChange }) => {
    const options = resolveDigigramOptions(config)

    const updateOptions = (nextOptions: DigigramInputSelectorOptions) => {
        onChange({
            ...config,
            options: nextOptions as unknown as InputSelectorPluginOptions,
        })
    }

    const updateMapping = (
        mappingIndex: number,
        key: keyof DigigramChannelMapping,
        value: number
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

    const addMapping = () => {
        updateOptions({
            ...options,
            channelMappings: [
                ...options.channelMappings,
                {
                    sisyfosChannel: 0,
                    digigramOutChannel: 0,
                    inputChannelFirst: 0,
                    inputChannelLast: 7,
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
                canImportExport={true}
                currentOptions={{ channelMappings: options.channelMappings }}
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
                            <th>Input last</th>
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
                                        value={toDisplayValue(
                                            mapping.inputChannelLast
                                        )}
                                        onChange={(event) =>
                                            updateDisplayedMapping(
                                                index,
                                                'inputChannelLast',
                                                Number(event.target.value)
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
                                    colSpan={5}
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
        </>
    )
}

export default DigigramInputSelectorPluginSettings
