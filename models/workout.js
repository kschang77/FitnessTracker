// opts toJSON is needed to make sure we pass this
// virtual field as part of JSON response
const opts = { toJSON: { virtuals: true } };

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const workoutSchema = new Schema({
  day: {
    type: Date,
    required: "Enter a date for workout",
    default: Date.now
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
}, opts);

// create virtual field in Mongoose for totalDuration
//a field mentioned in workout.js (line 11)
workoutSchema.virtual('totalDuration').get(function () {
  // reduce is basically an accumulator, and the
  //ending ,0 means we start from 0
  return this.exercises.reduce((ttl, ex) => {
    return ttl + ex.duration;
  }, 0)
})

const Workout = mongoose.model("Workout", workoutSchema);

module.exports = Workout;