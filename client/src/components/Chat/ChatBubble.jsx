import React, { useState } from 'react';
import ChatWindow from './ChatWindow';

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <ChatWindow />}
      <button 
        onClick={() => setOpen(!open)}
        style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', background: '#000', color: '#fff', fontSize: '24px', cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
      >
        {open ? '×' : '💬'}
      </button>
    </>
  );
}