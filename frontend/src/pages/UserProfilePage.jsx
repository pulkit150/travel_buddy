// src/pages/UserProfilePage.jsx - View any user's public profile
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import TrustBadge from '../components/TrustBadge';
import StarRating from '../components/StarRating';

export default function UserProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/users/${id}`), api.get(`/reviews/user/${id}`)])
      .then(([userRes, reviewRes]) => { setProfile(userRes.data); setReviews(reviewRes.data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center py-20 text-slate-400">User not found</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-5">
          {profile.profileImage ? (
            <img src={profile.profileImage} className="w-20 h-20 rounded-2xl object-cover border-4 border-ocean-100" alt={profile.name} />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white font-bold text-3xl">
              {profile.name?.[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{profile.name}</h1>
            {profile.age && <p className="text-slate-400 text-sm">{profile.age} years old</p>}
            <TrustBadge score={profile.trustScore} />
          </div>
        </div>

        {profile.bio && <p className="text-slate-600 text-sm mt-4">{profile.bio}</p>}

        {profile.interests?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.interests.map(i => (
              <span key={i} className="bg-ocean-50 text-ocean-700 text-xs font-medium px-3 py-1 rounded-full border border-ocean-100">{i}</span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
          {[
            { label: 'Trips', value: profile.tripsCompleted || 0, icon: '✅' },
            { label: 'Cancellations', value: profile.tripsCancelled || 0, icon: '❌' },
            { label: 'Rating', value: profile.averageRating ? `${profile.averageRating}★` : '—', icon: '⭐' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-xl">{s.icon}</div>
              <div className="text-lg font-bold text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <h2 className="font-bold text-slate-700 mb-4">Reviews ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p className="text-3xl mb-2">⭐</p>
          <p className="text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r._id} className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                {r.fromUser?.profileImage ? (
                  <img src={r.fromUser.profileImage} className="w-8 h-8 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-ocean-100 flex items-center justify-center text-xs font-bold text-ocean-700">{r.fromUser?.name?.[0]}</div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{r.fromUser?.name}</p>
                  <p className="text-xs text-slate-400">{r.trip?.destination}</p>
                </div>
                <StarRating value={r.rating} readonly />
              </div>
              {r.comment && <p className="text-slate-600 text-sm mt-1">{r.comment}</p>}
              <p className="text-xs text-slate-400 mt-2">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
