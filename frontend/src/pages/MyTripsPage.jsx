// src/pages/MyTripsPage.jsx - All trips user created or joined
import { useState, useEffect } from 'react';
import api from '../services/api';
import TripCard from '../components/TripCard';
import { Link } from 'react-router-dom';

export default function MyTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/trips/my-trips')
      .then(r => setTrips(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? trips : trips.filter(t => t.status === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Trips</h1>
        <Link to="/trips/create" className="btn-primary text-sm">+ New Trip</Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'open', 'full', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-ocean-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">✈️</p>
          <p className="font-medium text-lg">No {filter !== 'all' ? filter : ''} trips yet</p>
          <Link to="/trips/create" className="mt-4 inline-block btn-primary text-sm">Create Your First Trip</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(trip => <TripCard key={trip._id} trip={trip} />)}
        </div>
      )}
    </div>
  );
}
