// deno run --allow-net=0.0.0.0:80 --allow-read=./src/script.js src/server.ts

const networkInterfacePermission = Deno.permissions.requestSync({
  name: "sys",
});

const port = 8080;

if (networkInterfacePermission.state === "granted") {
  const networkInterfaces = Deno.networkInterfaces();
  const onboardEthernet = networkInterfaces.find(
    (networkInterface) =>
      networkInterface.name === "en0" && networkInterface.family === "IPv4",
  );

  if (!onboardEthernet || !onboardEthernet.cidr) {
    throw new Error("No IPv4 en0 network interface with CIDR found");
  }

  console.log(
    "Available on network at:",
    "http://" + onboardEthernet.address + ":" + port,
  );

  Deno.permissions.revoke({ name: "sys" });
}

const clients = new Set<WebSocket>();

// Broadcast a message to all clients, excluding the sender.
function broadcast(msg: string, sender?: WebSocket) {
  for (const client of clients) {
    if (client !== sender) {
      client.send(msg);
    }
  }
}

let textBlob = new Blob(["Hello world!"], { type: "text/plain" });
// 192.168.1.62
async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/") {
    if (request.method !== "GET" && request.method !== "POST") {
      return new Response(null, {
        status: 405,
        statusText: "Method Not Allowed",
      });
    }
    if (request.method === "POST") {
      const body = await request.text();
      textBlob = new Blob([body], { type: "text/plain" });
      broadcast(body);
      return new Response(null, {
        status: 204,
        statusText: "No Content",
      });
    }

    if (request.method === "GET") {
      const acceptHeader = request.headers.get("accept");
      if (acceptHeader === "application/octet-stream") {
        return new Response(textBlob, {
          headers: {
            "content-type": "application/octet-stream",
          },
        });
      }
      if (!acceptHeader || acceptHeader.includes("text/html")) {
        const buffer = await textBlob.arrayBuffer();
        const text = new TextDecoder("utf-8").decode(buffer);
        const body = `
          <!DOCTYPE html>
          <html>
              <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Webbit</title>
                  <script src="/script.js" type="module"></script>
              </head>
            <body>
              <textarea id="text" rows="12">${text}</textarea>
              <style>
                  body {
                      font-family: monospace;
                      font-size: 16px;
                  }
                  textarea {
                      font-size: 16px;
                      width: 100%;
                      box-sizing: border-box;
                  }
                  button {
                      font-size: 16px;
                  }
              </style>
            </body>
          </html>
          `;
        return new Response(body, {
          headers: {
            "content-type": "text/html; charset=UTF-8",
          },
        });
      }
      console.log("Accept header:", acceptHeader);
    }
  }

  if (url.pathname === "/ws") {
    const { socket, response } = Deno.upgradeWebSocket(request);
    clients.add(socket);
    console.log("Socket connected!");

    socket.onmessage = (event) => {
      console.log("Socket message:", event.data);
      textBlob = new Blob([event.data], { type: "text/plain" });
      broadcast(event.data, socket);
    };

    socket.onclose = () => {
      clients.delete(socket);
    };
    return response;
  }

  if (url.pathname === "/script.js") {
    const script = await Deno.readTextFile("./src/script.js");
    return new Response(script, {
      headers: {
        "content-type": "application/javascript; charset=UTF-8",
      },
    });
  }

  return new Response("Not found", { status: 404 });
}

console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
Deno.serve({ port }, handler);
