import { FxParam } from '../../../../shared/src/constants/MixerProtocolInterface'

/**
 * For two consecutive channels, if one is linkable as PRIMARY and the other as SECONDARY,
 * they can be rearranged across faders, to either be controlled with a single fader,
 * or two independent faders
 */
export enum LinkableMode {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
}

export interface MixerConnection {
    loadMixerPreset(presetName: string): void
    updateInputGain(channelIndex: number, level: number): void
    updateInputSelector(channelIndex: number, inputSelected: number): void
    updatePflState(channelIndex: number): void
    updateMuteState(channelIndex: number, muteOn: boolean): void
    updateAMixState(channelIndex: number, aMixOn: boolean): void
    updateNextAux(channelIndex: number, level: number): void
    updateFx(channelIndex: number, fxParam: FxParam, level: number): void
    updateAuxLevel(
        channelIndex: number,
        auxSendIndex: number,
        level: number,
    ): void
    updateChannelName(channelIndex: number): void
    injectCommand(command: string[]): void
    updateChannelSetting(
        channelIndex: number,
        setting: string,
        value: string,
    ): void
    updateFadeIOLevel(channelIndex: number, outputLevel: number): void
}
