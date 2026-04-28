import React from 'react';
import { Sun, CloudRain, Shirt, ThermometerSnowflake, Mountain } from 'lucide-react';

const WeatherAdviceCard = ({ liveAdvice }) => {
  if (!liveAdvice) return null;

  const { weather, clothingTips, visibilityStatus } = liveAdvice;
  const isCold = weather.temp < 10;
  const isHot = weather.temp > 25;
  const isRain = weather.condition.toLowerCase().includes('rain');

  return (
    <div className="weather-advice-card" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '1.5rem',
      marginTop: '2rem'
    }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1rem', fontSize: '1.2rem' }}>
        Live Environment Advice
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
          {isRain ? <CloudRain size={24} color="#60A5FA" /> : <Sun size={24} color="#FBBF24" />}
          <div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Current Weather</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{weather.temp}°C, {weather.condition}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
          {isCold ? <ThermometerSnowflake size={24} color="#93C5FD" /> : <Shirt size={24} color={isHot ? "#FCA5A5" : "#A7F3D0"} />}
          <div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Clothing Tips</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
              {clothingTips.map((tip, idx) => <li key={idx}>• {tip}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
          <Mountain size={24} color="#C4B5FD" />
          <div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Visibility</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{visibilityStatus}</p>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '4px', fontSize: '0.9rem', fontStyle: 'italic' }}>
        "Sky is {weather.condition.toLowerCase()}! {visibilityStatus === 'High Visibility' ? 'Best time for mountain views.' : 'Standard visibility expected.'} {isCold ? `Wear a jacket - ${weather.temp}°C` : `Comfortable temperature - ${weather.temp}°C`}"
      </div>
    </div>
  );
};

export default WeatherAdviceCard;
