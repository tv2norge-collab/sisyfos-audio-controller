export interface VMixFaderLinkChannelMapping {
    channelIndex: number
    prefix: string
    isLinkablePrimary?: boolean
    isLinked?: boolean
}

export interface VMixFaderLinkPluginOptions {
    channelMappings: VMixFaderLinkChannelMapping[]
}

export const defaultVMixFaderLinkPluginOptions: VMixFaderLinkPluginOptions = {
    channelMappings: [],
}
