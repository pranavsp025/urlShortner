const {pool} = require("pg");

const pool = new pool({
    user: "postgres",
    host: "localhost",
    database: "urlshortener",
    password: "admin123",
    port: 5432,
});

module.exports = pool;
