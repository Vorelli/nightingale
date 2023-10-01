import cors, { type CorsOptions } from 'cors'
import { type Request } from 'express'

const allowlist = [
  'toscanonatale.dev',
  'www.toscanonatale.dev',
  'http://localhost:4444',
  'http://192.168.0.200:8080',
  'http://192.168.0.200:8080/',
  'http://localhost:8080',
  'http://localhost:8080/',
  undefined
]

type CorsCallBack = ((err: any, options: CorsOptions) => void)
const corsOptions = function (req: Request, callback: CorsCallBack): void {
  const corsOps: CorsOptions = {
    origin: allowlist.includes(req.headers.referer ?? req.headers.host ?? req.headers.origin ?? '')
  }
  callback(null, corsOps)
}

export const setCorsAndHeaders = [cors(corsOptions)]
