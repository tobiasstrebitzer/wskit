const uuid = require('uuid/v1')

exports.Action = class Action {
  static createRequest(handler, method, params = {}) {
    return new Action(handler, { type: 'request', id: uuid(), method, params })
  }

  static decode(handler, message) {
    if (message.type === 'utf8') {
      return new Action(handler, JSON.parse(message.utf8Data))
    }
    const buffer = message.binaryData
    const count = parseInt(buffer.hexSlice(0, 2), 10)
    const data = JSON.parse(buffer.utf8Slice(2, count + 2))
    data.params = buffer.slice(count + 2)
    return new Action(handler, data)
  }

  constructor(handler, data) {
    this.handler = handler
    this.id = data.id
    this.type = data.type
    this.method = data.method
    this.params = data.params
  }

  respond(params) {
    const { id, method } = this
    const response = new Action(this.handler, { id, method, params, type: 'response' })
    return response.send()
  }

  send() {
    const { id, type, method, params } = this
    if (params instanceof Buffer) {
      const metaBuffer = Buffer.from(JSON.stringify({ id, type, method }))
      const countBuffer = Buffer.from(String(metaBuffer.byteLength).padStart(4, '0'), 'hex')
      const buffer = Buffer.concat([countBuffer, metaBuffer, params])
      return this.handler.sendBytes(buffer)
    }
    return this.handler.sendUTF(JSON.stringify({ id, type, method, params }))
  }

  fail() {
    this.handler.emit(`response:${this.id}`, new Error('ACTION_FAILED'))
  }
}
