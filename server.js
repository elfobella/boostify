const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// SSL certificate paths
const keyPath = path.join(__dirname, 'localhost+2-key.pem')
const certPath = path.join(__dirname, 'localhost+2.pem')

// Check if certificates exist
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('\n❌ SSL sertifikaları bulunamadı!')
  console.error('\nLütfen önce aşağıdaki komutları çalıştırın:')
  console.error('  1. brew install mkcert')
  console.error('  2. mkcert -install')
  console.error('  3. mkcert localhost 127.0.0.1 ::1')
  console.error('\nDaha fazla bilgi için: docs/LOCALHOST_HTTPS_SETUP.md\n')
  process.exit(1)
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`\n✅ HTTPS server hazır!`)
    console.log(`   https://${hostname}:${port}\n`)
  })
})

