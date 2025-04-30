// components/Workouts/WorkoutList.js
import React from 'react';
import { format } from 'date-fns';

function WorkoutList({ workouts }) {
  return (
    <div className="space-y-4">
      {workouts.map(workout => (
        <div key={workout.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold">{workout.workout_type}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(workout.date), 'PPP')}
              </p>
            </div>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              {workout.exercises?.length || 0} exercises
            </span>
          </div>
          
          {workout.notes && (
            <p className="mt-2 text-gray-600">{workout.notes}</p>
          )}

          <div className="mt-3 space-y-2">
            {workout.exercises?.map((exercise, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{exercise.name}</span>
                <span>
                  {exercise.sets}x{exercise.reps} @ {exercise.weight}kg
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default WorkoutList;