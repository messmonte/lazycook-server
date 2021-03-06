const { Router } = require("express");
const bcrypt = require("bcrypt");
const { toJWT } = require("./jwt");
const User = require("../user/model");
const auth = require("./middleware");
const Recipe = require("../recipe/model");
const Ingredient = require("../ingredient/model");

const router = new Router();

router.post("/login", (request, response, next) => {
  const email = request.body.email;
  const password = request.body.password;
  if (!email || !password) {
    response.status(400).send("Please enter a valid e-mail and password");
  } else {
    User.findOne({ where: { email: request.body.email }, include: [Recipe] })
      .then((user) => {
        if (!user) {
          response
            .status(400)
            .send({ message: "User with that email doesn't exist" });
        } else if (bcrypt.compareSync(request.body.password, user.password)) {
          if (user.recipes.length === 0) {
            response.send({
              id: user.id,
              email: user.email,
              jwt: toJWT({ userId: user.id }),
              recipes: [],
            });
          }
          let recipesWithIngs = [];
          user.recipes.forEach((recipe, index) => {
            Recipe.findOne({
              where: { id: recipe.id },
              include: [Ingredient],
            }).then((rsp) => {
              recipesWithIngs.push(rsp);
              if (index === user.recipes.length - 1) {
                response.send({
                  id: user.id,
                  email: user.email,
                  jwt: toJWT({ userId: user.id }),
                  recipes: recipesWithIngs,
                });
              }
            });
          });
        } else {
          response.status(400).send({
            message: "password is incorrect",
          });
        }
      })
      .catch((error) => {
        console.error(error);
        response.status(500).send({ message: "Something went wrong" });
      });
  }
});

router.get("/test-endpoint", auth, (request, response, next) => {
  response.send({
    message: `This is the test endpoint, ${request.user.email}`,
  });
});

module.exports = router;
