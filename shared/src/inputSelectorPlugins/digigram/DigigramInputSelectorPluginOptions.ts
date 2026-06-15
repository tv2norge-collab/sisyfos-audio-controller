export interface DigigramChannelMapping {
    sisyfosChannel: number
    digigramOutChannel: number
    inputChannelFirst: number
    inputChannelLast: number
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
