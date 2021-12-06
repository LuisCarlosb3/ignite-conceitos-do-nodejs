const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const userData = users.find(user => user.username === username)
  if (userData) {
    request.user = userData
    next()
  }
  return response.status(404)
}
function checkTodosExists(request, response, next) {
  const { user } = request
  const { id } = request.params
  const todoIndex = user.todos.findIndex(todo => todo.id === id)
  if (todoIndex === -1) {
    return response.status(404).json({ error: 'TODO not exists' })
  }
  request.todoIndex = todoIndex
  next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body
  const userAlreadyExists = users.find(user => user.username === username)
  if (userAlreadyExists) {
    return response.status(400).json({ error: 'User already exists' })
  }
  const newUser = {
    id: uuidv4().toString(),
    name,
    username,
    todos: []
  }
  users.push(newUser);
  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  return response.status(200).json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { title, deadline } = request.body
  const newTodo = {
    id: uuidv4().toString(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }
  user.todos.push(newTodo);
  return response.status(201).json(newTodo)
});

app.put('/todos/:id', checksExistsUserAccount, checkTodosExists, (request, response) => {
  const { todoIndex, user } = request
  const { title, deadline } = request.body

  user.todos[todoIndex].deadline = new Date(deadline)
  user.todos[todoIndex].title = title

  return response.status(200).json(user.todos[todoIndex])
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkTodosExists, (request, response) => {
  const { todoIndex, user } = request

  user.todos[todoIndex].done = true
  return response.status(200).json(user.todos[todoIndex])
});

app.delete('/todos/:id', checksExistsUserAccount, checkTodosExists, (request, response) => {
  const { todoIndex, user } = request

  user.todos.splice(todoIndex, 1)
  return response.status(204).json(user.todos)
});

module.exports = app;