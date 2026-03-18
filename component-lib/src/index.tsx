import { Provider as LegacyReduxProvider } from 'react-redux'
import { useSocketConnection } from '../../client/src/hooks/useSocketConnection'
import ContextProvider from '../../client/src/components/ContextProvider'
import Channels from '../../client/src/components/Channels'
import upstreamI18n from '../../client/src/utils/i18n'
import { vuMeters } from '../../client/src/utils/SocketClientHandlers'
import legacyStore from '../../shared/src/reducers/store'

export { I18nextProvider } from 'react-i18next'
export { ChannelActionTypes } from '../../shared/src/actions/channelActions'
export { FaderActionTypes } from '../../shared/src/actions/faderActions'
export { SettingsActionTypes } from '../../shared/src/actions/settingsActions'
export { PageType } from '../../shared/src/reducers/settingsReducer'
export {
    Channels,
    ContextProvider,
    LegacyReduxProvider,
    legacyStore,
    upstreamI18n,
    useSocketConnection,
    vuMeters,
}

export type { ReduxStore as LegacyReduxStore } from '../../shared/src/reducers/store'
export type { Channels as LegacyChannels } from '../../shared/src/reducers/channelsReducer'
export type { Faders as LegacyFaders } from '../../shared/src/reducers/fadersReducer'
export type {
    CustomPages as LegacyCustomPages,
} from '../../shared/src/reducers/settingsReducer'
