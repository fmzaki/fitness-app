// components/Workouts/AddWorkout.js
import React, { useState } from 'react';
import API from '../../api';
import { useNavigate } from 'react-router-dom';

function AddWorkout() {
  const [workout, setWorkout] = useState({
    date: new Date().toISOString().split('T')[0],
    workout_type: 'Strength',
    notes: '',
    exercises: [] // Added exercise array
  });
  const [currentExercise, setCurrentExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: 0
  });

  const navigate = useNavigate();

  const handleAddExercise = () => {
    setWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, currentExercise]
    }));
    setCurrentExercise({
      name: '',
      sets: 3,
      reps: 10,
      weight: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/workouts', workout);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save workout', err);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Log Workout</h2>
      <form onSubmit={handleSubmit}>
        {/* Existing workout fields */}
        <div className="mb-4">
          <label className="block mb-2">Exercises</label>
          <div className="space-y-4 mb-4">
            {workout.exercises.map((ex, i) => (
              <div key={i} className="border p-3 rounded">
                <p>{ex.name}: {ex.sets}x{ex.reps} @ {ex.weight}kg</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Exercise"
              value={currentExercise.name}
              onChange={(e) => setCurrentExercise({...currentExercise, name: e.target.value})}
              className="col-span-2 p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Sets"
              value={currentExercise.sets}
              onChange={(e) => setCurrentExercise({...currentExercise, sets: e.target.value})}
              className="p-2 border rounded"
            />
            {/* Add reps and weight inputs similarly */}
          </div>
          <button
            type="button"
            onClick={handleAddExercise}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Exercise
          </button>
        </div>
        <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded">
          Save Workout
        </button>
      </form>
    </div>
  );
}

export default AddWorkout;