import React from 'react'
import { Fader } from '../../../../../shared/src/reducers/fadersReducer'
import * as IO from '../../../../../shared/src/constants/SOCKET_IO_DISPATCHERS'
import { MixerPluginConfig } from '../../../../../shared/src/inputSelectorPlugins/InputSelectorPluginConfig'
import { DigigramInputSelectorOptions } from '../../../../../shared/src/inputSelectorPlugins/digigram/DigigramInputSelectorPluginOptions'
import { useAppSelector } from '../../../hooks/redux'

interface DigigramInputSelectorPluginChannelLayoutProps {
    config: MixerPluginConfig
    faderIndex: number
    fader: Fader
    handleInputSelect: (selected: number) => void
}

const getDigigramOptions = (
    config: MixerPluginConfig
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
                      inputCount:
                          typeof mapping.inputCount === 'number'
                              ? mapping.inputCount
                              : 8,
                      defaultInput:
                          typeof mapping.defaultInput === 'number'
                              ? mapping.defaultInput
                              : 1,
                  },
              ]
          })
        : []

    return {
        url: typeof options.url === 'string' ? options.url : '',
        channelMappings,
    }
}

const DigigramInputSelectorPluginChannelLayout: React.FC<
    DigigramInputSelectorPluginChannelLayoutProps
> = ({ config, faderIndex, fader, handleInputSelect }) => {
    const options = getDigigramOptions(config)
    const mapping = options.channelMappings.find(
        (entry) => entry.sisyfosChannel === faderIndex
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
        { length: mapping.inputCount },
        (_, index) => mapping.inputChannelFirst + index
    )

    return (
        <>
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
                            onChange={() => handleInputSelect(channel)}
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

export default DigigramInputSelectorPluginChannelLayout
