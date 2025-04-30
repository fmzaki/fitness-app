import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import WorkoutList from '../Workouts/WorkoutList'; // Import the WorkoutList component

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [workoutData, setWorkoutData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workoutsRes] = await Promise.all([
          API.get('/workouts?includeExercises=true')
        ]);
        
        setWorkoutData(workoutsRes.data);
      } catch (err) {
        console.error('Fetch error:', err);
        if (err.response?.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare data for charts
  const workoutTypes = workoutData.reduce((acc, workout) => {
    acc[workout.workout_type] = (acc[workout.workout_type] || 0) + 1;
    return acc;
  }, {});

  const weeklyVolume = workoutData.map(workout => ({
    date: new Date(workout.date).toLocaleDateString(),
    volume: workout.exercises?.reduce((sum, ex) => sum + (ex.sets * ex.reps * ex.weight), 0) || 0
  }));

  // Chart configurations
  const typeDistributionChart = {
    labels: Object.keys(workoutTypes),
    datasets: [{
      label: 'Workout Types',
      data: Object.values(workoutTypes),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
      ],
      borderWidth: 1
    }]
  };

  const volumeTrendChart = {
    labels: weeklyVolume.map(item => item.date),
    datasets: [{
      label: 'Training Volume',
      data: weeklyVolume.map(item => item.volume),
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      tension: 0.1,
      fill: true
    }]
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl font-semibold text-blue-600">Loading dashboard...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Fitness Dashboard</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Workout Type Distribution</h3>
                <div className="h-80">
                  <Bar 
                    data={typeDistributionChart} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Weekly Volume Trend</h3>
                <div className="h-80">
                  <Line 
                    data={volumeTrendChart} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Workouts</p>
                  <p className="text-2xl font-bold text-blue-800">{workoutData.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Last Workout</p>
                  <p className="text-2xl font-bold text-green-800">
                    {workoutData[0] ? new Date(workoutData[0].date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Workout Types</p>
                  <p className="text-2xl font-bold text-purple-800">{Object.keys(workoutTypes).length}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-sm text-amber-600 font-medium">Total Volume</p>
                  <p className="text-2xl font-bold text-amber-800">
                    {weeklyVolume.reduce((sum, item) => sum + item.volume, 0).toLocaleString()} kg
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Workouts */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Recent Workouts</h3>
            <WorkoutList workouts={workoutData.slice(0, 3)} />
            {workoutData.length > 3 && (
              <div className="mt-4 text-center">
                <a 
                  href="/workouts" 
                  className="text-blue-600 hover:underline"
                >
                  View all workouts →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;