const uuid = require('uuid/v1')

exports.Action = class Action {
  static createRequest(handler, method, params = {}) {
    return new Action(handler, { type: 'request', id: uuid(), method, params })
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
    return this.handler.sendUTF(JSON.stringify({ id, type, method, params }))
  }
}
