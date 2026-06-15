/** Opaque options bag stored per plugin — each plugin interprets its own shape. */
export type InputSelectorPluginOptions = Record<string, unknown>

/** Persisted per-mixer configuration for the input selector plugin. */
export interface InputSelectorPluginConfig {
    /** Identifies which plugin implementation to use */
    pluginId: string
    enabled: boolean
    options?: InputSelectorPluginOptions
}

/**
 * Sent from the server to the client as part of the `set-mixerprotocol` payload.
 * The client uses this to look up renderers from its own plugin registry.
 */
export interface InputSelectorPluginManifest {
    pluginId: string
    label: string
}
