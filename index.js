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

// CONNECT TO DATABASE
db.connect();

// GET ALL USERS
db.query("SELECT * FROM users", (err, res) => {
    if (err) {
        console.error("Error executing query", err.stack);
    } else {
        users = res.rows;
    }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// CREATE STRING WITH ALL NAMES SEPARATED WITH ','
function namedAllUsers(users) {
    let allUsers = "";
    users.forEach(user => {
        allUsers += user.name + ", ";
    });
    allUsers = allUsers.slice(0, -2);
    return allUsers;
}

// SET 0 COST FOR EVERY USER
function initializeCostForEveryUser(users) {
    let costForUser = [];
    users.forEach(user => {
        costForUser.push({
            name: user.name,
            costs: 0
        })
    });
    return costForUser;
}

// CALCULATE COSTS FOR EVERY USER INLUCDING COSTS OF OTHER USERS
function calculateCosts(users) {
    let usersClone = users.map(user => ({ ...user }));
    for (let i = 0; i < users.length; i++) {
        let totalCostOfOthers = 0;
        for (let j = 0; j < users.length; j++) {
            if (i !== j) {
                if (usersClone[j].costs > 0) {
                    totalCostOfOthers += usersClone[j].costs / (users.length - 1);
                }
            }
        }
        users[i].costs -= totalCostOfOthers;
        users[i].costs = (users[i].costs).toFixed(2);
    }
    return users;
}

// CALCULATE PRICE FOR ALL BOUGHT ITEMS
function calculateAllCosts(items) {
    let allCosts = 0;
    items.forEach(item => {
        allCosts += item.price;
    });
    allCosts = allCosts.toFixed(2);
    return allCosts;
}

// CALCULATES COSTS WITHOUT INCLUDING THE COSTS OF OTHER USERS
function calculateExpensesForEachUser(items, users) {
    items.forEach(item => {
        let user = users.find(user => user.name == item.name);
        if (user) {
            user.costs += item.price - (item.price / users.length); 
        }
    });
    return users;
}
app.get("/", async (req, res) => {
    const result = await db.query("SELECT * FROM users_billing_group JOIN users ON users.id = users_billing_group.user_id JOIN billing_group ON billing_group.id = users_billing_group.billing_group_id WHERE users.id = $1;", [currentUserId]);

    const billingGroups = result.rows;
    res.render("index.ejs",
        {
            billingGroups: billingGroups
        });
});

app.get("/expenses/:id", async (req, res) => {
    const billingGroupId = req.params.id;
    let allUsersString;

    // GET DATA ABOUT ITEMS FROM DATABASE
    const itemsResult = await db.query("SELECT items.id, items.description, items.price, users.name, billing_group.title FROM items JOIN users ON users.id = items.user_id JOIN billing_group ON billing_group.id = items.billing_group_id WHERE billing_group_id = $1 ORDER BY items.id;", [billingGroupId]);

    // GET DATA ABOUT USERS FROM DATABASE
    const usersResult = await db.query("SELECT users.name, billing_group.title FROM users_billing_group JOIN users ON users.id = users_billing_group.user_id JOIN billing_group ON billing_group.id = users_billing_group.billing_group_id WHERE billing_group_id = $1;", [billingGroupId]);

    const itemsData = itemsResult.rows;

    const usersData = usersResult.rows;
    const title = usersData[0].title;

    if (usersData.length > 0) {
        const users = usersData;
        allUsersString = namedAllUsers(users);
    }

    res.render("expenses.ejs",
        {
            title: title,
            users: allUsersString,
            items: itemsData,
            billingGroupId: billingGroupId
        });
});

app.get("/balance/:id", async (req, res) => {
    const billingGroupId = req.params.id;
    let costForUser = [];
    let allCosts;
    let allUsersString;

    // GET DATA ABOUT USERS FROM DATABASE
    const usersResult = await db.query("SELECT users.name, billing_group.title FROM users_billing_group JOIN users ON users.id = users_billing_group.user_id JOIN billing_group ON billing_group.id = users_billing_group.billing_group_id WHERE billing_group_id = $1;", [billingGroupId]);

    // GET DATA ABOUT ITEMS FROM DATABASE
    const itemsResult = await db.query("SELECT items.id, items.description, items.price, users.name, billing_group.title FROM items JOIN users ON users.id = items.user_id JOIN billing_group ON billing_group.id = items.billing_group_id WHERE billing_group_id = $1 ORDER BY items.id;", [billingGroupId]);

    const itemsData = itemsResult.rows;
    const usersData = usersResult.rows;
    const title = usersData[0].title;


    if (usersData.length > 0) {
        const users = usersData;
        // GET NAMES ABOUT USER FOR SPECIFIC BILLING GROUP
        allUsersString = namedAllUsers(users);

        // SET COST TO 0 FOR EVERY USER
        costForUser = initializeCostForEveryUser(users);
    }

    if (itemsData.length > 0) {

        allCosts = calculateAllCosts(itemsData)

        // CALCULATES COSTS WITHOUT INCLUDING THE COSTS OF OTHER USERS
        costForUser = calculateExpensesForEachUser(itemsData, costForUser);

        // INCLUDE COSTS OF OTHER USERS
        costForUser = calculateCosts(costForUser);
    }

    res.render("balance.ejs",
        {
            title: title,
            users: allUsersString,
            billingGroupId: billingGroupId,
            userCost: costForUser
        });
});

app.get("/users", (req, res) => {
    res.render("users.ejs",
        {
            users: users
        });
});

app.post("/users", (req, res) => {
    currentUserId = req.body.userId;
    res.redirect("/");
});

app.get("/new/:option", async (req, res) => {
    const option = req.params.option;
    if (option == "billingGroup") {
        res.render("newBillingGroup.ejs");
    } else {
        const result = await db.query("SELECT * from billing_group;");
        const billingGroups = result.rows;

        res.render("newUser.ejs",
            {
                billingGroups: billingGroups
            });
    }
});

app.post("/new/:option", async (req, res) => {
    const option = req.params.option;
    if (option == "billingGroup") {
        res.render("newBillingGroup.ejs");
    } else {
        const billingGroupIds = JSON.parse(req.body.billingGroupIds);
        const newUserName = req.body.name;

        // ADD NEW USER
        const result = await db.query("INSERT INTO users (name) VALUES ($1) RETURNING *;", [newUserName]);
        users.push(result.rows[0]);

        // GET NEW USER ID
        const newUserId = result.rows[0].id;

        if (typeof billingGroupIds != 'undefined') {
            for (let i = 0; i < billingGroupIds.length; i++) {
                // ADD NEW USER TO EXISTING BILLING GROUP
                await db.query("INSERT INTO users_billing_group (user_id, billing_group_id) VALUES ($1, $2);", [newUserId, parseInt(billingGroupIds[i])]);
            }
        }
        currentUserId = newUserId;
        res.redirect("/");
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})