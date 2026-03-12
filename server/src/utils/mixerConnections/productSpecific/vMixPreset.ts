export interface Command {
    name: string
    value?: string
}
export interface InputsPreset {
    inputNumbers: number[]
    /** vMix commands to execute for each input */
    commands: Command[]
    /** whether channel matrix (and channel mixer) should be reset */
    resetChannelMatrix?: boolean
    /** whether channel gain should be set to 0 */
    resetGain?: boolean
    /** whether "LR" channels of an input should be linked in Sisyfos */
    linkSeparateMono?: boolean
    /**
     * VMix input numbers that should be linked to this input and follow its fader.
     * For example, if this input is the left channel of a stereo pair, list the right channel here.
     * Pass an empty array to unlink any previously linked channels.
     */
    linkableChannels?: number[]
}
export type Preset = InputsPreset[]
