import React from 'react';

const ProfileBento = ({ role, data }) => {
  const baseCardStyle = "bg-teal-steel/50 border border-toxic-lime/20 rounded-xl p-6 flex flex-col backdrop-blur-sm shadow-lg";

  if (role === 'guide') {
    return (
      <div className="grid grid-cols-4 grid-rows-2 gap-6 min-h-[400px] w-full">
        <div className={`col-span-4 md:col-span-2 row-span-2 ${baseCardStyle}`}>
          <h3 className="text-toxic-lime font-bold text-lg mb-4 tracking-wider uppercase">Experience Details</h3>
          <div className="flex-1 text-sm opacity-80 text-white">
            {data?.experience || "Loading guide experience modules..."}
          </div>
        </div>
        <div className={`col-span-4 md:col-span-2 row-span-1 ${baseCardStyle}`}>
          <h3 className="text-toxic-lime font-bold text-lg mb-4 tracking-wider uppercase">Recent Blogs</h3>
          <div className="flex-1 text-sm opacity-80 text-white">
            {data?.blogs || "Scanning recent transmissions..."}
          </div>
        </div>
        <div className={`col-span-4 md:col-span-2 row-span-1 ${baseCardStyle}`}>
          <h3 className="text-toxic-lime font-bold text-lg mb-4 tracking-wider uppercase">Contact Info</h3>
          <div className="flex-1 text-sm opacity-80 text-white">
            {data?.contact || "Awaiting signal connection..."}
          </div>
        </div>
      </div>
    );
  }

  if (role === 'owner') {
    return (
      <div className="grid grid-cols-4 grid-rows-2 gap-6 min-h-[400px] w-full">
        <div className={`col-span-4 md:col-span-2 row-span-2 ${baseCardStyle}`}>
          <h3 className="text-toxic-lime font-bold text-lg mb-4 tracking-wider uppercase">Hotel Stats</h3>
          <div className="flex-1 text-sm opacity-80 text-white">
            {data?.stats || "Calculating property analytics..."}
          </div>
        </div>
        <div className={`col-span-4 md:col-span-2 row-span-1 ${baseCardStyle}`}>
          <h3 className="text-toxic-lime font-bold text-lg mb-4 tracking-wider uppercase">Current Availability</h3>
          <div className="flex-1 text-sm opacity-80 text-white">
            {data?.availability || "Fetching live inventory..."}
          </div>
        </div>
        <div className={`col-span-4 md:col-span-2 row-span-1 ${baseCardStyle}`}>
          <h3 className="text-toxic-lime font-bold text-lg mb-4 tracking-wider uppercase">Active Bookings</h3>
          <div className="flex-1 text-sm opacity-80 text-white">
            {data?.bookings || "No active booking streams..."}
          </div>
        </div>
      </div>
    );
  }

  // Default to User
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-6 min-h-[400px] w-full">
      <div className={`col-span-4 md:col-span-2 row-span-2 ${baseCardStyle}`}>
        <h3 className="text-toxic-lime font-bold text-lg mb-4 tracking-wider uppercase">Saved Destinations</h3>
        <div className="flex-1 text-sm opacity-80 text-white">
          {data?.destinations || "No synchronized locations..."}
        </div>
      </div>
      <div className={`col-span-4 md:col-span-2 row-span-1 ${baseCardStyle}`}>
        <h3 className="text-toxic-lime font-bold text-lg mb-4 tracking-wider uppercase">Liked Blogs</h3>
        <div className="flex-1 text-sm opacity-80 text-white">
          {data?.likedBlogs || "Scanning favorite transmissions..."}
        </div>
      </div>
      <div className={`col-span-4 md:col-span-2 row-span-1 ${baseCardStyle}`}>
        <h3 className="text-toxic-lime font-bold text-lg mb-4 tracking-wider uppercase">Travel Stats</h3>
        <div className="flex-1 text-sm opacity-80 text-white">
          {data?.travelStats || "Compiling movement data..."}
        </div>
      </div>
    </div>
  );
};

export default ProfileBento;
