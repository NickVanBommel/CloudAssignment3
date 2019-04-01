const dotenv = require('dotenv');
dotenv.config();
var mysql = require('mysql');

var pool  = mysql.createPool({
  connectionLimit : 10,
  port            : process.env.DB_PORT,
  host            : process.env.DB_ENDPOINT,
  user            : process.env.DB_USERNAME,
  password        : process.env.DB_PASSWORD,
  database        : process.env.DATABASE_NAME,
  timezone        : 'Z'
});

pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});

module.exports = pool;