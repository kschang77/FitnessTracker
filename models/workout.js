const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const workoutSchema = new Schema({
  day: {
    type: Date,
    required: "Enter a date for workout"
  },
  exercises: [
    {
      type: {
        type: String,
        required: "Please enter exercise type"
      },
      name: {
        type: String,
        required: "Please enter name of exercise"
      },
      duration: Number
      ,
      weight: Number
      ,
      reps: Number
      ,
      sets: Number
      ,
      distance: Number

    }
  ]
});

const Workout = mongoose.model("Workout", workoutSchema);

module.exports = Workout;