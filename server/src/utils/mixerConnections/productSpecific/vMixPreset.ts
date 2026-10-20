export interface Command {
    name: string
    value?: string
}
interface CommonPresetOptions {}
export interface InputsPreset extends CommonPresetOptions {
    inputNumbers: number[]
    /** vMix commands to execute for this input */
    commands?: Command[]
    /** whether channel gain should be set to 0 */
    resetGain?: boolean
}
export type Preset = InputsPreset[]
