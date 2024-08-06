import { createStore } from 'redux'
import { Faders } from './fadersReducer'
import { Channels } from './channelsReducer'
import indexReducer from './indexReducer'
import { Settings } from './settingsReducer'

export interface ReduxStore {
  settings: Array<Settings>
  channels: Array<Channels>
  faders: Array<Faders>
}

const store = createStore(indexReducer)

export default store

export type AppDispatch = typeof store.dispatch;

export { Store } from 'redux'
