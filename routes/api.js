const router = require("express").Router();
const Workout = require("../models/workout.js");
const path = require("path")

// express routes for api calls (see /public/api.js for details)
// /api/workouts (GET)
router.get("/api/workouts", (req, res) => {
  Workout.find({})
    .sort({ date: 1 })
    .then(dbWorkout => {
      res.send(dbWorkout);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

// /api/workouts/:xx (PUT)
router.put("/api/workouts/:id", (req, res) => {
  // find the workout by Id
  Workout.findById(req.params.id, function (err, workoutById) {
    console.log("workoutById = ", workoutById)
    // grab all its exercises
    const objExercise = workoutById.exercises
    console.log("objExercise = ", objExercise)
    objExercise.push(req.body) // push contents as new exercise

    try {
      // try to save it to db
      const updated = workoutById.save();
      return res.status(200).send(updated)
    }
    catch (err) {
      // pop an error!
      return res.status(500).send(err)
    }
  })

})



// /api/workouts  (POST)  / CREATE
router.post("/api/workouts", (req, res) => {
  const newWorkoutObj = new Workout(req.body);
  newWorkoutObj.save(err => {
    if (err) return res.status(500).send(err);
    return res.status(200).send(newWorkoutObj)
  })

  // Workout.create(body)
  //   .then(dbWorkout => {
  //     res.json(dbWorkout);
  //   })
  //   .catch(err => {
  //     res.status(400).json(err);
  //   });
});

//  /api/workouts/range (GET????)
router.get("/api/workouts/range", (req, res) => {
  Workout.find({})
    .sort({ date: 1 })
    .then(dbWorkout => {
      res.send(dbWorkout);
    })
    .catch(err => {
      res.status(400).json(err);
    });
});



//exercise   ???
router.get("/exercise", (req, res) => {

  res.sendFile(path.join(__dirname + '/../public/exercise.html'));

})

//exercise?id=xx



// /stats

router.get("/stats", (req, res) => {

  res.sendFile(path.join(__dirname + '/../public/stats.html'));

})

module.exports = router;
