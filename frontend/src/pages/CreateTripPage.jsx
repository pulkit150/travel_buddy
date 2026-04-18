// src/pages/CreateTripPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TAG_OPTIONS = ['Beach', 'Mountain', 'City', 'Adventure', 'Cultural', 'Food', 'Wildlife', 'Road Trip', 'Backpacking', 'Luxury'];

export default function CreateTripPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    destination: '', description: '', startDate: '', endDate: '',
    budget: '', maxMembers: '5', tags: [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      setError('End date must be after start date'); return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        formData.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
      });
      if (imageFile) formData.append('image', imageFile);

      const res = await api.post('/trips', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/trips/${res.data.trip._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Create a Trip ✈️</h1>
      <p className="text-slate-500 text-sm mb-6">Share your travel plans and find the perfect companions.</p>

      {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Destination */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Trip Details</h2>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Destination *</label>
            <input className="input-field" placeholder="e.g. Manali, Himachal Pradesh" value={form.destination}
              onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Description *</label>
            <textarea className="input-field resize-none" rows={4} placeholder="Describe your trip plan, what to expect, activities..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
        </div>

        {/* Dates + Budget */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Dates & Budget</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Start Date *</label>
              <input type="date" className="input-field" value={form.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">End Date *</label>
              <input type="date" className="input-field" value={form.endDate}
                min={form.startDate || new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Budget per person (₹) *</label>
              <input type="number" className="input-field" placeholder="e.g. 15000" min={0} value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Max Members *</label>
              <input type="number" className="input-field" min={2} max={20} value={form.maxMembers}
                onChange={e => setForm(f => ({ ...f, maxMembers: e.target.value }))} required />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-700 mb-3">Trip Tags</h2>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(tag => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  form.tags.includes(tag) ? 'bg-ocean-600 text-white border-ocean-600' : 'bg-white text-slate-600 border-slate-200 hover:border-ocean-300'
                }`}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Image upload */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-700 mb-3">Trip Photo</h2>
          {preview && <img src={preview} alt="preview" className="w-full h-48 object-cover rounded-xl mb-3" />}
          <label className="btn-secondary text-sm cursor-pointer inline-block">
            📷 Upload Destination Photo
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
          {loading ? 'Creating trip...' : '🚀 Create Trip'}
        </button>
      </form>
    </div>
  );
}
