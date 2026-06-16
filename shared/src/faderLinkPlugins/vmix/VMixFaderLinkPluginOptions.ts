export interface VMixFaderLinkChannelMapping {
    channelIndex: number
    prefix: string
}

export interface VMixFaderLinkPluginOptions {
    channelMappings: VMixFaderLinkChannelMapping[]
}

export const defaultVMixFaderLinkPluginOptions: VMixFaderLinkPluginOptions = {
    channelMappings: [],
}
