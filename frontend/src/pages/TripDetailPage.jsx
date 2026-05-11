// src/pages/TripDetailPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import TrustBadge from '../components/TrustBadge';
import Modal from '../components/Modal';
import StarRating from '../components/StarRating';
import { getImageUrl } from '../services/api';

export default function TripDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, notifications } = useSocket();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionType, setActionType] = useState('info'); // 'info' | 'error' | 'success'
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const fetchTrip = useCallback(async () => {
    try {
      const res = await api.get(`/trips/${id}`);
      setTrip(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  // ✅ Real-time: re-fetch trip when a notification arrives related to this trip
  useEffect(() => {
    if (!notifications.length) return;
    const latest = notifications[0];
    if (latest?.tripId?.toString() === id) {
      fetchTrip(); // auto-refresh trip data
    }
  }, [notifications, id, fetchTrip]);

  // ✅ Real-time: listen for trip_update socket event
  useEffect(() => {
    if (!socket) return;
    socket.on('trip_updated', (updatedTripId) => {
      if (updatedTripId === id) fetchTrip();
    });
    return () => socket.off('trip_updated');
  }, [socket, id, fetchTrip]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!trip) return <div className="text-center py-20 text-slate-400">Trip not found</div>;

  const isCreator = user && trip.creator._id === user._id;
  const isMember = user && trip.members.some(m => m._id === user._id);
  const hasPendingRequest = user && trip.pendingRequests.some(r => r.user._id === user._id);
  const wasRejected = user && trip.rejectedUsers && trip.rejectedUsers.some(
    id => id === user._id || id?._id === user._id || id?.toString() === user._id
  );

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const spotsLeft = trip.maxMembers - trip.members.length;

  const showMsg = (msg, type = 'info') => {
    setActionMsg(msg);
    setActionType(type);
  };

  const handleJoinRequest = async () => {
    setJoinLoading(true);
    setActionMsg('');
    try {
      await api.post(`/requests/${trip._id}/request`, { message: joinMessage });
      showMsg('✅ Join request sent! Waiting for host approval.', 'success');
      setJoinMessage('');
      fetchTrip();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    try {
      await api.put(`/requests/${trip._id}/accept/${userId}`);
      fetchTrip(); // immediate local refresh
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to accept', 'error');
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.put(`/requests/${trip._id}/reject/${userId}`);
      fetchTrip(); // immediate local refresh
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  const handleCancelMembership = async () => {
    if (!window.confirm('Leave this trip? Your trust score will decrease by 15.')) return;
    try {
      await api.post(`/trips/${trip._id}/cancel`);
      fetchTrip();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to leave trip', 'error');
    }
  };

  const handleCompleteTrip = async () => {
    if (!window.confirm('Mark this trip as completed for all members?')) return;
    try {
      await api.post(`/trips/${trip._id}/complete`);
      fetchTrip();
      showMsg('✅ Trip marked as completed! All members get +10 trust score.', 'success');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to complete trip', 'error');
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm('Delete this trip permanently?')) return;
    try {
      await api.delete(`/trips/${trip._id}`);
      navigate('/');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to delete trip', 'error');
    }
  };

  const submitReview = async () => {
    try {
      await api.post('/reviews', {
        toUserId: reviewTarget._id,
        tripId: trip._id,
        ...reviewForm,
      });
      setShowReviewModal(false);
      showMsg('⭐ Review submitted!', 'success');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to submit review', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-ocean-400 to-ocean-700">
        {trip.image ? (
          <img src={getImageUrl(trip.image)} alt={trip.destination} className="w-full h-full object-cover" />
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
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 text-lg mb-3">About This Trip</h2>
            <p className="text-slate-600 leading-relaxed">{trip.description}</p>
            {trip.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {trip.tags.map(tag => (
                  <span key={tag} className="bg-ocean-50 text-ocean-700 text-xs px-3 py-1 rounded-full border border-ocean-100">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 text-lg mb-4">
              Members ({trip.members.length}/{trip.maxMembers})
            </h2>
            <div className="flex flex-wrap gap-3">
              {trip.members.map(member => (
                <Link
                  key={member._id}
                  to={`/users/${member._id}`}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-ocean-50 px-3 py-2 rounded-xl transition-colors"
                >
                  {member.profileImage ? (
                    <img src={getImageUrl(member.profileImage)} className="w-8 h-8 rounded-full object-cover" alt={member.name} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-ocean-100 flex items-center justify-center text-sm font-bold text-ocean-700">
                      {member.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-700">{member.name}</p>
                    <TrustBadge score={member.trustScore} small />
                  </div>
                  {trip.status === 'completed' && user && member._id !== user._id && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setReviewTarget(member);
                        setShowReviewModal(true);
                      }}
                      className="ml-2 text-xs bg-sand-100 text-yellow-700 px-2 py-1 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      ⭐ Rate
                    </button>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Pending requests — creator only */}
          {isCreator && trip.pendingRequests.length > 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-slate-800 text-lg mb-4">
                Join Requests ({trip.pendingRequests.length})
              </h2>
              <div className="space-y-3">
                {trip.pendingRequests.map(req => (
                  <div key={req.user._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    {req.user.profileImage ? (
                      <img src={getImageUrl(req.user.profileImage)} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-ocean-100 flex items-center justify-center font-bold text-ocean-700">
                        {req.user.name[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">{req.user.name}</p>
                      <TrustBadge score={req.user.trustScore} small />
                      {req.message && (
                        <p className="text-xs text-slate-500 mt-1 italic">"{req.message}"</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(req.user._id)}
                        className="bg-green-500 text-white text-xs px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(req.user._id)}
                        className="bg-red-100 text-red-600 text-xs px-4 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="card p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Budget</span>
              <span className="font-semibold text-ocean-700">₹{trip.budget?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Spots left</span>
              <span className={`font-semibold ${spotsLeft === 0 ? 'text-red-500' : 'text-green-600'}`}>
                {spotsLeft} / {trip.maxMembers}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Duration</span>
              <span className="font-semibold">
                {Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000)} days
              </span>
            </div>
          </div>

          {/* Host */}
          <div className="card p-5">
            <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Trip Host</p>
            <Link to={`/users/${trip.creator._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {trip.creator.profileImage ? (
                <img src={getImageUrl(trip.creator.profileImage)} className="w-12 h-12 rounded-xl object-cover" alt={trip.creator.name} />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-ocean-100 flex items-center justify-center font-bold text-ocean-700 text-lg">
                  {trip.creator.name[0]}
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800">{trip.creator.name}</p>
                <TrustBadge score={trip.creator.trustScore} small />
              </div>
            </Link>
            {trip.creator.bio && (
              <p className="text-xs text-slate-500 mt-3">{trip.creator.bio}</p>
            )}
          </div>

          {/* Action area */}
          <div className="space-y-3">
            {/* Status message */}
            {actionMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                actionType === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                actionType === 'error'   ? 'bg-red-50 text-red-600 border-red-200' :
                'bg-ocean-50 text-ocean-700 border-ocean-200'
              }`}>
                {actionMsg}
              </div>
            )}

            {/* Not logged in */}
            {!user && (
              <Link to="/login" className="btn-primary w-full text-center block">
                Login to Join
              </Link>
            )}

            {/* Was rejected */}
            {user && !isCreator && !isMember && wasRejected && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium text-center">
                ❌ Your request was rejected by the host
              </div>
            )}

            {/* Can request */}
            {user && !isCreator && !isMember && !hasPendingRequest && !wasRejected && trip.status === 'open' && (
              <div className="card p-5 space-y-3">
                <textarea
                  className="input-field resize-none text-sm"
                  rows={2}
                  placeholder="Optional message to the host..."
                  value={joinMessage}
                  onChange={e => setJoinMessage(e.target.value)}
                />
                <button
                  onClick={handleJoinRequest}
                  disabled={joinLoading}
                  className="btn-primary w-full"
                >
                  {joinLoading ? 'Sending...' : '🙋 Request to Join'}
                </button>
              </div>
            )}

            {/* Pending */}
            {hasPendingRequest && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 font-medium text-center">
                ⏳ Request pending — waiting for host approval
              </div>
            )}

            {/* Member actions */}
            {isMember && !isCreator && (
              <>
                <Link to={`/chat/${trip._id}`} className="btn-primary w-full text-center block">
                  💬 Open Group Chat
                </Link>
                {trip.status === 'open' && (
                  <button onClick={handleCancelMembership} className="btn-danger w-full text-sm">
                    Leave Trip (−15 trust score)
                  </button>
                )}
              </>
            )}

            {/* Creator actions */}
            {isCreator && (
              <div className="space-y-2">
                <Link to={`/chat/${trip._id}`} className="btn-primary w-full text-center block">
                  💬 Group Chat
                </Link>
                {trip.status === 'open' && (
                  <button onClick={handleCompleteTrip} className="btn-secondary w-full text-sm">
                    ✅ Mark as Completed
                  </button>
                )}
                <button onClick={handleDeleteTrip} className="btn-danger w-full text-sm">
                  🗑️ Delete Trip
                </button>
              </div>
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
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="How was traveling with them?"
              value={reviewForm.comment}
              onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
            />
          </div>
          <button onClick={submitReview} className="btn-primary w-full">Submit Review</button>
        </div>
      </Modal>
    </div>
  );
}