import React from 'react'
import { Provider as LegacyReduxProvider } from 'react-redux'
import { useSocketConnection } from '../../client/src/hooks/useSocketConnection'
import ContextProvider from '../../client/src/components/ContextProvider'
import OrgChannels from '../../client/src/components/Channels'
import SisyfosVuMeter from '../../client/src/components/SisyfosVuMeter'
import upstreamI18n from '../../client/src/utils/i18n'
import { vuMeters } from '../../client/src/utils/SocketClientHandlers'
import legacyStore from '../../shared/src/reducers/store'

export { I18nextProvider } from 'react-i18next'
export { ChannelActionTypes } from '../../shared/src/actions/channelActions'
export { FaderActionTypes } from '../../shared/src/actions/faderActions'
export { SettingsActionTypes } from '../../shared/src/actions/settingsActions'
export { PageType } from '../../shared/src/reducers/settingsReducer'
export { createEnhancedReducer } from '../../shared/src/reducers/indexReducer'

export function Channels({ page }: { page?: string }) {
    return <OrgChannels page={page} />
}

export {
    ContextProvider,
    LegacyReduxProvider,
    legacyStore,
    SisyfosVuMeter,
    upstreamI18n,
    useSocketConnection,
    vuMeters,
}

export type {
    RootState as SisyfosState,
    RootAction as SisyfosAction,
} from '../../shared/src/reducers/indexReducer'
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
export type { ReduxStore as LegacyReduxStore } from '../../shared/src/reducers/store'
export type { Channels as LegacyChannels } from '../../shared/src/reducers/channelsReducer'
export type { Faders as LegacyFaders } from '../../shared/src/reducers/fadersReducer'
export type {
    CustomPages as LegacyCustomPages,
} from '../../shared/src/reducers/settingsReducer'
export type { SisyfosMeterConfig } from '../../client/src/components/SisyfosVuMeter'
