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

// Mock UDPPort instance that will be returned
const mockUdpInstance = {
    on: jest.fn().mockReturnThis(), // Return this to allow chaining
    open: jest.fn(),
    send: jest.fn()
}

// Create the mock UDPPort constructor
const MockUDPPort = jest.fn(() => mockUdpInstance)

// Mock the osc module
jest.mock('osc', () => ({
    UDPPort: MockUDPPort
}))

import { AutomationConnection } from '../src/utils/AutomationConnection'
import osc from 'osc'

describe('AutomationConnection', () => {
    let automation: AutomationConnection
    
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks()
        
        // Reset mock implementation
        mockUdpInstance.on.mockReturnThis()
        
        // Create automation instance
        automation = new AutomationConnection()
    })

    describe('initialization', () => {
        it('should create UDP connection with correct settings', () => {
            expect(MockUDPPort).toHaveBeenCalledWith({
                localAddress: '0.0.0.0',
                localPort: 5255
            })
        })

        it('should set up event listeners', () => {
            expect(mockUdpInstance.on).toHaveBeenCalledWith('ready', expect.any(Function))
            expect(mockUdpInstance.on).toHaveBeenCalledWith('message', expect.any(Function))
            expect(mockUdpInstance.on).toHaveBeenCalledWith('error', expect.any(Function))
        })
    })
})