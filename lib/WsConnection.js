const { promisify } = require('./util')

exports.WsConnection = class WsConnection {
  constructor(server, connection) {
    this.server = server
    this.connection = connection
    this.connection.on('message', this.onMessage.bind(this))
    this.connection.on('close', this.onClose.bind(this))
  }

  sendUTF(utf8Data) {
    return promisify((handler) => {
      this.connection.sendUTF(utf8Data, handler)
    })
  }

  sendBytes(binaryData) {
    return promisify((handler) => {
      this.connection.sendBytes(binaryData, handler)
    })
  }

  onMessage(message) {
    this.server.onMessage(this, message)
  }

  onClose(reasonCode, description) {
    this.server.onClose(this, reasonCode, description)
  }

  get remoteAddress() {
    return this.connection.remoteAddress
  }
}
