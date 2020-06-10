import { IMixerProtocol, emptyMixerMessage } from '../MixerProtocolInterface'

export const LawoMC2: IMixerProtocol = {
    protocol: 'EMBER',
    label: 'Lawo MC2 - NOT IMPLEMENTED',
    presetFileExtension: '',
    loadPresetCommand: [emptyMixerMessage()],
    FADE_DISPATCH_RESOLUTION: 5,
    leadingZeros: false, //some OSC protocols needs channels to be 01, 02 etc.
    pingCommand: [emptyMixerMessage()],
    pingResponseCommand: [emptyMixerMessage()],
    pingTime: 0, //Bypass ping when pingTime is zero
    initializeCommands: [emptyMixerMessage()],
    channelTypes: [
        {
            channelTypeName: 'CH',
            channelTypeColor: '#2f2f2f',
            fromMixer: {
                CHANNEL_OUT_GAIN: [
                    {
                        mixerMessage:
                            'Ruby.Sources.${channel}.Fader.Motor dB Value',
                        value: 0,
                        type: 'real',
                        min: -191,
                        max: 9,
                        zero: 0,
                    },
                ],
                CHANNEL_VU: [emptyMixerMessage()],
                CHANNEL_VU_REDUCTION: [emptyMixerMessage()],
                CHANNEL_NAME: [
                    {
                        mixerMessage: '',
                        value: 0,
                        type: 'real',
                        min: -200,
                        max: 20,
                        zero: 0,
                    },
                ],
                PFL: [emptyMixerMessage()],
                NEXT_SEND: [emptyMixerMessage()],
                THRESHOLD: [emptyMixerMessage()],
                RATIO: [emptyMixerMessage()],
                DELAY_TIME: [emptyMixerMessage()],
                LOW: [emptyMixerMessage()],
                LO_MID: [emptyMixerMessage()],
                MID: [emptyMixerMessage()],
                HIGH: [emptyMixerMessage()],
                AUX_LEVEL: [emptyMixerMessage()],
                CHANNEL_MUTE_ON: [emptyMixerMessage()],
                CHANNEL_MUTE_OFF: [emptyMixerMessage()],
            },
            toMixer: {
                CHANNEL_OUT_GAIN: [
                    {
                        mixerMessage:
                            'Ruby.Sources.${channel}.Fader.Motor dB Value',
                        value: 0,
                        type: 'real',
                        min: -191,
                        max: 9,
                        zero: 0,
                    },
                ],
                CHANNEL_NAME: [
                    {
                        mixerMessage: '',
                        value: 0,
                        type: 'real',
                        min: -200,
                        max: 20,
                        zero: 0,
                    },
                ],
                PFL_ON: [emptyMixerMessage()],
                PFL_OFF: [emptyMixerMessage()],
                NEXT_SEND: [emptyMixerMessage()],
                THRESHOLD: [emptyMixerMessage()],
                RATIO: [emptyMixerMessage()],
                DELAY_TIME: [emptyMixerMessage()],
                LOW: [emptyMixerMessage()],
                LO_MID: [emptyMixerMessage()],
                MID: [emptyMixerMessage()],
                HIGH: [emptyMixerMessage()],
                AUX_LEVEL: [emptyMixerMessage()],
                CHANNEL_MUTE_ON: [emptyMixerMessage()],
                CHANNEL_MUTE_OFF: [emptyMixerMessage()],
            },
        },
    ],
    fader: {
        min: 0,
        max: 200,
        zero: 1300,
        step: 10,
    },
    meter: {
        min: 0,
        max: 1,
        zero: 0.75,
        test: 0.6,
    },
}
