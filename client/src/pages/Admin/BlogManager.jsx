import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BlogManager({ blogPosts, deletePost }) {
  const navigate = useNavigate();

  return (
    <section className="table-section">
      <h3 className="section-title">Intel Stream Moderation</h3>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>AUTHOR</th>
              <th>CAPTION_EXTRACT</th>
              <th>OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            {blogPosts.map(post => (
              <tr key={post.id}>
                <td>@{post.user}</td>
                <td>{post.caption.substring(0, 50)}...</td>
                <td className="actions-cell">
                  <button onClick={() => navigate(`/admin/users/${post.user_id || 1}`)} className="action-btn info">VIEW_AUTHOR</button>
                  <button onClick={() => deletePost(post.id)} className="action-btn danger">DELETE_STREAM</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}