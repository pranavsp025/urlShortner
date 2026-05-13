require("dotenv").config();

const http = require("http");
const crypto = require("crypto");

const pool = require("./db");

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;

// Generate random short code
function generateShortCode(length = 6) {

  return crypto.randomBytes(length)
    .toString("hex")
    .slice(0, length);
}

// Read request body
function getRequestBody(req) {

  return new Promise((resolve, reject) => {

    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      resolve(body);
    });

    req.on("error", err => {
      reject(err);
    });
  });
}

const server = http.createServer(async (req, res) => {

  // HOME ROUTE
  if (req.method === "GET" && req.url === "/") {

    res.writeHead(200, {
      "Content-Type": "text/plain"
    });

    return res.end("URL Shortener Backend Running");
  }

  // CREATE SHORT URL
if (req.method === "POST" && req.url === "/shorten") {

  try {

    const body = await getRequestBody(req);

    const data = JSON.parse(body);

    // Validate URL exists
    if (!data.url) {

      res.writeHead(400, {
        "Content-Type": "application/json"
      });

      return res.end(JSON.stringify({
        error: "URL is required"
      }));
    }

    // Validate URL format
    try {

      new URL(data.url);

    } catch {

      res.writeHead(400, {
        "Content-Type": "application/json"
      });

      return res.end(JSON.stringify({
        error: "Invalid URL"
      }));
    }

    let shortCode;

    // Use custom short code if provided
    if (data.shortCode) {

      shortCode = data.shortCode;

    } else {

      // Generate random short code
      shortCode = generateShortCode();
    }

    // Check if short code already exists
    const existing = await pool.query(
      `SELECT * FROM urls
       WHERE short_code = $1`,
      [shortCode]
    );

    if (existing.rows.length > 0) {

      res.writeHead(400, {
        "Content-Type": "application/json"
      });

      return res.end(JSON.stringify({
        error: "Short code already exists"
      }));
    }

    // Insert into DB
    await pool.query(
      `INSERT INTO urls(short_code, original_url)
       VALUES($1, $2)`,
      [shortCode, data.url]
    );

    const shortUrl = `${BASE_URL}/${shortCode}`;

    res.writeHead(201, {
      "Content-Type": "application/json"
    });

    return res.end(JSON.stringify({
      shortUrl
    }));

  } catch (err) {

    console.error(err);

    res.writeHead(500, {
      "Content-Type": "application/json"
    });

    return res.end(JSON.stringify({
      error: "Internal server error"
    }));
  }
}

  // REDIRECT ROUTE
  if (req.method === "GET") {

    try {

      const shortCode = req.url.slice(1);

      // Ignore empty route
      if (!shortCode) {
        return;
      }

      // Find URL
      const result = await pool.query(
        `SELECT * FROM urls
         WHERE short_code = $1`,
        [shortCode]
      );

      // URL not found
      if (result.rows.length === 0) {

        res.writeHead(404, {
          "Content-Type": "text/plain"
        });

        return res.end("Short URL not found");
      }

      const urlData = result.rows[0];

      // Increment clicks
      await pool.query(
        `UPDATE urls
         SET clicks = clicks + 1
         WHERE short_code = $1`,
        [shortCode]
      );

      // Redirect user
      res.writeHead(302, {
        Location: urlData.original_url
      });

      return res.end();

    } catch (err) {

      console.error(err);

      res.writeHead(500, {
        "Content-Type": "text/plain"
      });

      return res.end("Internal server error");
    }
  }

  // 404
  res.writeHead(404);

  res.end("Route not found");
});

server.listen(PORT, () => {

  console.log(`Server running at ${BASE_URL}`);
});