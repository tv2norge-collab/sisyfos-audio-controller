/** Opaque options bag stored per plugin — each plugin interprets its own shape. */
export type MixerPluginOptions = Record<string, unknown>

/** Persisted per-mixer configuration for any mixer plugin. */
export interface MixerPluginConfig {
    pluginId: string
    enabled: boolean
    options?: MixerPluginOptions
}

/** Sent from server to client to identify available plugins. */
export interface MixerPluginManifest {
    pluginId: string
    label: string
    /** If set, the plugin is only shown for these mixer protocol keys. */
    supportedMixers?: string[]
}


