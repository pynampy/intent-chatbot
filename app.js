const express = require('express');
const tf = require("@tensorflow/tfjs");
const app = express();
app.use(express.json())


app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Journal Chatbot API')
});

app.post('/try', (req,res) => {
  const message = req.body;
  console.log(message['message']);
})


const allRoutes = require('./routes/allRoutes').router;

app.use(allRoutes);

PORT = process.env.PORT || 3000;
app.listen(PORT);
console.log(`Running server at http://localhost:${PORT}`);