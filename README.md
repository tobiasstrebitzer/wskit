# WSKIT

## Install

`yarn add wskit`

## Server Usage

```js
const { WsServer, ActionHandler } = require('wskit')

class EchoActionHandler extends ActionHandler {
  static get method() { return 'echo' }

  async run(params) {
    return `ECHO ${params.message}`
  }
}

WsServer.start().then((server) => {
  server.registerActionHandler(EchoActionHandler)
})
```

## Client Usage

```js
const { WsClient } = require('wskit')

WsClient.start().then((client) => {
  client.action('echo', { message: 'Hello World' }).then((response) => {
    console.log(response.params.message) // returns 'ECHO Hello world'
  })
})
```
