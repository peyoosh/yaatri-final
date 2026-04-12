import React from 'react';

const MOCK_DATA = [
  { id: 1, name: "Ghalegaun", loc: "Lamjung", img: "https://images.unsplash.com/photo-1544735716-392fe2489ffa" },
  { id: 2, name: "Upper Mustang", loc: "Mustang", img: "https://images.unsplash.com/photo-1623492701902-47dc207df5dc" },
  { id: 3, name: "Bandipur", loc: "Tanahun", img: "https://images.unsplash.com/photo-1605640840605-14ac1855827b" }
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <h1>Navigate the <br/>Hidden Nepal.</h1>
        <p style={{marginTop: '20px', color: '#666', maxWidth: '500px'}}>
          Yaatri provides curated itineraries and AI-powered advice for explorers seeking authenticity over tourism.
        </p>
      </section>

      <section className="grid">
        {MOCK_DATA.map(dest => (
          <div key={dest.id} className="card">
            <div className="card-img" style={{backgroundImage: `url(${dest.img})`}}></div>
            <div className="card-info">
              <h3>{dest.name}</h3>
              <p>📍 {dest.loc}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}