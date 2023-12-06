# Webbit

Webbit is a simple web server built with the [Deno runtime](https://deno.com/)
and the
[WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
to quickly share text over HTTP on a local network.

## Runnit

[Install Deno](https://docs.deno.com/runtime/manual/getting_started/installation)

### Clone repo and run

```
deno run --allow-net=0.0.0.0:80 --allow-read=./src/script.js src/server.ts
```

View
[Deno Permissions list](https://docs.deno.com/runtime/manual/basics/permissions)

- `--allow-net=0.0.0.0:80` Allow network access to localhost at port 80
- `--allow-read=./src/script.js` Allow reading file at ./src/script.js

### Run remotely

```
deno run --allow-net=0.0.0.0:80 https://raw.githubusercontent.com/LukasMurdock/webbit/main/src/server.ts
```

When run remotely, file system access is not needed (although it will be
requested).
