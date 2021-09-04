const express = require("express");
const router = new express.Router();

var natural = require("natural");
var tokenizer = new natural.WordTokenizer();

//const tf = require("@tensorflow/tfjs");
const tf = require("@tensorflow/tfjs-node");

const data = require("../Training_data/data");
const { indexOf } = require("underscore");
const x_train = data.x_train;
const y_train = data.y_train;
const all_words = data.all_words;
const intent_tags = data.intent_tags;
const responses = data.responses;

const HIDDEN_SIZE = 5;
const model = tf.sequential();
model.add(
  tf.layers.dense({
    inputShape: [50],
    units: 5,
    activation: "relu",
  })
);
model.add(
  tf.layers.dense({
    units: 5,
    activation: "relu",
  })
);
model.add(
  tf.layers.dense({
    units: 5,
    activation: "relu",
  })
);
model.add(
  tf.layers.dense({
    units: 5,
    activation: "softmax",
  })
);

const ALPHA = 0.1;
model.compile({
  optimizer: tf.train.sgd(ALPHA),
  loss: "binaryCrossentropy",
});

var trainModel = async () => {
  await model.fit(x_train, y_train, {
    epochs: 500,
    batchSize: 8,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`Epoch ${epoch}: error: ${logs.loss}`);
        }
      },
    },
  });
};

var bag_of_words = async (input_text, all_words) => {
  var tokenized = tokenizer.tokenize(input_text);
  var input_text_stemmed = [];
  tokenized.forEach((word) => {
    input_text_stemmed.push(natural.PorterStemmer.stem(word));
  });

  var bag_of_words = [];

  for (var i = 0; i < all_words.length; i++) {
    bag_of_words.push(0);
  }

  for (var i = 0; i < input_text_stemmed.length; i++) {
    if (all_words.includes(input_text_stemmed[i])) {
      bag_of_words[all_words.indexOf(input_text_stemmed[i])] = 1;
    }
  }

  return bag_of_words;
};

var return_tag = (array, max) => {
  const max1 = max.dataSync();
  const array1 = array.dataSync();
  for (var i = 0; i < 5; i++) {
    if (array1[i] == max1) {
      return intent_tags[i];
    }
  }
};

router.post("/message", async (req, res) => {
  input_message = req.body;
  bag_of_words(input_message["message"], all_words).then(async (val) => {
    var word_bag = val;
    console.log(word_bag);
    var predict_tensor = tf.tensor([word_bag]);
    try {
      const Loadedmodel = await tf.loadLayersModel(
        "file:///tmp/my-model-1/model.json"
      );
      console.log(Loadedmodel.predict(predict_tensor).print());
      var predictions = model.predict(predict_tensor);
          const resProb = tf.max(predictions).dataSync();
          if (resProb > 0.75) {
            var randomResIndex = Math.floor(Math.random() * responses[intent_tags.indexOf(return_tag(predictions, tf.max(predictions)))].length);
            console.log(randomResIndex);
            res.send(responses[intent_tags.indexOf(return_tag(predictions, tf.max(predictions)))][randomResIndex]);
          } else {
            res.send("Hmm..!, I'm listening. Tell me more!");
          }
      console.log("Predicted!");
    } catch (e) {
      console.log("Model loading failed");

      trainModel().then(async () => {
        try {
          var predictions = model.predict(predict_tensor);
          const resProb = tf.max(predictions).dataSync();
          if (resProb > 0.75) {
            var randomResIndex = Math.floor(Math.random() * responses[intent_tags.indexOf(return_tag(predictions, tf.max(predictions)))].length);
            console.log(randomResIndex);
            res.send(responses[intent_tags.indexOf(return_tag(predictions, tf.max(predictions)))][randomResIndex]);
          } else {
            res.send("Hmm..!, I'm listening. Tell me more!");
          }
          console.log("Trying to save model");
          model.save("file:///tmp/my-model-1").then(() => {
            console.log("Model saved");
          });
        } catch (e) {
          console.log("Model not saved");
          console.log(e);
        }
      });
    }
  });
});

module.exports = {
  router,
};
