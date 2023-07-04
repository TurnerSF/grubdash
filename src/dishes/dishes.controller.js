const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next) {
  res.json({ data: dishes });
}

function validateDataExists(req, res, next) {
  if (req.body.data) {
    next();
  } else {
    next({
      status: 400,
      message: "Request body must contain a data object.",
    });
  }
}

function validator(field) {
  return function (req, res, next) {
    if (req.body.data[field]) {
      next();
    } else {
      next({
        status: 400,
        message: `You forgot the ${field} field.`,
      });
    }
  };
}

function validatePrice(req, res, next) {
  const { price } = req.body.data;
  if (typeof price === "number" && price > 0) {
    next();
  } else {
    next({
      status: 400,
      message: "price",
    });
  }
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function validateDishExists(req, res, next) {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id === dishId);
  
  if (index === -1) {
    return next({
      status: 404,
      message: `No dish with id ${dishId}.`,
    });
  }

  res.locals.index = index;
  res.locals.dish = dishes[index];
  next();
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const { data: { id, name, description, price, image_url } } = req.body;
  const { index, dish } = res.locals;

  if (id && id !== req.params.dishId) {
    return next({
      status: 400,
      message: `The id in the request body (${id}) must match the dishId (${req.params.dishId}) in the route.`,
    });
  }

  const updatedDish = {
    ...dish,
    name,
    description,
    price,
    image_url,
  };

  dishes[index] = updatedDish;
  res.send({ data: updatedDish });
}

module.exports = {
  list,
  create: [validateDataExists, validator("name"), validator("description"), validator("price"), validator('image_url'), validatePrice, create],
  read: [validateDishExists, read],
  update: [validateDishExists, validateDataExists, validator("name"), validator("description"), validator("price"), validator('image_url'), validatePrice, update],
};
