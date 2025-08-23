// const { decryptData, encryptData } = require("./utility");
var express = require("express");
const cors = require("cors");
var app = express();
const { Client } = require("pg");
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
app.use(bodyParser.json());
app.use(express.json());

app.use(bodyParser.json({ limit: '10mb' })); // Limit request body size to 10MB
app.use(cors({ 
   // origin: 'http://localhost:3000', // Set the origin to allow requests from
  origin: 'https://hrms.blitzlearning.in',
  methods: ['GET', 'POST', 'OPTIONS','DELETE','PUT'], // Set allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Set allowed headers
  credentials: true // Allow credentials (cookies, authorization headers)
}));

const port = process.env.PORT || 4000;
// app.listen(port, () => console.log(`Node app listening on port ${port}!`));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);

  // Automatically hit the API every 30 seconds
  setInterval(async () => {
      try {
          const response = await axios.get(`http://localhost:${port}/`);
          console.log('API Response:', response.data);
      } catch (error) {
          console.error('Error hitting API:', error.message);
      }
  }, 50000); // 30 seconds = 30000 milliseconds
});
const { addListener } = require("nodemon");
const { application, response } = require("express");
const connection = new Client({
    // user: "postgres.adbusyzbvzlgetciiwso",
    // password: "Biltz123@990",
    // database: "postgres",
    // port: 5432,
    // host: "aws-0-ap-southeast-1.pooler.supabase.com",
    // ssl: { rejectUnauthorized: false },


  
        user: "postgres.flhbssujjbvlzcjyqdct", // Apna project user
        password: "MAnoj123@", // ✅ Supabase dashboard se copy karo
        database: "postgres",
        port: 5432,
        host: "db.flhbssujjbvlzcjyqdct.supabase.co", // ❌ pooled host nahi, yeh use karo
        ssl: { rejectUnauthorized: false },
  });
  
connection.connect()
  .then(() => {
    console.log("Connected!!!");
  })
  .catch((error) => {
    console.error("Connection error:", error);
  });

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const formattedDate = date.toISOString().split('T')[0];
  return formattedDate;
}

function formatDateToDDMMYYYY(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
}
function incrementDate(dateString) {
  const [day, month, year] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); 
  date.setDate(date.getDate() + 1);
  const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;

  return formattedDate;
}

app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

