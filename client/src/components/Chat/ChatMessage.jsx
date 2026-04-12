export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  return (
    <div style={{
      textAlign: isUser ? 'right' : 'left',
      margin: '10px 0'
    }}>
      <span style={{
        background: isUser ? '#007bff' : '#f1f1f1',
        color: isUser ? '#white' : '#black',
        padding: '8px 12px',
        borderRadius: '15px',
        display: 'inline-block'
      }}>
        {message.text}
      </span>
    </div>
  );
}