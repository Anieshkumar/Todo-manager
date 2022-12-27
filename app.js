const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.set("view engine", "ejs");
app.get("/", async (request, response) => {
  const overdue = await Todo.overdue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();
  const completedTodo = await Todo.completedTodo();
  if (request.accepts("html")) {
    response.render("index", {
      overdue,
      dueToday,
      dueLater,
      completedTodo,
    });
  } else {
    response.json({
      overdue,
      dueToday,
      dueLater,
      completedTodo,
    });
  }
});
app.get("/", async (request, response) => {
  const overdue = await Todo.overdue();
  if (request.accepts("html")) {
    response.render("index", {
      overdue,
    });
  } else {
    response.json({
      overdue,
    });
  }
});

app.get("/", function (request, response) {
  response.send("Hello World");
});

app.use(express.static(path.join(__dirname, "public")));

// eslint-disable-next-line no-unused-vars
app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");

  try {
    const todo = await Todo.findAll({ order: [["id", "ASC"]] });
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// eslint-disable-next-line no-unused-vars
app.delete("/todos/:id", async function (request, response) {
  try {
    console.log("We have to delete a Todo with ID: ", request.params.id);

    const todo = await Todo.destroy({
      where: {
        id: request.params.id,
      },
    });
    response.send(todo ? true : false);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
