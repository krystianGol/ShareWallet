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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    const result = await db.query("SELECT * FROM users_billing_group JOIN users ON users.id = users_billing_group.user_id JOIN billing_group ON billing_group.id = users_billing_group.billing_group_id WHERE users.id = $1;", [currentUserId]);
    const billingGroups = result.rows;
    console.log(billingGroups);
    res.render("index.ejs",
        {
            billingGroups: billingGroups
        });
});

app.get("/billingGroup/:id", (req, res) => {
    res.render("billingGroup.ejs");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})