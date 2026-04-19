// src/components/TripCard.jsx - Card shown in trip feed
import { Link } from 'react-router-dom';
import TrustBadge from './TrustBadge';
import { getImageUrl } from '../services/api';


export default function TripCard({ trip }) {
  const { _id, destination, description, startDate, endDate, budget, maxMembers, members, image, creator, status } = trip;

  const spotsLeft = maxMembers - members.length;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Link to={`/trips/${_id}`} className="card block hover:shadow-md transition-shadow duration-200 group animate-slide-up">
      {/* Trip image */}
      <div className="relative h-44 bg-gradient-to-br from-ocean-400 to-ocean-700 overflow-hidden">
        {image ? (
          <img src={image} alt={destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center h-full text-white text-5xl">🏖️</div>
        )}
        {/* Status badge */}
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
          status === 'open' ? 'bg-green-500 text-white' :
          status === 'full' ? 'bg-orange-500 text-white' :
          status === 'completed' ? 'bg-slate-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {status === 'open' ? `${spotsLeft} spots left` : status}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-slate-800 truncate">📍 {destination}</h3>
        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{description}</p>

        {/* Dates */}
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
          <span>📅 {formatDate(startDate)} → {formatDate(endDate)}</span>
        </div>

        {/* Budget + members */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-ocean-700 font-semibold text-sm">₹{budget?.toLocaleString()} budget</span>
          <span className="text-slate-500 text-xs">{members.length}/{maxMembers} members</span>
        </div>

        {/* Creator */}
        {creator && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            {creator.profileImage ? (
              <img src={getImageUrl(creator.profileImage)} className="w-7 h-7 rounded-full object-cover" alt={creator.name} />
            ) : (
              <div className="w-7 h-7 rounded-full bg-ocean-100 flex items-center justify-center text-xs font-bold text-ocean-700">
                {creator.name?.[0]}
              </div>
            )}
            <span className="text-xs text-slate-600 font-medium">{creator.name}</span>
            <TrustBadge score={creator.trustScore} small />
          </div>
        )}
      </div>
    </Link>
  );
}
