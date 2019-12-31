const WebSocketServer = require('websocket').server
const HttpServer = require('http')
const { WsConnection } = require('./WsConnection')
const { Action } = require('./Action')
const { WsBase } = require('./WsBase')

exports.WsServer = class WsServer extends WsBase {
  static listen(port) {
    const server = new WsServer()
    return server.listen(port)
  }

  constructor() {
    super()
    this.connections = []
    const httpServer = HttpServer.createServer((req, res) => { res.writeHead(404); res.end() })
    this.wsServer = new WebSocketServer({ httpServer, autoAcceptConnections: false })
    this.wsServer.on('request', this.onRequest.bind(this))
  }

  listen(port = 8080) {
    return new Promise((resolve) => {
      const [httpServer] = this.wsServer.config.httpServer
      httpServer.listen(port, () => { resolve(this) })
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
    if (message.type === 'utf8') {
      const action = new Action(connection, JSON.parse(message.utf8Data))
      if (action.type === 'request') {
        this.onActionRequest(action)
      } else if (action.type === 'response') {
        this.onActionResponse(action)
      }
    } else if (message.type === 'binary') {
      this.log(`Received Binary Message of: ${message.binaryData.length} bytes`)
      connection.sendBytes(message.binaryData)
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
}
