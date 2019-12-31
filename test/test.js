/* eslint-disable max-classes-per-file */

const { WsServer, WsClient, ActionHandler } = require('../')

class DataActionHandler extends ActionHandler {
  static get method() { return 'data' }

  async run(data) {
    return data
  }
}

class CloseActionHandler extends ActionHandler {
  static get method() { return 'close' }

  async run(data) {
    this.api.close()
    return data
  }
}

WsServer.start().then((server) => {
  server.verbose = true
  server.registerActionHandlers([DataActionHandler, CloseActionHandler])
})

WsClient.start().then((client) => {
  client.verbose = true
  const buffer = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72])
  return client.action('data', buffer).then((response) => {
    client.log(response.params.toString('utf8'))
    return client.action('close').catch(() => {})
  }).then(() => {
    return client.close()
  })
})
