import defaultStoreRedux, {
    ReduxStore,
} from '../../../shared/src/reducers/store'
import type { Store } from 'redux'

let activeStore: Store = defaultStoreRedux

export function setActiveSisyfosStore(store?: Store) {
    activeStore = store ?? defaultStoreRedux
}

export function getSisyfosReduxState(): ReduxStore {
    return activeStore.getState() as ReduxStore
}

let channelLabelCacheConnections: ReduxStore['channels'][0]['chMixerConnection'] | undefined
let channelLabelCache: Map<number, string> | undefined

function getChannelLabelsByFader(
    chMixerConnection: ReduxStore['channels'][0]['chMixerConnection'],
): Map<number, string> {
    if (chMixerConnection === channelLabelCacheConnections && channelLabelCache) {
        return channelLabelCache
    }

    const labelsByFader = new Map<number, string>()
    for (const conn of chMixerConnection) {
        for (const ch of conn.channel) {
            if (ch.label && !labelsByFader.has(ch.assignedFader)) {
                labelsByFader.set(ch.assignedFader, ch.label)
            }
        }
    }

    channelLabelCacheConnections = chMixerConnection
    channelLabelCache = labelsByFader
    return labelsByFader
}

export function getChannelLabel(
    state: ReduxStore,
    faderIndex: number,
): string | undefined {
    let label = getChannelLabelsByFader(
        state.channels[0].chMixerConnection,
    ).get(faderIndex)
    if (
        state.settings[0].labelControlsIgnoreAutomation &&
        label?.startsWith(state.settings[0].labelIgnorePrefix)
    ) {
        label = label.slice(state.settings[0].labelIgnorePrefix.length)
    }
    return label
}

export function getFaderLabel(faderIndex: number, defaultName = 'CH'): string {
    const state = getSisyfosReduxState()
    const automationLabel =
        state.faders[0].fader[faderIndex] &&
        state.faders[0].fader[faderIndex].label !== ''
            ? state.faders[0].fader[faderIndex].label
            : undefined
    const userLabel =
        state.faders[0].fader[faderIndex] &&
        state.faders[0].fader[faderIndex].userLabel !== ''
            ? state.faders[0].fader[faderIndex].userLabel
            : undefined
    const channelLabel = getChannelLabel(state, faderIndex)

    switch (state.settings[0].labelType) {
        case 'automation':
            return automationLabel || defaultName + ' ' + (faderIndex + 1)
        case 'user':
            return userLabel || defaultName + ' ' + (faderIndex + 1)
        case 'channel':
            return channelLabel || defaultName + ' ' + (faderIndex + 1)
        case 'automatic':
        default:
            return (
                userLabel ||
                automationLabel ||
                channelLabel ||
                defaultName + ' ' + (faderIndex + 1)
            )
    }
}
