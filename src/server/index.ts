import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv-esm'
import { firstRun } from './server.js'

const __dirname = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../'
)

if (process.env.DEV === 'true') config({ path: path.join(__dirname, './.env') })

const [app, httpsServer] = await firstRun(__dirname)

const parsedPort = parseInt(process.env.PORT ?? '')
const PORT = !isNaN(parsedPort) ? parsedPort : 4000
const parsedHttpPort = parseInt(process.env.HTTP_PORT ?? '')
const HTTP_PORT = !isNaN(parsedHttpPort) ? parsedHttpPort : 3000
if (process.env.ADDRESS !== undefined && !URL.canParse(process.env.ADDRESS)) { throw new Error('Please provide a valid address to bind to in the .env: ADDRESS') }
const ADDRESS = process.env.ADDRESS ?? '0.0.0.0'

if (httpsServer !== null) {
  httpsServer.listen(PORT, ADDRESS, () => {
    console.log('App listening at ', ADDRESS + ':' + PORT)
  })
}

app.listen(HTTP_PORT, ADDRESS, () => {
  console.log('App listening at ', ADDRESS + ':' + HTTP_PORT)
})
