import classNames from 'classnames'
import React from 'react'
import { Fader } from '../../../../../shared/src/reducers/fadersReducer'
import * as IO from '../../../../../shared/src/constants/SOCKET_IO_DISPATCHERS'
import { InputSelectorPluginConfig } from '../../../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import { DigigramInputSelectorOptions } from '../../../../../shared/src/inputSelectorPlugins/digigram/DigigramInputSelectorPluginOptions'
import { useAppSelector } from '../../../hooks/redux'

interface DigigramChannelSelectorPluginChannelLayoutProps {
    config: InputSelectorPluginConfig
    faderIndex: number
    fader: Fader
    handleInputSelect: (selected: number) => void
    toggleLink: () => void
}

const getDigigramOptions = (
    config: InputSelectorPluginConfig
): DigigramInputSelectorOptions => {
    const options = config.options || {}
    const channelMappings = Array.isArray(options.channelMappings)
        ? options.channelMappings.flatMap((mapping) => {
              if (
                  !mapping ||
                  Array.isArray(mapping) ||
                  typeof mapping !== 'object'
              ) {
                  return []
              }

              return [
                  {
                      sisyfosChannel:
                          typeof mapping.sisyfosChannel === 'number'
                              ? mapping.sisyfosChannel
                              : 1,
                      digigramOutChannel:
                          typeof mapping.digigramOutChannel === 'number'
                              ? mapping.digigramOutChannel
                              : 1,
                      inputChannelFirst:
                          typeof mapping.inputChannelFirst === 'number'
                              ? mapping.inputChannelFirst
                              : 1,
                      inputChannelLast:
                          typeof mapping.inputChannelLast === 'number'
                              ? mapping.inputChannelLast
                              : 8,
                  },
              ]
          })
        : []

    return {
        url: typeof options.url === 'string' ? options.url : '',
        channelMappings,
    }
}

const DigigramChannelSelectorPluginChannelLayout: React.FC<
    DigigramChannelSelectorPluginChannelLayoutProps
> = ({ config, faderIndex, fader, handleInputSelect, toggleLink }) => {
    const options = getDigigramOptions(config)
    const mapping = options.channelMappings.find(
        (entry) => entry.sisyfosChannel === faderIndex + 1
    )

    if (!mapping) {
        return null
    }

    const nextFader = useAppSelector(
        (store) => store.faders[0].fader[faderIndex + 1]
    )
    const leftSelected = fader.inputSelector
    const rightSelected = nextFader?.inputSelector

    const selectableChannels = Array.from(
        { length: mapping.inputChannelLast - mapping.inputChannelFirst + 1 },
        (_, index) => mapping.inputChannelFirst + index
    )

    return (
        <>
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
            <div className="channel-layout-matrix">
                <span>CH</span>
                <span>{fader.isLinked ? 'L' : 1}</span>
                <span>{fader.isLinked ? 'R' : 2}</span>
                {selectableChannels.map((channel, index) => (
                    <React.Fragment key={channel}>
                        <span>{index + 1}</span>
                        <input
                            type="checkbox"
                            aria-label="Channel 1"
                            checked={leftSelected === channel}
                            onChange={() =>
                                window.socketIoClient.emit(
                                    IO.SOCKET_SET_INPUT_SELECTOR,
                                    {
                                        faderIndex,
                                        selected: channel,
                                    }
                                )
                            }
                        />
                        <input
                            type="checkbox"
                            aria-label="Channel 2"
                            checked={rightSelected === channel}
                            onChange={() =>
                                window.socketIoClient.emit(
                                    IO.SOCKET_SET_INPUT_SELECTOR,
                                    {
                                        faderIndex: faderIndex + 1,
                                        selected: channel,
                                    }
                                )
                            }
                        />
                    </React.Fragment>
                ))}
            </div>
        </>
    )
}

export default DigigramChannelSelectorPluginChannelLayout
