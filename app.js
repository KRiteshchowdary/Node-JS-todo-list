// Required Modules Import

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format, compareAsc } = require("date-fns");

// Creating Express Instance and Exporting it

const app = express();
app.use(express.json());
module.exports = app;

// Starting Server at Port 3000 and Connected to Database

let db = null;

let initializeDBandServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });

    app.listen(
      3000,
      console.log("Server started in port 3000 and Database connected")
    );
  } catch (error) {
    console.log("Error ocurred. " + error.message);
    process.exit(1);
  }
};

initializeDBandServer();

// Middleware to Handle Invalid Data input

const checkInputs = (request, response, next) => {
  let {
    status = "",
    priority = "",
    todo = "",
    category = "",
    dueDate = "",
  } = request.body;

  if (["TO DO", "IN PROGRESS", "DONE", ""].includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (["HIGH", "MEDIUM", "LOW", ""].includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (["WORK", "HOME", "LEARNING", ""].includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    next();
  }
};

const convertDBObjectToDisplayObject = (eachResult) => ({
  id: eachResult.id,
  todo: eachResult.todo,
  priority: eachResult.priority,
  category: eachResult.category,
  status: eachResult.status,
  dueData: eachResult.due_date,
});

const convertDate = (date) => {
  let dateArray = date.split("-").map((i) => parseInt(i));
  let properDate = format(
    new Date(dateArray[0], dateArray[1] - 1, dateArray[2]),
    "yyyy-MM-dd"
  );
  return properDate;
};

// API 1 - Get Todo's

app.get("/todos/", async (request, response) => {
  let {
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;

  let dbSearchQuery;

  if (status !== "" && priority !== "") {
    dbSearchQuery = `select * from todo where status="${status}" and priority="${priority}";`;
  } else if (status !== "" && category !== "") {
    dbSearchQuery = `select * from todo where status="${status}" and category="${category}";`;
  } else if (category !== "" && priority !== "") {
    dbSearchQuery = `select * from todo where category="${category}" and priority="${priority}";`;
  } else if (status !== "") {
    dbSearchQuery = `select * from todo where status="${status}";`;
  } else if (priority !== "") {
    dbSearchQuery = `select * from todo where priority="${priority}";`;
  } else if (category !== "") {
    dbSearchQuery = `select * from todo where category="${category}";`;
  } else if (search_q !== "") {
    dbSearchQuery = `select * from todo where todo LIKE "%${search_q}%";`;
  }

  const results = await db.all(dbSearchQuery);
  response.send(results.map((item) => convertDBObjectToDisplayObject(item)));
});

// API 2 - Get a Todo

app.get("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  console.log(todoId);
  const getTodoQuery = `select * from todo where id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertDBObjectToDisplayObject(todo));
});

// API 3 - Get Todo's with given Due Date

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  properDate = convertDate(date);
  const getAgendaQuery = `select * from todo where due_date = "${properDate}";`;
  const getAgenda = await db.all(getAgendaQuery);
  response.send(getAgenda.map((item) => convertDBObjectToDisplayObject(item)));
});

// API 4 - Create Todo

app.post("/todos/", checkInputs, async (request, response) => {
  let { id, todo, priority, status, category, dueDate } = request.body;
  dueDate = convertDate(dueDate);
  const createTodoQuery = `Insert into todo (id,todo,priority,status,category,due_date) values (${id},"${todo}","${priority}","${status}","${category}","${dueDate}");`;
  console.log(createTodoQuery);
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

// API - 5 Modify Todo

app.put("/todos/:todoId/", checkInputs, async (request, response) => {
  const { todoId } = request.params;
  let {
    status = "",
    priority = "",
    todo = "",
    category = "",
    dueDate = "",
  } = request.body;

  let dbUpdateQuery;

  if (status !== "") {
    dbUpdateQuery = `update todo set status = "${status}" where id = ${todoId};`;
    response.send("Status Updated");
  } else if (priority !== "") {
    dbUpdateQuery = `update todo set priority = "${priority}" where id = ${todoId};`;
    response.send("Priority Updated");
  } else if (todo !== "") {
    dbUpdateQuery = `update todo set todo = "${todo}" where id = ${todoId};`;
    response.send("Todo Updated");
  } else if (category !== "") {
    dbUpdateQuery = `update todo set category = "${category}" where id = ${todoId};`;
    response.send("Category Updated");
  } else if (dueDate !== "") {
    dueDate = convertDate(dueDate);
    dbUpdateQuery = `update todo set due_date = "${dueDate}" where id = ${todoId};`;
    response.send("Due Date Updated");
  }

  await db.run(dbUpdateQuery);
});

// API 6 - Delete Todo

app.delete("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  const deleteTodoQuery = `Delete from todo where id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
