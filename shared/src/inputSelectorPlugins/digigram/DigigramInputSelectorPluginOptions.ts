export interface DigigramChannelMapping {
    sisyfosChannel: number
    digigramOutChannel: number
    inputChannelFirst: number
    inputCount: number
    defaultInput?: number
}

export interface DigigramInputSelectorOptions {
    url: string
    channelMappings: DigigramChannelMapping[]
}

export const defaultDigigramInputSelectorOptions: DigigramInputSelectorOptions =
    {
        url: 'localhost',
        channelMappings: [],
    }
