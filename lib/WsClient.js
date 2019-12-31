const WebSocketClient = require('websocket').client
const { WsBase } = require('./WsBase')
const { Action } = require('./Action')
const { promisify } = require('./util')

exports.WsClient = class WsClient extends WsBase {
  static start(options) {
    const client = new WsClient()
    return client.start(options)
  }

  constructor(verbose) {
    super(verbose)
    this.client = new WebSocketClient()
    this.client.on('connectFailed', this.onError.bind(this))
    this.client.on('connect', this.onConnect.bind(this))
  }

  start({ port = 8080, hostname = '127.0.0.1', protocol = 'echo-protocol', scheme = 'ws' } = {}) {
    return new Promise((resolve) => {
      this.resolve = resolve
      const url = `${scheme}://${hostname}:${port}/`
      this.client.connect(url, protocol)
    })
  }

  onConnect(connection) {
    this.connection = connection
    this.log('WebSocket Client Connected')
    this.connection.on('error', this.onError.bind(this))
    this.connection.on('close', this.onClose.bind(this))
    this.connection.on('message', this.onMessage.bind(this))
    this.resolve(this)
  }

  onError(error) {
    this.log(`Websocket Error: ${error}`)
  }

  onClose() {
    for (const action of this.runningActions) {
      action.fail()
    }
    this.log('echo-protocol Connection Closed')
  }

  onMessage(message) {
    const action = Action.decode(this, message)
    if (action.type === 'request') {
      this.onActionRequest(action)
    } else if (action.type === 'response') {
      this.onActionResponse(action)
    }
  }

  sendUTF(utfData) {
    return promisify((handler) => {
      if (!this.connection.connected) { handler(new Error('No connection available')); return }
      this.connection.sendUTF(utfData, handler)
    })
  }

  sendBytes(binaryData) {
    return promisify((handler) => {
      if (!this.connection.connected) { handler(new Error('No connection available')); return }
      this.connection.sendBytes(binaryData, handler)
    })
  }

  close() {
    return this.connection.close()
  }
}
