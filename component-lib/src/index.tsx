export { useSocketConnection } from '../../client/src/hooks/useSocketConnection'
export { default as ContextProvider } from '../../client/src/components/ContextProvider'

// Reducer factory – mount this into your store under any key (e.g. `sisyfos`)
export { createEnhancedReducer } from '../../shared/src/reducers/indexReducer'

// State types – use SisyfosState to type your store and write typed selectors
export type {
    RootState as SisyfosState,
    RootAction as SisyfosAction,
} from '../../shared/src/reducers/indexReducer'

// Individual state/entity types for fine-grained typed selectors
export type {
    Faders,
    Fader,
    VuMeters,
    ChannelReference,
} from '../../shared/src/reducers/fadersReducer'
export type {
    Channels as ChannelsState,
    Channel,
    ChMixerConnection,
    NumberOfChannels,
} from '../../shared/src/reducers/channelsReducer'
export type { Settings } from '../../shared/src/reducers/settingsReducer'

import React from 'react'

import { default as OrgChannels } from '../../client/src/components/Channels'

export function Channels({ page }: { page?: string }) {
    return <OrgChannels page={page} />
}
