// src/pages/HomePage.jsx - Main trip discovery feed
import { useState, useEffect } from 'react';
import api from '../services/api';
import TripCard from '../components/TripCard';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ destination: '', maxBudget: '', startDate: '' });

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.destination) params.destination = filters.destination;
      if (filters.maxBudget) params.maxBudget = filters.maxBudget;
      if (filters.startDate) params.startDate = filters.startDate;
      const res = await api.get('/trips', { params });
      setTrips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-ocean-600 via-ocean-500 to-cyan-400 p-8 md:p-12 mb-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative z-10 text-white">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">
            Find Your Perfect<br />Travel Companion ✈️
          </h1>
          <p className="text-ocean-100 text-lg mb-6 max-w-lg">
            Join trips, meet trusted travelers, and explore the world together with confidence.
          </p>
          {user ? (
            <Link to="/trips/create" className="inline-block bg-white text-ocean-700 font-bold px-6 py-3 rounded-xl hover:bg-ocean-50 transition-colors">
              + Create a Trip
            </Link>
          ) : (
            <Link to="/signup" className="inline-block bg-white text-ocean-700 font-bold px-6 py-3 rounded-xl hover:bg-ocean-50 transition-colors">
              Get Started Free
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-100 p-4 mb-8 flex flex-col sm:flex-row gap-3 shadow-sm">
        <input
          className="input-field flex-1"
          placeholder="🔍 Search destination..."
          value={filters.destination}
          onChange={e => setFilters(f => ({ ...f, destination: e.target.value }))}
        />
        <input
          type="number"
          className="input-field sm:w-40"
          placeholder="Max budget (₹)"
          value={filters.maxBudget}
          onChange={e => setFilters(f => ({ ...f, maxBudget: e.target.value }))}
        />
        <input
          type="date"
          className="input-field sm:w-44"
          value={filters.startDate}
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
        />
        <button type="submit" className="btn-primary whitespace-nowrap">Search</button>
        <button type="button" onClick={() => { setFilters({ destination: '', maxBudget: '', startDate: '' }); setTimeout(fetchTrips, 0); }} className="btn-secondary whitespace-nowrap">Clear</button>
      </form>

      {/* Trip grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">🗺️</p>
          <p className="text-xl font-medium">No trips found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new trip!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {trips.map(trip => <TripCard key={trip._id} trip={trip} />)}
        </div>
      )}
    </div>
  );
}
