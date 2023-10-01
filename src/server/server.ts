import path from 'path'
import express from 'express'
import https from 'https'
import fs from 'fs'
import express_ws, { type Application, type WithWebsocketMethod } from 'express-ws'
import compression from 'compression'
import morgan from 'morgan'
import { type IncomingMessage, type Server, type ServerResponse } from 'http'

import { dbMigrate } from './db/schema.js'
import { sessionsMiddleware } from './middleware/sessions.js'
import { setCorsAndHeaders } from './middleware/corsAndHeaders.js'
import { attachWebsocketRoutes } from './middleware/attachWebSocketRoutes.js'
import apiHandler from './handlers/apiHandler.js'
import { type WsInstance } from './types/types.js'
import { type WebSocket } from 'ws'
import waitForSongsToLoad from './middleware/waitForSongsToLoad.js'

async function firstRun (
  __dirname: string
): Promise<
  [Application & WithWebsocketMethod, Server<typeof IncomingMessage, typeof ServerResponse> | null]
  > {
  const [db, pool] = await dbMigrate(__dirname)
  let httpsServer: null | https.Server = null
  const appStart: express.Application = express()
  let { app, getWss }: WsInstance = express_ws(appStart)
  const httpGetWss = getWss
  if (process.env.KEY_PATH !== undefined && process.env.CERT_PATH !== undefined) {
    const options = {
      key: fs.readFileSync(path.resolve(process.env.KEY_PATH)),
      cert: fs.readFileSync(path.resolve(process.env.CERT_PATH))
    }
    httpsServer = https.createServer(options, appStart);
    ({ getWss } = express_ws(app, httpsServer))
  }

  if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'))
  app.use(compression())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.locals.getWss = function () {
    const httpClients = httpGetWss()
    Array.from(getWss().clients.values())
      .forEach((client: WebSocket) => httpClients.clients.add(client))
    return { clients: httpClients.clients }
  }
  app.locals.__dirname = __dirname
  app.locals.shuffleBy = 'random'
  app.locals.pool = pool
  app.locals.db = db
  const infoDir = path.resolve(__dirname, 'public/info')
  app.locals.infoDir = infoDir
  app.use(waitForSongsToLoad)

  app.use(setCorsAndHeaders)
  app.options('*', setCorsAndHeaders)
  app.use(sessionsMiddleware)

  app.use(express.static(path.join(__dirname, 'public')))
  attachWebsocketRoutes(app)
  app.use('/api', apiHandler)
  return [app, httpsServer]
}

export { firstRun }
