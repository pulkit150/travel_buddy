// src/pages/ProfilePage.jsx - Current user's full profile
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import TrustBadge from '../components/TrustBadge';
import StarRating from '../components/StarRating';
import TripCard from '../components/TripCard';
// Add this import at the top (line 4)
import { getImageUrl } from '../services/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('trips');

  useEffect(() => {
    if (user) {
      api.get(`/reviews/user/${user._id}`).then(r => setReviews(r.data));
      api.get('/trips/my-trips').then(r => setMyTrips(r.data));
    }
  }, [user]);

  if (!user) return null;

  const tabs = ['trips', 'reviews', 'activity'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          {user.profileImage ? (
            <img src={getImageUrl(user.profileImage)} className="w-24 h-24 rounded-2xl object-cover border-4 border-ocean-100" alt="avatar" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white font-bold text-3xl">
              {user.name?.[0]}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">{user.name}</h1>
              {user.age && <span className="text-slate-400 text-sm">· {user.age} years</span>}
            </div>
            <TrustBadge score={user.trustScore} />
            {user.bio && <p className="text-slate-600 text-sm mt-3 max-w-md">{user.bio}</p>}

            {/* Interests */}
            {user.interests?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {user.interests.map(i => (
                  <span key={i} className="bg-ocean-50 text-ocean-700 text-xs font-medium px-3 py-1 rounded-full border border-ocean-100">
                    {i}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Link to="/profile/edit" className="btn-secondary text-sm self-start">Edit Profile</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
          {[
            { label: 'Trips Completed', value: user.tripsCompleted || 0, icon: '✅' },
            { label: 'Cancellations', value: user.tripsCancelled || 0, icon: '❌' },
            { label: 'Avg Rating', value: user.averageRating ? `${user.averageRating}★` : '—', icon: '⭐' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl">{stat.icon}</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-ocean-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'trips' && (
        myTrips.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">✈️</p>
            <p className="font-medium">No trips yet</p>
            <Link to="/trips/create" className="mt-3 inline-block btn-primary text-sm">Create Your First Trip</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myTrips.map(t => <TripCard key={t._id} trip={t} />)}
          </div>
        )
      )}

      {activeTab === 'reviews' && (
        reviews.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">⭐</p>
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm">Complete trips to receive reviews from fellow travelers.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review._id} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  {review.fromUser?.profileImage ? (
                    <img src={getImageUrl(review.fromUser?.profileImage)} className="w-9 h-9 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-ocean-100 flex items-center justify-center font-bold text-ocean-700 text-sm">
                      {review.fromUser?.name?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{review.fromUser?.name}</p>
                    <p className="text-xs text-slate-400">{review.trip?.destination}</p>
                  </div>
                  <StarRating value={review.rating} readonly className="ml-auto" />
                </div>
                {review.comment && <p className="text-slate-600 text-sm">{review.comment}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'activity' && (
        <div className="card p-6">
          <h3 className="font-bold text-slate-700 mb-4">Activity Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Trust Score</span><span className="font-semibold text-slate-800">{user.trustScore}/100</span></div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-ocean-500 h-2 rounded-full transition-all" style={{ width: `${user.trustScore}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-2">Score increases when you complete trips, get positive reviews, and build trust in the community.</p>

            {/* Score breakdown legend */}
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
              {[
                { event: 'Email verified', change: '+5', color: 'text-green-600' },
                { event: 'Profile completed', change: '+5', color: 'text-green-600' },
                { event: 'Trip completed', change: '+10', color: 'text-green-600' },
                { event: 'Positive rating (4-5★)', change: '+2', color: 'text-green-600' },
                { event: 'Negative rating (1-2★)', change: '-2', color: 'text-red-500' },
                { event: 'Cancelled after joining', change: '-15', color: 'text-red-500' },
                { event: 'Reported by others', change: '-20', color: 'text-red-500' },
              ].map(item => (
                <div key={item.event} className="flex justify-between text-xs">
                  <span className="text-slate-600">{item.event}</span>
                  <span className={`font-bold ${item.color}`}>{item.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
