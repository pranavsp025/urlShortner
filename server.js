const http = require("http");

const server = http.createServer((req, res) => {

  if (req.method === "POST") {

    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      console.log(body);

      res.end("Received");
    });
  }
});

server.listen(3000);