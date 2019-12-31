const WebSocketClient = require('websocket').client
const { WsBase } = require('./WsBase')
const { Action } = require('./Action')
const { promisify } = require('./util')

exports.WsClient = class WsClient extends WsBase {
  static connect(url, protocol) {
    const client = new WsClient()
    return client.connect(url, protocol)
  }

  constructor() {
    super()
    this.client = new WebSocketClient()
    this.client.on('connectFailed', this.onError.bind(this))
    this.client.on('connect', this.onConnect.bind(this))
  }

  connect(url = 'ws://localhost:8080/', protocol = 'echo-protocol') {
    return new Promise((resolve) => {
      this.resolve = resolve
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
    this.log('echo-protocol Connection Closed')
  }

  onMessage(message) {
    if (message.type === 'utf8') {
      const data = JSON.parse(message.utf8Data)
      const action = new Action(this, data)
      if (action.type === 'request') {
        this.onActionRequest(action)
      } else if (action.type === 'response') {
        this.onActionResponse(action)
      }
    } else if (message.type === 'binary') {
      this.log(`Received Binary Message of: ${message.binaryData.length} bytes`)
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
