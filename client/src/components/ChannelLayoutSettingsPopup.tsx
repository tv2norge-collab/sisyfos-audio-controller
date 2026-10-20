import classNames from 'classnames'
import React, { useCallback } from 'react'
import { Fader } from '../../../shared/src/reducers/fadersReducer'
import { SettingsActionTypes } from '../../../shared/src/actions/settingsActions'
import SettingsIcon from '../assets/icons/settings.svg'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'
import '../assets/css/ChannelLayoutSettings.css'
import * as IO from '../../../shared/src/constants/SOCKET_IO_DISPATCHERS'
import { RotaryDial } from './RotaryDial'
import { InputSelector } from './InputSelector'
import { getInputSelectorPluginChannelLayoutRenderer } from '../utils/inputSelectorPluginRegistry'

interface AmixtoggleProps {
    fader: Fader
    faderIndex: number
}

function AmixToggle({ fader, faderIndex }: AmixtoggleProps) {
    return (
        window.mixerProtocol.channelTypes[0].toMixer.CHANNEL_AMIX && (
            <>
                <button
                    className={classNames('channel-amix-button', {
                        on: fader.amixOn,
                        disabled: !fader.capabilities?.hasAMix,
                    })}
                    onClick={(event) => {
                        event.preventDefault()
                        window.socketIoClient.emit(
                            IO.SOCKET_TOGGLE_AMIX,
                            faderIndex
                        )
                    }}
                    onTouchEnd={(event) => {
                        event.preventDefault()
                        window.socketIoClient.emit(
                            IO.SOCKET_TOGGLE_AMIX,
                            faderIndex
                        )
                    }}
                >
                    AMix
                </button>
                <hr />
            </>
        )
    )
}

