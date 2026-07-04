const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dba = require("../dbAdapter");

const SECRET = process.env.JWT_SECRET || "hubooze_secret";

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    SECRET,
    { expiresIn: "7d" }
  );
}

async function login(email, password) {
  const user = await dba.findUser({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) {
    throw new Error("Invalid email or password.");
  }

  await dba.updateUser(user._id, {
    lastLoginAt: new Date(),
  });

  return {
    token: signToken(user),
    user,
  };
}

module.exports = {
  login,
  signToken,
};