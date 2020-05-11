# Welcome to FitnessTracker 👋
![Version](https://img.shields.io/badge/version-0.9-blue.svg?cacheSeconds=2592000)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

> A Backend reverse engineering assignment for a pre-written frontend that is used to track fitness workouts and specific exercises in attempt to quantify self. 


## WARNING

The database may need to be seeded with the seeders/seed.js script, which also removes any manually added data. 


## Reverse Engineering

The assignment was given as an exercise of reverse engineering: the frontend was already written. The challenge is to write the backend. 

The first thing to do is to create the schema, from which everything is based, and the obvious is to scan the seeders/seed.js. 

The declarations are as follows:

```
let workoutSeed = [
  {
    day: new Date().setDate(new Date().getDate() - 10),
    exercises: [
      {
        type: "resistance",
        name: "Bicep Curl",
        duration: 20,
        weight: 100,
        reps: 10,
        sets: 4
      }
    ]
  },
...
```

Thus, it is obvious that the declaration would have a date, then a subdocument containing various exercises (and there can be more than one per workout). 

Further examination of the records shows that one needs one more field: distance

```
 exercises: [
      {
        type: "cardio",
        name: "Running",
        duration: 25,
        distance: 4
      }
    ]
```

which makes some of the fields in exercises optional. The final schema is as follows:

```
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
```

Proper declarations were added to create workout.js which is placed in the models directory. 

Next, a study of the 3 html files and their matching js files in /public are performed The following "routes" were found.

#### HTML routes

/stats     // a graphic module

/           // grab all workouts  

/exercise    // enter a new exercise, as a part of a workout (need workoutID?) 

~~/exercise?id=xxxxxxxxx (objectId)   // this one may not even be necessary, as it was intercepted by js into api call~~

#### api routes

/api/workouts (get)    // gets all workouts and their respective exercises subdocuments

/api/workouts/:id (put)    // updates one workout with additional exercises 

/api/workouts (post)  // adds a completely new workout (then calls update workout to add new exercises)

/api/workouts/range (get)    // only called by stats.html / stats.js


A matching api.js file is created under routes with these routes, and their purposes documented. The public/api.js was also studied as it contains a few more details about the four /api routes. 

### Implementation

/api/workouts (get) was implemented first, as it seems to be the easiest... get everything. 

a) returns all workout, in ascending order. This is because the server call for root (/) was turned into "getLastWorkOut" call, which basically gets all records (through the api route) and returns only the most recent one. 

(Commentary: This seems to be an VERY inefficient way to do it. One should query the workout table with a limit of -1, i.e. grab last record after sorting)

```
   return json[json.length - 1];
```

So it was assumed that we need to return records in ascending order, due to this "last record" requirement. 

b) whether to use *send(dbWorkout)* or *json(dbWorkout)*. As the result was json-ified on the client end in *public/api.js*
```
 const json = await res.json();
```

It was decided that results will be returned plain. 

That resulted in the following code:

```
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
```


Then the other get route was examined, /api/workouts/range and how it was called unfortunately, stats.html and stats.js has very little detail on how this works at all. The only thing we can discern is whatever was retrieved was used to feed "populateChart"

```
fetch("/api/workouts/range")
  .then(response => {
    return response.json();
  })
  .then(data => {
    populateChart(data);
  });
```

There is a call in stats.js to api.getWorkoutsInRange() but it contains the same api call
```
 async getWorkoutsInRange() {
    const res = await fetch(`/api/workouts/range`);
    const json = await res.json();
    return json;
  }
```
Analysis of the rest of stats.js revealed no insight as to how to implement /api/worksouts/range other than to return everything (basically same as /api/workouts ). The name implies there is some sort of a date filter. However, given no filter was ever discussed in the stats.js nor passed in any way, it was decided not to mess with it. The same code was used. 


The /api/workout/:id (PUT) route is a bit more interesting as it wants to add a subdocument, not the document itself. Basically, we have the workout ID, we need to append an exercise to the exercises array of subdocuments in the workout. This means it's a multi-step operation. We need to findByID the workout, get the Exercises subcollection, then push a new exercise onto it, and write it all back. 

```
router.put("/api/workouts/:id", (req, res) => {
  // find the workout by Id
  Workout.findById(req.params.id, function (err, workoutById) {
    // grab all its exercises
    const objExercise = workoutById.exercises
    objExercise.push(req.body) // push contents as new exercise
    try {      // try to save it to db
      const updated = workoutById.save();
      return res.status(200).send(updated)
    }
    catch (err) {   // pop an error!
      return res.status(500).send(err)
    }
  })
})
```

Finally, we have /api/workout (POST) which creates a new workout. This one is straight-forward create. We start a new workoutObj, then we try to save it. That will give us back the _id. 

```
router.post("/api/workouts", (req, res) => {
  const newWorkoutObj = new Workout();
  newWorkoutObj.save(err => {
    if (err) return res.status(500).send(err);
    return res.status(200).send(newWorkoutObj)
  })
})
```

After some extensive testing, a flaw in original thinking was found. There was nowhere to enter a date in the UI for the workout, therefore the date in the workout must be automatically inserted. Indeed, the UI utterly failed to create any new workouts, until the following changes were incorporated. 

Thus, the schema was changed to:
```
const workoutSchema = new Schema({
  day: {
    type: Date,
    default: Date.now
  },
...
```

The requirement for the field was removed as redundant when a default value was automatically set.  

### Final bug squashed

A persistent error that was discovered by class and I was that a field, totalDuration, was blank or NaN. Analysis of workout.js shows that it should have been passed back as a result. Yet it is clearly a "derived" field, not a "true" field data. 

A careful study of Mongoose documentation [yielded "virtuals"](https://mongoosejs.com/docs/tutorials/virtuals.html) that can be used to achieve this goal: calculate total exercise durations without saving them in the table. 

First, the option to pass virtual as part of JSON response must be added to the model definition, workout.js

```
const opts = { toJSON: { virtuals: true } };
```

Then the option was used as a part of the schema at the end:

```
      distance: Number
    }
  ]
}, opts);
```

Finally, **reduce** function was used as an accumulator to sum up the exercise durations into the totalDuration field. 

```
workoutSchema.virtual('totalDuration').get(function () {
  // reduce is basically an accumulator, and the
  //ending ,0 means we start from 0
  return this.exercises.reduce((ttl, ex) => {
    return ttl + ex.duration;
  }, 0)
})
```

The code was tested locally and judged to be working, so it was uploaded to Heroku. 


## Author

Front-end was written by unknown authors for Trilogy Education, used with permission. 

Backend is by

👤 **Kasey Chang**

* Website: https://www.linkedin.com/in/kasey-chang-0932b332/
* Github: [@kschang77](https://github.com/kschang77)

## Show your support

Give a ⭐️ if this project helped you!


***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_