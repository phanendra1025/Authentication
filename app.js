const express = require("express");
const path = require("path");

const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  let userDetails = request.body;
  let { username, name, password, gender, location } = userDetails;
  let hashedPassword = await bcrypt.hash(password, 15);
  checkUserQuery = `SELECT *
            FROM user
            WHERE username = '${username}';`;
  let dbUser = await db.get(checkUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      let addUserQuery = `
        INSERT INTO USER (username,name,password,gender,location)
        VALUES 
        (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );
        `;
      await db.run(addUserQuery);
      response.status = 200;
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  let loginDetails = request.body;
  let { username, password } = loginDetails;
  let checkUserQuery = `
    SELECT * FROM user WHERE username = '${username}';
    `;
  let user = await db.get(checkUserQuery);
  if (user === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    let passwordCheck = await bcrypt.compare(password, user.password);
    if (passwordCheck) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  let updatePasswordDetails = request.body;
  let { username, oldPassword, newPassword } = updatePasswordDetails;

  let hashedNewPassword = await bcrypt.hash(newPassword, 15);

  let checkUser = `SELECT * FROM user WHERE username = '${username}';`;
  let dbUser = await db.get(checkUser);
  let checkOldPassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid User");
  } else {
    if (checkOldPassword) {
      if (newPassword.length < 5) {
        response.status = 400;
        response.send("Password is too short");
      } else {
        let updatePasswordQuery = `
              UPDATE user 
              SET password = '${hashedNewPassword}'
              `;
        await db.run(updatePasswordQuery);
        response.status = 200;
        response.send("Password updated");
      }
    } else {
      response.status = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
