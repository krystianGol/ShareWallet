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

app.get("/billingGroup/:id", async (req, res) => {
    const billingGroupId = req.params.id;

    const itemsResult = await db.query("SELECT items.id, items.description, items.price, users.name, billing_group.title FROM items JOIN users ON users.id = items.user_id JOIN billing_group ON billing_group.id = items.billing_group_id WHERE billing_group_id = $1 ORDER BY items.id;", [billingGroupId]);

    const usersResult = await db.query("SELECT users.name FROM users_billing_group JOIN users ON users.id = users_billing_group.user_id JOIN billing_group ON billing_group.id = users_billing_group.billing_group_id WHERE billing_group_id = $1;", [billingGroupId]);

    const itemsData = itemsResult.rows;
    console.log(itemsData);
    const title = itemsData[0].title;

    const usersData = usersResult.rows;
    const users = usersData;

    let allUsers = "";
    users.forEach(user => {
        allUsers += user.name + ", ";
    });

    let updatedAllUsers = allUsers.slice(0, -2);

    res.render("billingGroup.ejs",
        {
            title: title,
            users: updatedAllUsers,
            items: itemsData
        });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})