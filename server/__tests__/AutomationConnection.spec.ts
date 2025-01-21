// Mock the mainClasses module
jest.mock('../src/mainClasses', () => ({
    mixerGenericConnection: {
        checkForAutoResetThreshold: jest.fn(),
        updateOutLevel: jest.fn(),
        updateNextAux: jest.fn(),
        updateMuteState: jest.fn(),
        updateInputGain: jest.fn(),
        updateInputSelector: jest.fn(),
        updateChannelName: jest.fn(),
        updateFadeToBlack: jest.fn(),
        updateOutLevels: jest.fn(),
    },
    automationConnection: null,
    remoteConnections: null,
}))

// Mock the MainThreadHandler module:
import { MainThreadHandlers } from '../src/MainThreadHandler'

const mockMainThreadHandler: Partial<MainThreadHandlers> = {
    updatePartialStore: jest.fn(),
    updateFullClientStore: jest.fn(),
    reIndexAssignedChannelsRelation: jest.fn(),
    cleanUpAssignedChannelsOnFaders: jest.fn(),
    loadMixerPreset: jest.fn(),
    snapshotHandler: {} as any, // Mock other required properties
}

// Before the describe block:
declare global {
    namespace NodeJS {
        interface Global {
            mainThreadHandler: MainThreadHandlers
        }
    }
}

// Mock UDPPort
let messageHandler: (message: any, timeTag?: any, info?: any) => void
const mockUdpInstance = {
    on: jest.fn().mockImplementation((event, handler) => {
        // Store the message handler when it's registered
        if (event === 'message') {
            messageHandler = handler
        }
        return {
            on: jest.fn().mockReturnThis(),
            open: jest.fn(),
        }
    }),
    open: jest.fn(),
    send: jest.fn(),
}
const MockUDPPort = jest.fn().mockImplementation(() => mockUdpInstance)

// Mock the osc module
jest.mock('osc', () => ({
    UDPPort: MockUDPPort,
}))

import { EventEmitter } from 'events'
import { ChannelActionTypes } from '../../shared/src/actions/channelActions'
import { FaderActionTypes } from '../../shared/src/actions/faderActions'
import { SettingsActionTypes } from '../../shared/src/actions/settingsActions'
import { defaultChannelsReducerState } from '../../shared/src/reducers/channelsReducer'
import { defaultFadersReducerState } from '../../shared/src/reducers/fadersReducer'
import { defaultSettingsReducerState } from '../../shared/src/reducers/settingsReducer'
import { store } from '../src/reducers/store'
import { AutomationConnection } from '../src/utils/AutomationConnection'
import osc from 'osc'

// Update the mock to extend EventEmitter
class MockOscConnection extends EventEmitter {
    open() {}
    send() {}
}

describe('AutomationConnection', () => {
    let automation: AutomationConnection
    let mockOscConnection: MockOscConnection
    let messageHandler: any

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks()
        global.mainThreadHandler = mockMainThreadHandler

        // Reset mock implementation
        mockUdpInstance.on.mockReturnThis()

        store.dispatch({
            type: FaderActionTypes.SET_COMPLETE_FADER_STATE,
            numberOfFaders: 8,
            allState: defaultFadersReducerState(8)[0],
        })

        store.dispatch({
            type: ChannelActionTypes.SET_COMPLETE_CH_STATE,
            numberOfTypeChannels: [{ numberOfTypeInCh: [8] }],
            allState: defaultChannelsReducerState([
                { numberOfTypeInCh: [8] },
            ])[0],
        })

        store.dispatch({
            type: SettingsActionTypes.UPDATE_SETTINGS,
            settings: defaultSettingsReducerState,
        })

        // Create automation instance
        automation = new AutomationConnection()
        mockOscConnection = new MockOscConnection()

        // Get the message handler that was registered
        const messageHandlerCall = mockUdpInstance.on.mock.calls.find(
            (call) => call[0] === 'message'
        )
        messageHandler = messageHandlerCall[1]

        // Set up fake timers before handling message
        jest.useFakeTimers()

    })

    describe('initialization', () => {
        it('should create UDP connection with correct settings', () => {
            expect(MockUDPPort).toHaveBeenCalledWith({
                localAddress: '0.0.0.0',
                localPort: 5255,
            })
        })

        it('should set up event listeners', () => {
            expect(mockUdpInstance.on).toHaveBeenCalledWith(
                'ready',
                expect.any(Function)
            )
            expect(mockUdpInstance.on).toHaveBeenCalledWith(
                'message',
                expect.any(Function)
            )
            expect(mockUdpInstance.on).toHaveBeenCalledWith(
                'error',
                expect.any(Function)
            )
        })
    })

    describe('OSC Message Handling', () => {
        describe('/ch/{value1}/pgm', () => {
            it('The initial state should be' , () => {
                const state = store.getState()
                expect(state.faders[0].fader[0].pgmOn).toBe(false)
                expect(state.faders[0].fader[0].voOn).toBe(false)
            })
            it('should set channel PGM state ON', () => {
                // Call the handler with properly formatted OSC message
                messageHandler({
                    address: '/ch/1/pgm',
                    args: [1],
                })

                jest.runAllTimers()

                const state = store.getState()
                expect(state.faders[0].fader[0].pgmOn).toBe(true)
                expect(state.faders[0].fader[0].voOn).toBe(false)
            })
            it('should set channel PGM state OFF', () => {
                // Call the handler with properly formatted OSC message
                messageHandler({
                    address: '/ch/1/pgm',
                    args: [0],
                })
                jest.runAllTimers()

                const state = store.getState()
                expect(state.faders[0].fader[0].pgmOn).toBe(false)
                expect(state.faders[0].fader[0].voOn).toBe(false)
            })
        })
    })
})

