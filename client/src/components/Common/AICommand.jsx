const AICommand = () => {
  return (
    <div className="ai-interface" style={{
      background: 'rgba(52, 32, 5, 0.8)',
      border: '1px solid var(--hill-green)',
      padding: '20px',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      marginTop: '2rem'
    }}>
      <div style={{ color: 'var(--hill-green)', fontSize: '0.7rem', marginBottom: '10px' }}>
        SYSTEM_PROMPT {'>'} INPUT_DESIRED_TERRAIN
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="e.g. High altitude, low crowd, cultural density..." 
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--terai-harvest)',
            color: 'var(--himalayan-mist)',
            outline: 'none'
          }}
        />
        <button className="btn-small">ANALYZE</button>
      </div>
    </div>
  );
};