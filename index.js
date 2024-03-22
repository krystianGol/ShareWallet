import express from "express"
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

let users = [];
let currentUserId = 1;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "ShareWallet",
    password: "db1234",
    port: 5432
});

db.connect();

db.query("SELECT * FROM users", (err, res) => {
    if (err) {
      console.error("Error executing query", err.stack);
    } else {
      users = res.rows;
    }
  });

app.get("/", (req, res) => {
    console.log(users);
    res.render("index.ejs");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})