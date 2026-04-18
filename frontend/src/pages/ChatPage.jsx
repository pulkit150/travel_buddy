// src/pages/ChatPage.jsx - Real-time group chat for a trip
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export default function ChatPage() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [trip, setTrip] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch trip info and message history
        const [tripRes, msgRes] = await Promise.all([
          api.get(`/trips/${tripId}`),
          api.get(`/messages/${tripId}`),
        ]);
        setTrip(tripRes.data);
        // Format existing messages to match socket message shape
        setMessages(msgRes.data.map(m => ({
          _id: m._id,
          text: m.text,
          senderId: m.sender._id,
          senderName: m.sender.name,
          senderImage: m.sender.profileImage,
          createdAt: m.createdAt,
        })));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    init();
  }, [tripId]);

  useEffect(() => {
    if (!socket) return;
    // Join the trip's socket room
    socket.emit('join_room', { tripId, userId: user._id });

    // Listen for incoming messages
    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('receive_message');
      socket.emit('leave_room', { tripId });
    };
  }, [socket, tripId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;
    socket.emit('send_message', {
      tripId,
      senderId: user._id,
      senderName: user.name,
      senderImage: user.profileImage,
      text: text.trim(),
    });
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const formatDateDivider = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Chat header */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        {trip?.image ? (
          <img src={trip.image} className="w-12 h-12 rounded-xl object-cover" alt={trip.destination} />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-ocean-100 flex items-center justify-center text-xl">🏖️</div>
        )}
        <div className="flex-1">
          <h1 className="font-bold text-slate-800">📍 {trip?.destination}</h1>
          <p className="text-xs text-slate-500">{trip?.members.length} members · Group Chat</p>
        </div>
        <Link to={`/trips/${tripId}`} className="btn-secondary text-xs py-1.5 px-3">View Trip</Link>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-1 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm">No messages yet. Say hello to your travel buddies!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isOwn = msg.senderId === user._id;
          const prevMsg = messages[idx - 1];
          // Show date divider if this is a new day
          const showDate = !prevMsg || formatDateDivider(msg.createdAt) !== formatDateDivider(prevMsg.createdAt);
          // Group consecutive messages from same sender
          const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || showDate;

          return (
            <div key={msg._id || idx} className="chat-bubble">
              {showDate && (
                <div className="text-center my-4">
                  <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{formatDateDivider(msg.createdAt)}</span>
                </div>
              )}

              <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
                {/* Avatar */}
                {!isOwn && (
                  showAvatar ? (
                    msg.senderImage ? (
                      <img src={msg.senderImage} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={msg.senderName} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-ocean-100 flex items-center justify-center text-xs font-bold text-ocean-700 flex-shrink-0">{msg.senderName?.[0]}</div>
                    )
                  ) : <div className="w-8 flex-shrink-0" />
                )}

                {/* Bubble */}
                <div className={`max-w-xs md:max-w-sm ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isOwn && showAvatar && (
                    <p className="text-xs text-slate-400 font-medium mb-1 ml-1">{msg.senderName}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isOwn
                      ? 'bg-ocean-600 text-white rounded-br-sm'
                      : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 mx-1">{formatTime(msg.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="card p-3 flex items-end gap-3">
        <textarea
          className="flex-1 resize-none text-sm border-0 outline-none focus:outline-none bg-transparent p-1 max-h-24"
          placeholder="Type a message... (Enter to send)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ lineHeight: '1.5' }}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-ocean-600 hover:bg-ocean-700 disabled:opacity-40 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
