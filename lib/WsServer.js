const WebSocketServer = require('websocket').server
const HttpServer = require('http')
const { WsConnection } = require('./WsConnection')
const { Action } = require('./Action')
const { WsBase } = require('./WsBase')

exports.WsServer = class WsServer extends WsBase {
  static start(options) {
    const server = new WsServer()
    return server.start(options)
  }

  constructor(verbose) {
    super(verbose)
    this.connections = []
    const httpServer = HttpServer.createServer((req, res) => { res.writeHead(404); res.end() })
    this.wsServer = new WebSocketServer({ httpServer, autoAcceptConnections: false })
    this.wsServer.on('request', this.onRequest.bind(this))
  }

  start({ port = 8080, hostname = '127.0.0.1' } = {}) {
    return new Promise((resolve) => {
      const [httpServer] = this.wsServer.config.httpServer
      httpServer.listen(port, hostname, () => { resolve(this) })
    })
  }

  onRequest(request) {
    if (!this.isOriginAllowed(request.origin)) {
      this.log(`connection from origin ${request.origin} rejected`)
      request.reject()
      return
    }
    const connection = request.accept('echo-protocol', request.origin)
    this.log('connection accepted')
    const wsConnection = new WsConnection(this, connection)
    this.connections.push(wsConnection)
  }

  onMessage(connection, message) {
    const action = Action.decode(connection, message)
    if (action.type === 'request') {
      this.onActionRequest(action)
    } else if (action.type === 'response') {
      this.onActionResponse(action)
    }
  }

  onClose(connection) {
    this.log(`Peer ${connection.remoteAddress} disconnected.`)
    const index = this.connections.indexOf(connection)
    if (index === -1) { return }
    this.connections.splice(index, 1)
  }

  isOriginAllowed() {
    return true
  }

  close() {
    return new Promise((resolve) => {
      this.wsServer.closeAllConnections()
      this.wsServer.shutDown()
      this.wsServer.config.httpServer[0].close(resolve)
    })
  }
}
