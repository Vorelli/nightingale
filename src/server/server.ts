import path from 'path'
import express from 'express'
import type https from 'https'
import express_ws, { type Application, type WithWebsocketMethod } from 'express-ws'
import compression from 'compression'
import morgan from 'morgan'
import { type IncomingMessage, type Server, type ServerResponse } from 'http'
import { type WsInstance } from './types/types.js'

// import { sessionsMiddleware } from './middleware/sessions.js'
import { setCorsAndHeaders } from './middleware/corsAndHeaders.js'
import { attachWebsocketRoutes } from './middleware/attachWebSocketRoutes.js'
import apiHandler from './handlers/apiHandler.js'
import setLocals from './helpers/setLocals.js'

async function firstRun (__dirname: string): Promise<
[Application & WithWebsocketMethod, Server<typeof IncomingMessage, typeof ServerResponse> | null]
> {
  const appStart: express.Application = express()
  const { app, getWss }: WsInstance = express_ws(appStart)
  const httpsServer: https.Server | null = setLocals(app, getWss, appStart, __dirname)

  if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'))
  app.use(compression())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use(setCorsAndHeaders)
  app.options('*', setCorsAndHeaders)
  // app.use(sessionsMiddleware) TODO: Fix sessions middleware

  console.log('public path:', path.join(__dirname, 'public'))
  app.use(express.static(path.join(__dirname, 'public')))
  attachWebsocketRoutes(app)
  app.use('/api', apiHandler)
  return [app, httpsServer]
}

export { firstRun }
