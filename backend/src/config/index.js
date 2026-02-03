const connectDatabase = require('./database');
const configurePassport = require('./passport');
const { createTransporter, getTransporter } = require('./email');

module.exports = {
  connectDatabase,
  configurePassport,
  createTransporter,
  getTransporter,
};
