import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import ProfileBento from '../../components/ProfileBento';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/users/${id}`);
        setProfileUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <div className="p-8 text-white">Loading profile...</div>;
  if (!profileUser) return <div className="p-8 text-white">User not found.</div>;

  return (
    <div className="p-8 min-h-screen bg-obsidian text-white">
      <button onClick={() => navigate(-1)} className="mb-4 text-toxic-lime hover:underline">
        &larr; Back
      </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-toxic-lime uppercase tracking-wider">{profileUser.username}'s Profile</h1>
        <p className="text-sm opacity-80 mt-2">{profileUser.bio || 'New Explorer'}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-teal-steel/50 border border-toxic-lime/30 rounded-full text-xs font-bold uppercase text-toxic-lime">
          Role: {profileUser.role}
        </span>
      </div>
      <ProfileBento role={profileUser.role} data={{}} />
    </div>
  );
};

export default Profile;
