const express = require("express");
var csurf  = require("tiny-csrf");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csurf("this_should_be_32_character_long",["POST", "PUT", "DELETE"]));

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,'public')));

app.get("/", async (request, response)  => {
  const overdue = await Todo.overdue();
  const dueToday = await Todo.duetoday();
  const dueLater = await Todo.duelater();
  const completed = await Todo.completed();
  if (request.accepts("html")) {
    response.render("index", {
      overdue,
      dueToday,
      dueLater,
      completed,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      overdue,
      dueToday,
      dueLater,
      completed,
      csrfToken: request.csrfToken(),
    });
  }
});
app.get("/", function (request, response) {
  response.send("Hello World");
});



// eslint-disable-next-line no-unused-vars
app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Todo.findAll({ order : [[ "id" , "ASC" ]]})
    return response.json(todos);
  } 
  catch (error) {
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
    await Todo.addTodo(request.body);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async (request, response) => {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});


app.delete("/todos/:id", async (request, response) => {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try{
    await Todo.remove(request.params.id);
    return response.json({success: true});
  } catch (error) {
    return response.status(422).json(error);
  }
});

module.exports = app;