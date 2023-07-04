const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign IDs when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
  res.json({ data: orders });
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

function newOrderValidator(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  const requiredFields = {
    deliverTo,
    mobileNumber,
    dishes,
  };

  for (let field in requiredFields) {
    if (!requiredFields[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}.`,
      });
    }
  }

  const dishesValue = requiredFields.dishes;

  if (!Array.isArray(dishesValue) || dishesValue.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish.",
    });
  }

  for (let i = 0; i < dishesValue.length; i++) {
    const quantity = dishesValue[i].quantity;
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is a number greater than zero.`,
      });
    }
  }
  next();
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function validateOrderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  } else {
    next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  }
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
    const { orderId } = req.params;
    const { data: { id, deliverTo, mobileNumber, dishes, status } } = req.body;
    const { order } = res.locals;
  
    if (id && id !== orderId) {
      return next({
        status: 400,
        message: `The id in the request body (${id}) must match the orderId (${orderId}) in the route.`,
      });
    }
  
    if (!status || !["pending", "preparing", "out-for-delivery", "delivered"].includes(status)) {
      return next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, or delivered.",
      });
    }
  
    const updatedOrder = {
      ...order,
      deliverTo,
      mobileNumber,
      dishes,
      status,
    };
  
    res.json({ data: updatedOrder });
  }
  

function destroy(req, res, next) {
  const orderToDelete = res.locals.order;

  if (orderToDelete.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }

  const index = orders.findIndex((order) => order.id === orderToDelete.id);

  if (index === -1) {
    return next({
      status: 404,
      message: `Order id not found: ${orderToDelete.id}.`,
    });
  }

  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [validateDataExists, newOrderValidator, create],
  read: [validateOrderExists, read],
  update: [validateDataExists, newOrderValidator, validateOrderExists, update],
  delete: [validateOrderExists, destroy],
};
