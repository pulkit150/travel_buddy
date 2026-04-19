// src/pages/EditProfilePage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../services/api';

const INTEREST_OPTIONS = ['Hiking', 'Beach', 'Photography', 'Food', 'Culture', 'Adventure', 'Backpacking', 'Luxury', 'Wildlife', 'History', 'Nightlife', 'Road Trip'];

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age || '',
    bio: user?.bio || '',
    interests: user?.interests || [],
    travelPreferences: user?.travelPreferences || { style: 'mid-range', groupSize: 'small' },
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(getImageUrl(user?.profileImage) || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const toggleInterest = (interest) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('age', form.age);
      formData.append('bio', form.bio);
      formData.append('interests', JSON.stringify(form.interests));
      formData.append('travelPreferences', JSON.stringify(form.travelPreferences));
      if (imageFile) formData.append('profileImage', imageFile);

      await api.put('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Profile</h1>

      {success && <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">{success}</div>}
      {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile image */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-ocean-100 flex items-center justify-center">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" alt="preview" />
              ) : (
                <span className="text-3xl font-bold text-ocean-600">{user?.name?.[0]}</span>
              )}
            </div>
            <label className="btn-secondary text-sm cursor-pointer">
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Full Name</label>
              <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Age</label>
              <input type="number" className="input-field" min={18} max={99} value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Bio</label>
            <textarea className="input-field resize-none" rows={3} placeholder="Tell other travelers about yourself..."
              value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          </div>
        </div>

        {/* Interests */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Travel Interests</h2>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(interest => (
              <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  form.interests.includes(interest)
                    ? 'bg-ocean-600 text-white border-ocean-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-ocean-300'
                }`}>
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Travel preferences */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Travel Preferences</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Travel Style</label>
              <select className="input-field" value={form.travelPreferences.style}
                onChange={e => setForm(f => ({ ...f, travelPreferences: { ...f.travelPreferences, style: e.target.value } }))}>
                <option value="budget">Budget</option>
                <option value="mid-range">Mid-range</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Group Size</label>
              <select className="input-field" value={form.travelPreferences.groupSize}
                onChange={e => setForm(f => ({ ...f, travelPreferences: { ...f.travelPreferences, groupSize: e.target.value } }))}>
                <option value="solo">Solo</option>
                <option value="small">Small Group</option>
                <option value="large">Large Group</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}