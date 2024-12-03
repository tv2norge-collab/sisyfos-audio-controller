import { useEffect, useState } from 'react'
import { socketClientHandlers } from '../utils/SocketClientHandlers'
import io from 'socket.io-client'
import {
    SOCKET_GET_SNAPSHOT_LIST,
    SOCKET_GET_CCG_LIST,
    SOCKET_GET_MIXER_PRESET_LIST,
    SOCKET_GET_PAGES_LIST,
} from '../../../shared/src/constants/SOCKET_IO_DISPATCHERS'
import storeRedux from '../../../shared/src/reducers/store'

export function useSocketConnection(customUri?: string, customPath?: string, query?: Record<string, string>) {
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        window.storeRedux = storeRedux

        //Subscribe to redux store:
        window.reduxState = window.storeRedux.getState()
        const unsubscribe = window.storeRedux.subscribe(() => {
            window.reduxState = window.storeRedux.getState()
        })

        const { pathname, host } = window.location
        const socketServerPath = customPath ??
            pathname + (pathname.endsWith('/') ? '' : '/') + 'socket.io/'
        const uri = customUri ?? host

        window.socketIoClient = io(uri, {
            path: socketServerPath,
            query,
        })
        socketClientHandlers()

        window.socketIoClient.emit(SOCKET_GET_SNAPSHOT_LIST)
        window.socketIoClient.emit(SOCKET_GET_CCG_LIST)
        window.socketIoClient.emit(SOCKET_GET_MIXER_PRESET_LIST)

        console.log('Setting up SocketIO connection ' + socketServerPath)
        window.socketIoClient.emit('get-mixerprotocol', 'get selected mixerprotocol')
        window.socketIoClient.emit('get-store', 'update local store')
        window.socketIoClient.emit('get-settings', 'update local settings')
        window.socketIoClient.emit(SOCKET_GET_PAGES_LIST)

        setInitialized(true);

        return () => {
            if (window.socketIoClient) {
                window.socketIoClient.removeAllListeners()
                window.socketIoClient.disconnect()
            }
            unsubscribe()
            window.socketIoClient = undefined
        }
    }, [customUri, customPath])
    return { initialized }
}
