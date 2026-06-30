import { logger } from './utils/logger'
import { socketSubscribeVu, socketUnsubscribeVu } from './utils/vuServer'
import {
    socketSubscribeOutputLevel,
    socketUnsubscribeOutputLevel,
} from './utils/outputLevelServer'
import {
    STORAGE_FOLDER,
    saveSettings,
    saveMixerPreset,
    deleteMixerPreset,
    saveCustomPages,
    getCustomPages,
} from './utils/SettingsStorage'
import { SOCKET_RETURN_PAGES_LIST } from '../../shared/src/constants/SOCKET_IO_DISPATCHERS'
import { state, store } from './reducers/store'
import { SettingsActionTypes } from '../../shared/src/actions/settingsActions'
import {
    getPluginEntry,
    getInputSelectorPlugin,
} from './utils/mixerPluginRegistry'

import express from 'express'
import path from 'path'
import { Server } from 'http'
import { Server as SocketServer } from 'socket.io'
const ROOT_PATH = process.env.ROOT_PATH ?? '/'
const SOCKET_SERVER_PATH =
    ROOT_PATH + (ROOT_PATH.endsWith('/') ? '' : '/') + 'socket.io/'
const app = express()
const server = new Server(app)
const socketServer = new SocketServer(server, {
    path: SOCKET_SERVER_PATH,
    cors: {
        origin: '*',
    },
})
const SERVER_PORT = 1176
const staticPath = path.join(
    path.dirname(require.resolve('client/package.json')),
    'dist'
)
logger.data(staticPath).debug('Express static file path:')
app.use(ROOT_PATH, express.static(staticPath))

// Mixer preset file management HTTP endpoints
app.get(
    '/api/mixer-preset/:filename',
    (req: express.Request, res: express.Response) => {
        const filename = path.basename(req.params.filename)
        const filePath = path.join(STORAGE_FOLDER, filename)
        res.download(filePath, filename, (err: any) => {
            if (err && !res.headersSent) {
                logger.error(`Error downloading preset ${filename}: ${err}`)
                res.status(404).send('File not found')
            }
        })
    }
)

app.put(
    '/api/mixer-preset/:filename',
    express.raw({ type: '*/*', limit: '50mb' }),
    async (req: express.Request, res: express.Response) => {
        const filename = path.basename(req.params.filename)
        if (!filename) {
            res.status(400).send('filename required')
            return
        }
        try {
            await saveMixerPreset(filename, req.body as Buffer)
            res.status(200).send('OK')
        } catch (error: any) {
            logger.data(error).error(`Error saving mixer preset: ${filename}`)
            res.status(500).send('Error saving file')
        }
    }
)

app.delete(
    '/api/mixer-preset/:filename',
    async (req: express.Request, res: express.Response) => {
        const filename = path.basename(req.params.filename)
        try {
            await deleteMixerPreset(filename)
            res.status(200).send('OK')
        } catch (error: any) {
            logger.data(error).error(`Error deleting mixer preset: ${filename}`)
            res.status(404).send('File not found')
        }
    }
)

// Pages HTTP endpoints
app.get('/api/pages', (_req: express.Request, res: express.Response) => {
    const pages = getCustomPages()
    res.setHeader('Content-Disposition', 'attachment; filename="pages.json"')
    res.json(pages)
})

app.put(
    '/api/pages',
    express.json({ limit: '1mb' }),
    async (req: express.Request, res: express.Response) => {
        const pages = req.body
        if (
            !Array.isArray(pages) ||
            !pages.every(
                (p: any) =>
                    typeof p.id === 'string' &&
                    typeof p.label === 'string' &&
                    Array.isArray(p.faders)
            )
        ) {
            res.status(400).send('Invalid pages format')
            return
        }
        try {
            await saveCustomPages(pages)
            socketServer.emit(SOCKET_RETURN_PAGES_LIST, pages)
            res.status(200).send('OK')
        } catch (error: any) {
            logger.data(error).error('Error saving pages')
            res.status(500).send('Error saving pages')
        }
    }
)