export function ChannelLayoutSettingsButton({
    faderIndex,
    fader,
}: {
    faderIndex: number
    fader: Fader
}) {
    const dispatch = useAppDispatch()
    const chanLayoutSettingsShown = useAppSelector(
        (store) => store.settings[0].showChanLayoutSettings
    )
    const nextFader = useAppSelector(
        (store) => store.faders[0].fader[faderIndex + 1]
    )
    const pluginLayoutState = useAppSelector((store) => {
        const mixerIndex = fader.assignedChannels?.[0]?.mixerIndex
        if (mixerIndex === undefined) {
            return undefined
        }
        const inputSelectorPlugin =
            store.settings[0].mixers[mixerIndex]?.inputSelectorPlugin
        if (!inputSelectorPlugin?.enabled) {
            return undefined
        }

        const plugin = window.inputSelectorPlugins?.find(
            (plugin) => plugin.pluginId === inputSelectorPlugin.pluginId
        )

        return plugin
            ? {
                  config: inputSelectorPlugin,
                  faderIndex,
                  renderer: getInputSelectorPluginChannelLayoutRenderer(
                      plugin.pluginId
                  ),
              }
            : undefined
    })

    const minGainLabel =
        window.mixerProtocol.channelTypes[0].fromMixer.CHANNEL_INPUT_GAIN?.[0]
            .minLabel ?? 0
    const maxGainLabel =
        window.mixerProtocol.channelTypes[0].fromMixer.CHANNEL_INPUT_GAIN?.[0]
            .maxLabel ?? 1

    const handleOpenChannelSettings = (open: boolean) => {
        dispatch({
            type: SettingsActionTypes.TOGGLE_SHOW_CHAN_LAYOUT_SETTINGS,
            channel: faderIndex,
        })
    }

    const handleInputGainLeft = useCallback(
        (level: number) => {
            window.socketIoClient.emit(IO.SOCKET_SET_INPUT_GAIN, {
                faderIndex,
                level: level,
            })
        },
        [faderIndex]
    )

    const handleInputGainRight = useCallback(
        (level: number) => {
            window.socketIoClient.emit(IO.SOCKET_SET_INPUT_GAIN, {
                faderIndex: faderIndex + 1,
                level: level,
            })
        },
        [faderIndex]
    )

    const handleInputSelect = useCallback(
        (selected: number) => {
            window.socketIoClient.emit(IO.SOCKET_SET_INPUT_SELECTOR, {
                faderIndex,
                selected,
            })
        },
        [faderIndex]
    )

    const toggleLink = useCallback(() => {
        window.socketIoClient.emit(IO.SOCKET_SET_LINK, {
            faderIndex,
            linkOn: !fader.isLinked,
        })
    }, [faderIndex, fader.isLinked])

    const isActive = chanLayoutSettingsShown === faderIndex

    return (
        <Popover
            open={isActive}
            onOpenChange={handleOpenChannelSettings}
            placement="right-end"
        >
            <PopoverTrigger
                className={classNames('channel-layout-settings-button', {
                    active: isActive,
                })}
                onClick={() =>
                    handleOpenChannelSettings(!chanLayoutSettingsShown)
                }
            >
                <SettingsIcon />
            </PopoverTrigger>
            {isActive && (
                <PopoverContent className="channel-layout-popover">
                    <>
                        <AmixToggle fader={fader} faderIndex={faderIndex} />
                        <div className="channel-layout-selector">
                            <div className="content">
                                {fader.capabilities?.isLinkablePrimary && (
                                    <div className="row channel-layout-selectors">
                                        <button
                                            onClick={toggleLink}
                                            className={classNames(
                                                'channel-layout-selector-button',
                                                { active: fader.isLinked }
                                            )}
                                        >
                                            L+R
                                        </button>
                                        <button
                                            onClick={toggleLink}
                                            className={classNames(
                                                'channel-layout-selector-button',
                                                { active: !fader.isLinked }
                                            )}
                                        >
                                            1|2
                                        </button>
                                    </div>
                                )}
                                {pluginLayoutState?.renderer ? (
                                    <pluginLayoutState.renderer
                                        config={pluginLayoutState.config}
                                        faderIndex={faderIndex}
                                        fader={fader}
                                        handleInputSelect={handleInputSelect}
                                    />
                                ) : (
                                    <InputSelector
                                        fader={fader}
                                        faderIndex={faderIndex}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                    {fader.capabilities?.isLinkablePrimary &&
                    !fader.isLinked ? (
                        <div className="channel-layout-gain-pair">
                            <div className="channel-layout-gain">
                                Gain 1
                                <RotaryDial
                                    value={fader.inputGain}
                                    onChange={handleInputGainLeft}
                                />
                                <div className="row">
                                    <div className="gain-label">
                                        {minGainLabel}
                                    </div>
                                    <div className="gain-label">
                                        {maxGainLabel}
                                    </div>
                                </div>
                                <div>
                                    {Math.round(
                                        fader.inputGain *
                                            (maxGainLabel - minGainLabel) +
                                            minGainLabel
                                    )}{' '}
                                    dB
                                </div>
                            </div>
                            <div className="channel-layout-gain">
                                Gain 2
                                <RotaryDial
                                    value={nextFader?.inputGain ?? 0}
                                    onChange={handleInputGainRight}
                                />
                                <div className="row">
                                    <div className="gain-label">
                                        {minGainLabel}
                                    </div>
                                    <div className="gain-label">
                                        {maxGainLabel}
                                    </div>
                                </div>
                                <div>
                                    {Math.round(
                                        (nextFader?.inputGain ?? 0) *
                                            (maxGainLabel - minGainLabel) +
                                            minGainLabel
                                    )}{' '}
                                    dB
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="channel-layout-gain">
                            Gain
                            <RotaryDial
                                value={fader.inputGain}
                                onChange={handleInputGainLeft}
                            />
                            <div className="row">
                                <div className="gain-label">{minGainLabel}</div>
                                <div className="gain-label">{maxGainLabel}</div>
                            </div>
                            <div>
                                {Math.round(
                                    fader.inputGain *
                                        (maxGainLabel - minGainLabel) +
                                        minGainLabel
                                )}{' '}
                                dB
                            </div>
                        </div>
                    )}
                </PopoverContent>
            )}
        </Popover>
    )
}
