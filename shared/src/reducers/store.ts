import { Faders } from './fadersReducer'
import { Channels } from './channelsReducer'
import indexReducer from './indexReducer'
import { Settings } from './settingsReducer'
import { configureStore } from '@reduxjs/toolkit'

export interface ReduxStore {
  settings: Array<Settings>
  channels: Array<Channels>
  faders: Array<Faders>
}

export default configureStore({reducer: indexReducer})
export { Store } from 'redux'