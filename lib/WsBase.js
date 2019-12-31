const { EventEmitter } = require('events')
const { Action } = require('./Action')

exports.WsBase = class WsBase extends EventEmitter {
  constructor(verbose = false) {
    super()
    this.verbose = verbose
    this.runningActions = []
    this.actionHandlers = []
  }

  registerActionHandlers(ActionHandlers) {
    for (const ActionHandler of ActionHandlers) {
      this.registerActionHandler(ActionHandler)
    }
  }

  registerActionHandler(ActionHandler) {
    this.on(`request:${ActionHandler.method}`, async (request) => {
      const handler = new ActionHandler(this, request)
      const params = await handler.run(request.params)
      await request.respond(params).catch(() => {})
    })
  }

  onActionRequest(request) {
    this.emit('request', request)
    this.emit(`request:${request.method}`, request)
    this.emit(`request:${request.id}`, request)
  }

  onActionResponse(response) {
    this.emit('response', response)
    this.emit(`response:${response.method}`, response)
    this.emit(`response:${response.id}`, response)
  }

  action(method, params = {}, handler = this) {
    const request = Action.createRequest(handler, method, params)
    this.runningActions.push(request)
    return request.send().then(() => {
      return new Promise((resolve, reject) => {
        this.once(`response:${request.id}`, (response) => {
          if (response instanceof Error) { reject(response); return }
          const index = this.runningActions.indexOf(request)
          this.runningActions.splice(index, 1)
          resolve(response)
        })
      })
    })
  }

  log(message) {
    if (!this.verbose) { return }
    console.log(`[${this.constructor.name}] ${message}`)
  }
}
