import classNames from 'classnames'
import React, { useCallback } from 'react'
import { Fader } from '../../../shared/src/reducers/fadersReducer'
import { SettingsActionTypes } from '../../../shared/src/actions/settingsActions'
import SettingsIcon from '../assets/icons/settings.svg'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './Popover'
import '../assets/css/ChannelLayoutSettings.css'
import * as IO from '../../../shared/src/constants/SOCKET_IO_DISPATCHERS'
import { RotaryDial } from './RotaryDial'

const SELECTABLE_CHANNELS = [1, 2, 3, 4, 5, 6, 7, 8]

export function ChannelLayoutSettingsButton({
    faderIndex,
    fader,
}: {
    faderIndex: number
    fader: Fader
}) {
    const dispatch = useAppDispatch()
    const chanLayoutSettingsShown = useAppSelector(
        (store) => store.settings[0].showChanLayoutSettings,
    )
    const nextFader = useAppSelector(
        (store) => store.faders[0].fader[faderIndex + 1],
    )

    const handleOpenChannelSettings = (open: boolean) => {
        dispatch({
            type: SettingsActionTypes.TOGGLE_SHOW_CHAN_LAYOUT_SETTINGS,
            channel: faderIndex,
        })
    }

    const toggleLink = () => {
        window.socketIoClient.emit(IO.SOCKET_SET_LINK, { faderIndex, linkOn: !fader.isLinked })
    }

    const handleInputGainLeft = useCallback(
        (level: number) => {
            window.socketIoClient.emit(IO.SOCKET_SET_INPUT_GAIN, {
                faderIndex,
                level: level,
            })
        },
        [faderIndex],
    )

    const handleInputGainRight = useCallback(
        (level: number) => {
            window.socketIoClient.emit(IO.SOCKET_SET_INPUT_GAIN, {
                faderIndex: faderIndex + 1,
                level: level,
            })
        },
        [faderIndex],
    )

    const isActive = chanLayoutSettingsShown === faderIndex

    const minGainLabel =
        window.mixerProtocol.channelTypes[0].fromMixer.CHANNEL_INPUT_GAIN?.[0]
            .minLabel ?? 0
    const maxGainLabel =
        window.mixerProtocol.channelTypes[0].fromMixer.CHANNEL_INPUT_GAIN?.[0]
            .maxLabel ?? 1

    const handleInputSelect = (selected: number) => {
        window.socketIoClient.emit(IO.SOCKET_SET_INPUT_SELECTOR, {
            faderIndex: faderIndex,
            selected: selected,
        })
    }

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
                    {fader.capabilities?.isLinkablePrimary && (
                        <div className='row channel-layout-selectors'>
                            <button onClick={toggleLink} className={classNames('channel-layout-selector-button', { active: fader.isLinked })}>L+R</button>
                            <button onClick={toggleLink} className={classNames('channel-layout-selector-button', { active: !fader.isLinked })}>1|2</button>
                        </div>
                    )}
                    <div className='channel-layout-matrix'>
                            <span>CH</span><span>{fader.isLinked ? 'L' : 1 }</span><span>{fader.isLinked ? 'R' : 2 }</span>
                        {SELECTABLE_CHANNELS.map((channel) => (
                            <React.Fragment key={channel}>
                                <span>{channel}</span>
                                <input
                                    type="checkbox"
                                    checked={
                                        ((fader.inputSelector >> 8) & 0xff) ===
                                        channel
                                    }
                                    onChange={() =>
                                        handleInputSelect(
                                            (fader.inputSelector &
                                                ~(0xff << 8)) |
                                                (channel << 8),
                                        )
                                    }
                                />
                                <input
                                    type="checkbox"
                                    checked={
                                        ((fader.inputSelector >> 16) & 0xff) ===
                                        channel
                                    }
                                    onChange={() =>
                                        handleInputSelect(
                                            (fader.inputSelector &
                                                ~(0xff << 16)) |
                                                (channel << 16),
                                        )
                                    }
                                />
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="row">
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
                                        minGainLabel,
                                )}{' '}
                                dB
                            </div>
                        </div>
                        {fader.capabilities?.isLinkablePrimary && !fader.isLinked && nextFader && (
                            <div className="channel-layout-gain">
                                Gain
                                <RotaryDial
                                    value={nextFader.inputGain}
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
                                        nextFader.inputGain *
                                            (maxGainLabel - minGainLabel) +
                                            minGainLabel,
                                    )}{' '}
                                    dB
                                </div>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            )}
        </Popover>
    )
}
