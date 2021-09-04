const express = require('express');
const tf = require("@tensorflow/tfjs");
const app = express();


const corsOptions = {
  origin: '*',
};

app.use(logger('dev'));
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Journal Chatbot API')
});

const allRoutes = require('./routes/allRoutes').router;

app.use(allRoutes);

PORT = process.env.PORT || 3000;
app.listen(PORT);
console.log(`Running server at http://localhost:${PORT}`);