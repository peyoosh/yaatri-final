import React, { useState } from 'react';

export default function ChatWindow() {
  const [messages, setMessages] = useState([{ text: "Namaste. How can I assist your journey?", sender: 'ai' }]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if(!input.trim()) return;
    setMessages([...messages, { text: input, sender: 'user' }]);
    setInput('');
    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "Analyzing routes for " + input + "...", sender: 'ai' }]);
    }, 800);
  };

  return (
    <div style={{ width: '350px', height: '500px', background: '#fff', border: '2px solid #000', borderRadius: '4px', position: 'fixed', bottom: '100px', right: '30px', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
      <div style={{ background: '#000', color: '#fff', padding: '15px', fontWeight: 'bold' }}>YAATRI AI v1.0</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === 'user' ? 'right' : 'left', margin: '10px 0' }}>
            <span style={{ background: m.sender === 'user' ? '#000' : '#f0f0f0', color: m.sender === 'user' ? '#fff' : '#000', padding: '8px 12px', fontSize: '14px' }}>
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex' }}>
        <input style={{ flex: 1, border: 'none', outline: 'none' }} placeholder="Type your query..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} />
        <button onClick={handleSend} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>SEND</button>
      </div>
    </div>
  );
}