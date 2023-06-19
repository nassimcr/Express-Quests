const database = require("./database");
const argon2 = require("argon2");

const postUser = async (req, res) => {
  const { firstname, lastname, email, city, language, password } = req.body;

  try {
    const hashedPassword = await argon2.hash(password);

    const sql =
      "INSERT INTO users (firstname, lastname, email, city, language, hashedPassword) VALUES (?, ?, ?, ?, ?, ?)";

    await database.query(sql, [
      firstname,
      lastname,
      email,
      city,
      language,
      hashedPassword,
    ]);
    res.status(201).send("User created");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
  }
};

const getUsers = (req, res) => {
  const initialSql = "select * from users";
  const where = [];

  if (req.query.language != null) {
    where.push({
      column: "language",
      value: req.query.language,
      operator: "=",
    });
  }
  if (req.query.city != null) {
    where.push({
      column: "city",
      value: req.query.city,
      operator: "=",
    });
  }

  database
    .query(
      where.reduce(
        (sql, { column, operator }, index) =>
          `${sql} ${index === 0 ? "where" : "and"} ${column} ${operator} ?`,
        initialSql
      ),
      where.map(({ value }) => value)
    )
    .then(([users]) => {
      res.status(200).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving data from database");
    });
};

const getUserById = (req, res) => {
  const id = parseInt(req.params.id);

  database
    .query("select * from users where id = ?", [id])
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json(result[0]);
      } else {
        res.status(404).json({ message: "Not found" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    });
};

const updateUser = async (req, res) => {
  const { firstname, lastname, email, city, language, password } = req.body;
  const { userId } = req.params;

  try {
    const hashedPassword = await argon2.hash(password);

    const sql =
      "UPDATE users SET firstname = ?, lastname = ?, email = ?, city = ?, language = ?, hashedPassword = ? WHERE id = ?";

    await database.query(sql, [
      firstname,
      lastname,
      email,
      city,
      language,
      hashedPassword,
      userId,
    ]);
    res.status(200).send("User updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating user");
  }
};

const deleteUser = (req, res) => {
  const id = parseInt(req.params.id);

  database
    .query("delete from users where id = ?", [id])
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.status(404).send("Not Found");
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error deleting the user");
    });
};

module.exports = {
  getUsers,
  getUserById,
  postUser,
  updateUser,
  deleteUser,
};
