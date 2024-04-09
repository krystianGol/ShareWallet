import express from "express"
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

let users = [];
let currentUserId = 1;
let currentBillingGroupId = 0;

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
            id: user.id,
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
        let user = users.find(user => user.id == item.user_id);
        if (user) {
            user.costs += item.price - (item.price / users.length);
        }
    });
    return users;
}


// TODO: FUNCIONALITY TO ADD NEW BILLING GROUP

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
    currentBillingGroupId = billingGroupId;
    let allUsersString;
    let allCosts;
    let costForUser = [];

    // GET DATA ABOUT ITEMS FROM DATABASE
    const itemsResult = await db.query("SELECT items.id, items.description, items.price, users.name, billing_group.title, users.id AS user_id FROM items JOIN users ON users.id = items.user_id JOIN billing_group ON billing_group.id = items.billing_group_id WHERE billing_group_id = $1 ORDER BY items.id;", [billingGroupId]);

    // GET DATA ABOUT USERS FROM DATABASE
    const usersResult = await db.query("SELECT users.id, users.name, billing_group.title FROM users_billing_group JOIN users ON users.id = users_billing_group.user_id JOIN billing_group ON billing_group.id = users_billing_group.billing_group_id WHERE billing_group_id = $1;", [billingGroupId]);

    const itemsData = itemsResult.rows;
    const usersData = usersResult.rows;


    const title = usersData[0].title;

    if (usersData.length > 0) {
        const users = usersData;
        allUsersString = namedAllUsers(users);
        costForUser = initializeCostForEveryUser(users);
    }

    if (itemsData.length > 0) {

        allCosts = calculateAllCosts(itemsData)
        costForUser = calculateExpensesForEachUser(itemsData, costForUser);
        costForUser = calculateCosts(costForUser);
    }

    const findCurrentUser = costForUser.find(user => user.id == currentUserId);
    if (typeof allCosts == 'undefined') {
        allCosts = 0;
    }
    let currentUserCost = findCurrentUser.costs;
    if (currentUserCost > 0) {
        currentUserCost = 0;
    }

    res.render("expenses.ejs",
        {
            title: title,
            users: allUsersString,
            items: itemsData,
            billingGroupId: billingGroupId,
            currentUserCost: currentUserCost,
            totalExpenses: allCosts
        });
});

app.get("/balance/:id", async (req, res) => {
    const billingGroupId = req.params.id;
    let costForUser = [];
    let allCosts;
    let allUsersString;

    // GET DATA ABOUT USERS FROM DATABASE
    const usersResult = await db.query("SELECT users.id, users.name, billing_group.title FROM users_billing_group JOIN users ON users.id = users_billing_group.user_id JOIN billing_group ON billing_group.id = users_billing_group.billing_group_id WHERE billing_group_id = $1;", [billingGroupId]);

    // GET DATA ABOUT ITEMS FROM DATABASE
    const itemsResult = await db.query("SELECT items.id, items.description, items.price, users.name, billing_group.title, users.id AS user_id FROM items JOIN users ON users.id = items.user_id JOIN billing_group ON billing_group.id = items.billing_group_id WHERE billing_group_id = $1 ORDER BY items.id;", [billingGroupId]);

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
        const result = await db.query("SELECT * FROM users;");
        const users = result.rows;
        res.render("newBillingGroup.ejs",
            {
                users: users
            });
    } else if (option == "user") {
        const result = await db.query("SELECT * from billing_group;");
        const billingGroups = result.rows;

        res.render("newUser.ejs",
            {
                billingGroups: billingGroups
            });
    } else {
        const findCurrentUser = users.find(user => user.id == currentUserId);
        const currentUserName = findCurrentUser.name;

        res.render("item.ejs",
            {
                title: "New Item",
                currentUserName: currentUserName,
                option: "new"
            });
    }
});

app.post("/new/:option", async (req, res) => {
    const option = req.params.option;
    if (option == "billingGroup") {
        const usersToNewBillingGroup = JSON.parse(req.body.usersToNewBillingGroup);
        const title = req.body.title;
        const description = req.body.description;
        const category = req.body.categoryToNewBillingGroup;
        let usersToAdd = [];
        let newUsers = [];
        let usersId = [];

        usersToNewBillingGroup.forEach(user => {
            if (user.id == "new") {
                usersToAdd.push(user.name);
                users.push(user.name);
            } else {
                usersId.push(parseInt(user.id));
            }
        });

        for (let i = 0; i < usersToAdd.length; i++) {
            var result = await db.query("INSERT INTO users (name) VALUES ($1) RETURNING *;", [usersToAdd[i]]);
            newUsers.push(result.rows[0])
        }

        for (let i = 0; i < newUsers.length; i++) {
            usersId.push(newUsers[i].id);
        }

        const resu = await db.query("INSERT INTO billing_group (title, description, category) VALUES ($1, $2, $3) RETURNING *", [title, description, category]);
        const newBillingGroup = resu.rows[0];

        for (let i = 0; i < usersId.length; i++) {
            await db.query("INSERT INTO users_billing_group (user_id, billing_group_id) VALUES ($1, $2);", [usersId[i], newBillingGroup.id]);
        }

        res.redirect("/");
    } else if (option == "user") {
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
    } else if (option == 'newItem') {
        const newItemTitle = req.body.title;
        const newItemPrice = req.body.price;

        await db.query("INSERT INTO items (description, price, user_id, billing_group_id) VALUES($1, $2, $3, $4);", [newItemTitle, newItemPrice, currentUserId, currentBillingGroupId]);

        res.redirect(`/`);
    } else {
        const newItemTitle = req.body.title;
        const newItemPrice = req.body.price;
        const currentItemId = req.body.itemId;

        await db.query("UPDATE items SET description=$1, price=$2 WHERE id=$3;", [newItemTitle, newItemPrice, currentItemId]);

        res.redirect("/");
    }
});

app.get("/item/:itemId/:itemDescription/:itemPrice/:paidBy", (req, res) => {
    const itemToEditId = req.params.itemId;
    const itemDescription = req.params.itemDescription;
    const itemPrice = req.params.itemPrice;
    const paidBy = req.params.paidBy;

    const findCurrentUser = users.find(user => user.id == currentUserId);
    const currentUserName = findCurrentUser.name;

    res.render("item.ejs", {
        title: "Edit Item",
        currentUserName: currentUserName,
        option: "edit",
        paidBy: paidBy,
        itemDescription: itemDescription,
        itemPrice: itemPrice,
        itemToEditId: itemToEditId
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})