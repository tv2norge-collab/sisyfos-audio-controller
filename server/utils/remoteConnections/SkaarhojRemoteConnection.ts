//Node Modules:
const net = require('net')
import { store, state } from '../../reducers/store'
import { mixerGenericConnection } from '../../mainClasses'

import { SET_FADER_LEVEL } from '../../reducers/faderActions'

//Utils:
import {
    IRemoteProtocol,
    RemoteFaderPresets,
} from '../../constants/remoteProtocols/SkaarhojProtocol'
import { MixerProtocolPresets } from '../../constants/MixerProtocolPresets'
import { logger } from '../logger'

export class SkaarhojRemoteConnection {
    store: any
    remoteProtocol: IRemoteProtocol
    mixerProtocol: any
    clientList: any[]

    constructor() {
        this.updateRemoteFaderState = this.updateRemoteFaderState.bind(this)

        this.remoteProtocol = RemoteFaderPresets.rawPanel
        this.mixerProtocol =
            MixerProtocolPresets[state.settings[0].mixerProtocol] ||
            MixerProtocolPresets.genericMidi
        this.clientList = []

        const server = net.createServer((client: any) => {
            this.clientList.push(client)
            this.setupRemoteFaderConnection(client)
        })

        server.listen(9923, '0.0.0.0')
        logger.info('Skaarhoj server listening at port 9923')
    }

    setupRemoteFaderConnection(client: any) {
        client
            .on('data', (data: any) => {
                console.log('Skaarhoj Data Received: ' + data.toString())
                data.toString()
                    .split('\n')
                    .forEach((command: string) => {
                        if (command === 'RDY') {
                            client.write('ready ok\n')
                        } else if (command === 'list') {
                            console.log('Activating Skaarhoj panel')
                            client.write('ActivePanel=1\n')
                        } else if (command.includes('map=1:')) {
                            // Initialize:
                            console.log('Initializing Skaarhoj remote')
                            state.faders[0].fader.forEach(
                                (fader: any, index: number) => {
                                    console.log(
                                        'Initializing skaahoj fader - index:',
                                        index
                                    )
                                    this.updateRemoteFaderState(
                                        index,
                                        state.faders[0].fader[index].faderLevel
                                    )
                                }
                            )
                        } else if (command === 'ping') {
                            client.write('pingo\n')
                        } else if (command === 'ack') {
                            client.write('ack\n')
                        } else if (command.substring(0, 4) === 'HWC#') {
                            this.handleRemoteCommand(command)
                        }
                    })
            })
            .on('error', function () {
                if (this.clientList) {
                    this.clientList.splice(this.clientList.find(client), 1)
                }
                console.log('Lost Connection to Skaarhoj panel')
            })
            .on('close', function () {
                if (this.clientList) {
                    this.clientList.splice(this.clientList.find(client), 1)
                }
                console.log('Skaarhoj Connection closed')
            })
    }

    handleRemoteCommand(command: string) {
        let btnNumber = parseInt(
            command.slice(command.indexOf('#') + 1, command.indexOf('='))
        )
        let event = command.slice(command.indexOf('=') + 1)
        if (btnNumber > 6 && btnNumber < 11) {
            let channel = btnNumber - 7
            let level = state.faders[0].fader[channel].faderLevel
            if (event === 'Enc:1') {
                level += 0.01
                if (level > 1) {
                    level = 1
                }
            } else if (event === 'Enc:2') {
                level += 0.1
                if (level < 0) {
                    level = 0
                }
            } else if (event === 'Enc:-1') {
                level -= 0.01
                if (level < 0) {
                    level = 0
                }
            } else if (event === 'Enc:-2') {
                level -= 0.1
                if (level < 0) {
                    level = 0
                }
            }
            //Fader changed:
            console.log('Received Fader ' + channel + ' Level : ' + level)
            store.dispatch({
                type: SET_FADER_LEVEL,
                channel: channel,
                level: level,
            })
            mixerGenericConnection.updateOutLevel(channel)
            global.mainThreadHandler.updatePartialStore(channel)
            this.updateRemoteFaderState(channel, level)
        }
    }

    updateRemoteFaderState(channelIndex: number, outputLevel: number) {
        console.log(
            'Send fader update - ',
            'Channel index : ',
            channelIndex,
            'OutputLevel : ',
            outputLevel
        )

        this.clientList.forEach((client) => {
            let formatLevel = (outputLevel * 100).toFixed()
            let formatLabel =
                state.faders[0].fader[channelIndex].label ||
                'CH' + String(channelIndex + 1)
            let formattetString =
                'HWCt#' +
                String(channelIndex + 7) +
                '=' +
                formatLevel +
                '|||||' +
                formatLabel +
                '\n'
            // 32767|||||label
            console.log('Sending command to Skaarhoj :', formattetString)
            client.write(formattetString)
        })
        this.updateRemotePgmPstPfl(channelIndex)
    }

    updateRemotePgmPstPfl(channelIndex: number) {
        /*
        if (!this.rawOutput) {
            return
        }
        //Update SELECT button:
        this.rawOutput.sendControlChange(12, channelIndex, 1)
        this.rawOutput.sendControlChange(
            44,
            1 + 64 * (state.faders[0].fader[channelIndex].pgmOn ? 1 : 0),
            1
        )

        //Update SOLO button:
        this.rawOutput.sendControlChange(12, channelIndex, 1)
        this.rawOutput.sendControlChange(
            44,
            3 + 64 * (state.faders[0].fader[channelIndex].pflOn ? 1 : 0),
            1
        )
        */
    }
}
