/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
//const todo = require("../models/todo");
let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo Application", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Signup", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "aniesh123@gmail.com",
      password: "12345",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/todo");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todo");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a todo and responds with json at /todos", async () => {
    const agent = request.agent(server);
    await login(agent, "aniesh123@gmail.com", "12345");
    const res = await agent.get("/todo");
    const csrfToken = extractCsrfToken(res);
    response = await agent.post("/todos").send({
      title: "buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302); //http status code
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent = request.agent(server);
    await login(agent, "aniesh123@gmail.com", "12345");
    let res = await agent.get("/todo");
    let csrfToken = extractCsrfToken(res);

    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todo")
      .set("Accept", "application/json");
    const parsedGroupedTodosResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedTodosResponse.dueToday.length;
    const newTodo = parsedGroupedTodosResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);

    const deleteTodo = await agent
      .delete(`/todos/${newTodo.id}`)
      .send({ _csrf: csrfToken });

    const deleteTodoResponse = JSON.parse(deleteTodo.text);

    expect(deleteTodoResponse.success).toBe(true);
  });
  test("mark todo as incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, "aniesh123@gmail.com", "12345");
    let res = await agent.get("/todo");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "buy milk",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/todo")
      .set("Accept", "application/json");

    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const newTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${newTodo.id}`).send({
      completed: false,
      _csrf: csrfToken,
    });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);
  });
  test("First user cannot mark Second user's todos as complete", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "aniesh",
      lastName: "kumar",
      email: "aniesh12456@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const user1id = res.id;

    await agent.get("/signout");

    res = await agent.get("/signup");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "aniesh",
      lastName: "kumar",
      email: "aniesh1234@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);
    const CompleteResponse = await agent.put(`/todos/${user1id}`).send({
      _csrf: csrfToken,
      completed: true,
    });
    expect(CompleteResponse.statusCode).toBe(422);
  });
  test("First user cannot mark Second user's todos as incomplete", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "aniesh",
      lastName: "kumar",
      email: "aniesh12456@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const user1id = res.id;

    await agent.get("/signout");

    res = await agent.get("/signup");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "aniesh",
      lastName: "kumar",
      email: "aniesh1234@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);
    const InCompleteResponse = await agent.put(`/todos/${user1id}`).send({
      _csrf: csrfToken,
      completed: false,
    });
    expect(InCompleteResponse.statusCode).toBe(422);
  });
  test("First user cannot delete Second user's todos", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "aniesh",
      lastName: "kumar",
      email: "aniesh12456@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const user1id = res.id;

    await agent.get("/signout");

    res = await agent.get("/signup");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "aniesh",
      lastName: "kumar",
      email: "aniesh1234@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent.delete(`/todos/${user1id}`).send({
      _csrf: csrfToken,
    });
    expect(deleteResponse.statusCode).toBe(422);
  });
});
