// src/pages/TripDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TrustBadge from '../components/TrustBadge';
import Modal from '../components/Modal';
import StarRating from '../components/StarRating';

export default function TripDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const fetchTrip = async () => {
    try {
      const res = await api.get(`/trips/${id}`);
      setTrip(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrip(); }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!trip) return <div className="text-center py-20 text-slate-400">Trip not found</div>;

  const isCreator = user && trip.creator._id === user._id;
  const isMember = user && trip.members.some(m => m._id === user._id);
  const hasPendingRequest = user && trip.pendingRequests.some(r => r.user._id === user._id);
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const spotsLeft = trip.maxMembers - trip.members.length;

  const handleJoinRequest = async () => {
    setJoinLoading(true);
    try {
      await api.post(`/requests/${trip._id}/request`, { message: joinMessage });
      setActionMsg('Join request sent! The host will review it.');
      fetchTrip();
    } catch (err) { setActionMsg(err.response?.data?.message || 'Failed'); }
    finally { setJoinLoading(false); }
  };

  const handleAccept = async (userId) => {
    await api.put(`/requests/${trip._id}/accept/${userId}`);
    fetchTrip();
  };

  const handleReject = async (userId) => {
    await api.put(`/requests/${trip._id}/reject/${userId}`);
    fetchTrip();
  };

  const handleCancelMembership = async () => {
    if (!window.confirm('Cancel your membership? This will reduce your trust score by 15.')) return;
    await api.post(`/trips/${trip._id}/cancel`);
    fetchTrip();
  };

  const handleCompleteTrip = async () => {
    if (!window.confirm('Mark this trip as completed?')) return;
    await api.post(`/trips/${trip._id}/complete`);
    fetchTrip();
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm('Delete this trip permanently?')) return;
    await api.delete(`/trips/${trip._id}`);
    navigate('/');
  };

  const submitReview = async () => {
    try {
      await api.post('/reviews', { toUserId: reviewTarget._id, tripId: trip._id, ...reviewForm });
      setShowReviewModal(false);
      setActionMsg('Review submitted!');
    } catch (err) { setActionMsg(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero image */}
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-ocean-400 to-ocean-700">
        {trip.image ? (
          <img src={trip.image} alt={trip.destination} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-white text-7xl">🏖️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl md:text-4xl font-bold">📍 {trip.destination}</h1>
          <p className="text-white/80 mt-1">{formatDate(trip.startDate)} → {formatDate(trip.endDate)}</p>
        </div>
        <span className={`absolute top-4 right-4 text-sm font-semibold px-3 py-1.5 rounded-full ${
          trip.status === 'open' ? 'bg-green-500 text-white' :
          trip.status === 'full' ? 'bg-orange-500 text-white' :
          trip.status === 'completed' ? 'bg-slate-600 text-white' : 'bg-red-500 text-white'
        }`}>{trip.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 text-lg mb-3">About This Trip</h2>
            <p className="text-slate-600 leading-relaxed">{trip.description}</p>
            {trip.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {trip.tags.map(tag => (
                  <span key={tag} className="bg-ocean-50 text-ocean-700 text-xs px-3 py-1 rounded-full border border-ocean-100">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 text-lg mb-4">Members ({trip.members.length}/{trip.maxMembers})</h2>
            <div className="flex flex-wrap gap-3">
              {trip.members.map(member => (
                <Link key={member._id} to={`/users/${member._id}`} className="flex items-center gap-2 bg-slate-50 hover:bg-ocean-50 px-3 py-2 rounded-xl transition-colors">
                  {member.profileImage ? (
                    <img src={member.profileImage} className="w-8 h-8 rounded-full object-cover" alt={member.name} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-ocean-100 flex items-center justify-center text-sm font-bold text-ocean-700">{member.name[0]}</div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-700">{member.name}</p>
                    <TrustBadge score={member.trustScore} small />
                  </div>
                  {trip.status === 'completed' && user && member._id !== user._id && (
                    <button onClick={(e) => { e.preventDefault(); setReviewTarget(member); setShowReviewModal(true); }}
                      className="ml-2 text-xs bg-sand-100 text-yellow-700 px-2 py-1 rounded-lg hover:bg-sand-200 transition-colors">
                      ⭐ Rate
                    </button>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Pending requests (only for creator) */}
          {isCreator && trip.pendingRequests.length > 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-slate-800 text-lg mb-4">Join Requests ({trip.pendingRequests.length})</h2>
              <div className="space-y-3">
                {trip.pendingRequests.map(req => (
                  <div key={req.user._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    {req.user.profileImage ? (
                      <img src={req.user.profileImage} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-ocean-100 flex items-center justify-center font-bold text-ocean-700">{req.user.name[0]}</div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">{req.user.name}</p>
                      <TrustBadge score={req.user.trustScore} small />
                      {req.message && <p className="text-xs text-slate-500 mt-1">"{req.message}"</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(req.user._id)} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors">Accept</button>
                      <button onClick={() => handleReject(req.user._id)} className="bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Trip stats */}
          <div className="card p-5">
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Budget</span><span className="font-semibold text-ocean-700">₹{trip.budget?.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Spots left</span><span className={`font-semibold ${spotsLeft === 0 ? 'text-red-500' : 'text-green-600'}`}>{spotsLeft} / {trip.maxMembers}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Duration</span><span className="font-semibold">{Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000)} days</span></div>
            </div>
          </div>

          {/* Creator card */}
          <div className="card p-5">
            <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Trip Host</p>
            <Link to={`/users/${trip.creator._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {trip.creator.profileImage ? (
                <img src={trip.creator.profileImage} className="w-12 h-12 rounded-xl object-cover" alt={trip.creator.name} />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-ocean-100 flex items-center justify-center font-bold text-ocean-700 text-lg">{trip.creator.name[0]}</div>
              )}
              <div>
                <p className="font-semibold text-slate-800">{trip.creator.name}</p>
                <TrustBadge score={trip.creator.trustScore} small />
              </div>
            </Link>
            {trip.creator.bio && <p className="text-xs text-slate-500 mt-3">{trip.creator.bio}</p>}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {actionMsg && <div className="bg-ocean-50 text-ocean-700 rounded-xl px-4 py-3 text-sm">{actionMsg}</div>}

            {/* Non-member actions */}
            {user && !isCreator && !isMember && !hasPendingRequest && trip.status === 'open' && (
              <div className="card p-5 space-y-3">
                <textarea className="input-field resize-none text-sm" rows={2} placeholder="Optional message to the host..."
                  value={joinMessage} onChange={e => setJoinMessage(e.target.value)} />
                <button onClick={handleJoinRequest} disabled={joinLoading} className="btn-primary w-full">
                  {joinLoading ? 'Sending...' : '🙋 Request to Join'}
                </button>
              </div>
            )}

            {hasPendingRequest && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 font-medium text-center">⏳ Request Pending</div>
            )}

            {isMember && !isCreator && trip.status === 'open' && (
              <>
                <Link to={`/chat/${trip._id}`} className="btn-primary w-full text-center block">💬 Open Group Chat</Link>
                <button onClick={handleCancelMembership} className="btn-danger w-full text-sm">Leave Trip (−15 trust)</button>
              </>
            )}

            {isMember && !isCreator && trip.status !== 'open' && (
              <Link to={`/chat/${trip._id}`} className="btn-primary w-full text-center block">💬 Open Group Chat</Link>
            )}

            {/* Creator actions */}
            {isCreator && (
              <div className="space-y-2">
                <Link to={`/chat/${trip._id}`} className="btn-primary w-full text-center block">💬 Group Chat</Link>
                {trip.status === 'open' && (
                  <button onClick={handleCompleteTrip} className="btn-secondary w-full text-sm">✅ Mark as Completed</button>
                )}
                <button onClick={handleDeleteTrip} className="btn-danger w-full text-sm">🗑️ Delete Trip</button>
              </div>
            )}

            {!user && (
              <Link to="/login" className="btn-primary w-full text-center block">Login to Join</Link>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title={`Rate ${reviewTarget?.name}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-2">Your Rating</label>
            <StarRating value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">Comment (optional)</label>
            <textarea className="input-field resize-none" rows={3} placeholder="How was traveling with them?"
              value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
          </div>
          <button onClick={submitReview} className="btn-primary w-full">Submit Review</button>
        </div>
      </Modal>
    </div>
  );
}
