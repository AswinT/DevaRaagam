const bcrypt = require("bcrypt");

const hashPassword = async (plainPassword) => {
  const saltRounds = 10; // Standard practice
  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  return hashed;
};

// You might also want a comparePassword function here
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
