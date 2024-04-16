## Welcome to ShareWallet, your ultimate expense tracking 💸
ShareWallet is designed to simplify expense management and bill splitting for groups of users. With ShareWallet, you can easily track expenses, add users, and create billing groups to manage finances efficiently.

## Do I need anything ?
Yes, you nedd install pgAdmin for store your data about users etc. <br/>
Inside pgAdmin:
- Set password
- Right click on databases and create new database (name it however you want)
- Click on Query Tool 
- Take all code from file named queries.sql and paste it to Query Tool and run

## How to run it ?
- Open up your code editor e.g. Visual Studio Code
- Change direction in your terminal to project folder
- In index.js change: <br/> <br/>
  const db = new pg.Client({ <br/>
    user: USER, <br/>
    host: HOST, <br/>
    database: DATABASE, <br/>
    password: PASSWORD, <br/>
    port: PORT <br/>
}); <br/> <br/>
**FOR** <br/> <br/>
  const db = new pg.Client({ <br/>
    user: "postgres", <br/>
    host: "localhost", <br/>
    database: **"Your name of database"**, <br/>
    password: **"Your password"**, <br/>
    port: 5432 <br/>
}); <br/> <br/>

- In command line type **"npm i"** and then **"nodemon index.js"**
- Now in your browser type **"http://localhost:3000/"**
- **Have fun with ShareWallet** 💰 <br/> <br/>

## ShareWallet in action 👇

![image](https://github.com/krystianGol/ShareWallet/assets/96664023/15f8a9d0-28ed-4692-827e-ca3b80e8b687)

![image](https://github.com/krystianGol/ShareWallet/assets/96664023/434769aa-249f-4ca1-80cf-03d802a71a24)

![image](https://github.com/krystianGol/ShareWallet/assets/96664023/bcf64405-6f32-4b81-a3ac-d068a475cc8d)

![image](https://github.com/krystianGol/ShareWallet/assets/96664023/0d917660-a5b8-4432-8bb1-1482a427c99d)

![image](https://github.com/krystianGol/ShareWallet/assets/96664023/2cc2d192-e39e-4005-83db-0f90bcbc78ae)

![image](https://github.com/krystianGol/ShareWallet/assets/96664023/0eb97791-deb4-428b-9ceb-d8141d8238b7)

![image](https://github.com/krystianGol/ShareWallet/assets/96664023/948811b0-0c2c-41a0-9683-5e6767bd7422)




