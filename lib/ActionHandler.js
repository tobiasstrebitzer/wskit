exports.ActionHandler = class ActionHandler {
  constructor(api, request) {
    this.api = api
    this.request = request
  }

  get handler() {
    return this.request.handler
  }

  action(method, params = {}, handler = this.handler) {
    return this.api.action(method, params, handler)
  }
}