// Plugin settings HTTP endpoints (unified for all plugin types)
// GET returns { enabled, options }
// PUT accepts { enabled?, options? } — upserts the plugin config for this mixer
app.get(
    '/api/plugin-settings/:pluginId/:mixerIndex',
    (req: express.Request, res: express.Response) => {
        const pluginId = String(req.params.pluginId || '')
        const mixerIndex = Number(req.params.mixerIndex)
        if (!pluginId || Number.isNaN(mixerIndex)) {
            res.status(400).send('Invalid plugin id or mixer index')
            return
        }

        const entry = getPluginEntry(pluginId)
        if (!entry) {
            res.status(404).send('Unknown plugin')
            return
        }

        const config = state.settings[0].mixers[mixerIndex]?.[entry.stateKey]
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${pluginId}-mixer-${mixerIndex}-settings.json"`
        )
        res.json({
            enabled: config?.enabled ?? false,
            options: config?.options ?? {},
        })
    }
)

app.put(
    '/api/plugin-settings/:pluginId/:mixerIndex',
    express.json({ limit: '1mb' }),
    (req: express.Request, res: express.Response) => {
        const pluginId = String(req.params.pluginId || '')
        const mixerIndex = Number(req.params.mixerIndex)
        if (!pluginId || Number.isNaN(mixerIndex)) {
            res.status(400).send('Invalid plugin id or mixer index')
            return
        }

        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        ) {
            res.status(400).send('Body must be a JSON object')
            return
        }

        const entry = getPluginEntry(pluginId)
        if (!entry) {
            res.status(404).send('Unknown plugin')
            return
        }

        const body = req.body as {
            enabled?: boolean
            options?: Record<string, unknown>
        }

        const existing = state.settings[0].mixers[mixerIndex]?.[entry.stateKey]
        const newEnabled =
            typeof body.enabled === 'boolean'
                ? body.enabled
                : (existing?.enabled ?? false)

        let mergedOptions: Record<string, unknown> = {
            ...(existing?.options || {}),
        }
        if (body.options !== undefined) {
            if (
                typeof body.options !== 'object' ||
                Array.isArray(body.options)
            ) {
                res.status(400).send('options must be an object')
                return
            }
            mergedOptions = { ...mergedOptions, ...body.options }
        }

        const nextSettings = JSON.parse(
            JSON.stringify(state.settings[0])
        ) as (typeof state.settings)[0]
        nextSettings.mixers[mixerIndex][entry.stateKey] = {
            pluginId,
            enabled: newEnabled,
            options: mergedOptions,
        }
        store.dispatch({
            type: SettingsActionTypes.UPDATE_SETTINGS,
            settings: nextSettings,
        })
        saveSettings(nextSettings)
        socketServer.emit('set-settings', nextSettings)
        res.status(200).json({ enabled: newEnabled, options: mergedOptions })
    }
)

app.post(
    '/api/plugin-state/:pluginId/:mixerIndex/reset',
    (req: express.Request, res: express.Response) => {
        const mixerIndex = Number(req.params.mixerIndex)
        if (Number.isNaN(mixerIndex)) {
            res.status(400).send('Invalid mixer index')
            return
        }
        const pluginId = String(req.params.pluginId || '')
        const entry = getPluginEntry(pluginId)
        if (!entry) {
            res.status(404).send('Unknown plugin')
            return
        }
        const plugin = getInputSelectorPlugin(mixerIndex)
        if (!plugin) {
            res.status(404).send(
                'No active input selector plugin for this mixer'
            )
            return
        }
        if (!plugin.reset) {
            res.status(405).send('This plugin does not support reset')
            return
        }
        try {
            plugin.reset()
        } catch (error) {
            logger.data(error).error('Input selector reset failed')
            res.status(500).send('Reset failed')
            return
        }
        res.status(200).send('OK')
    }
)

server.listen(SERVER_PORT)
logger.info(`Server started at http://localhost:${SERVER_PORT}${ROOT_PATH}`)

socketServer.on('connection', (socket: any) => {
    logger.info(`Client connected: ${socket.client.id}`)
    global.mainThreadHandler.socketServerHandlers(socket)

    socket.on('subscribe-vu-meter', () => {
        logger.debug('Socket subscribe vu')
        socketSubscribeVu(socket)
    })
    socket.on('subscribe-output-level', () => {
        logger.debug('Socket subscribe output')
        socketSubscribeOutputLevel(socket)
    })
    socket.on('disconnect', () => {
        socketUnsubscribeVu(socket)
        socketUnsubscribeOutputLevel(socket)
    })
})

export const expressInit = () => {
    logger.info('Initialising WebServer')
}

export { socketServer }
