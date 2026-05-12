import React from 'react';

export default function BlogManager({ blogList, updateBlogStatus, deleteBlog, loading = false }) {

  const getStatusClass = (status) => {
    switch (status) {
      case 'published': return 'status-published';
      case 'pending': return 'status-pending';
      case 'reported': return 'status-reported';
      case 'flagged': return 'status-flagged';
      default: return '';
    }
  };

  // Loading skeleton component for table rows
  const TableRowSkeleton = () => (
    <tr>
      <td className="highlight-text"><div className="h-4 bg-gray-600 rounded animate-pulse w-32"></div></td>
      <td><div className="h-4 bg-gray-600 rounded animate-pulse w-24"></div></td>
      <td><div className="h-6 bg-gray-600 rounded animate-pulse w-20"></div></td>
      <td className="actions-cell">
        <div className="h-8 bg-gray-600 rounded animate-pulse w-16"></div>
        <div className="h-8 bg-gray-600 rounded animate-pulse w-16"></div>
        <div className="h-8 bg-gray-600 rounded animate-pulse w-16"></div>
      </td>
    </tr>
  );

  return (
    <>
      <h2 className="page-title" style={{ fontFamily: "'Poppins', sans-serif" }}>BLOG_CONTENT_ORBIT</h2>
      
      <section className="table-section">
        <h3 className="section-title">Blog Post Registry</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>TITLE</th>
                <th>AUTHOR</th>
                <th>STATUS</th>
                <th>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Show loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRowSkeleton key={`skeleton-${index}`} />
                ))
              ) : blogList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-400">
                    No blogs found
                  </td>
                </tr>
              ) : (
                blogList.map(blog => {
                  const blogId = blog._id;
                  
                  return (
                  <tr key={blogId}>
                    <td className="highlight-text">{blog.title || 'Untitled'}</td>
                    <td>{blog.authorId?.username || 'Unknown Author'}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(blog.status)}`}>
                        {blog.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {blog.status === 'pending' && (
                        <button 
                          onClick={() => updateBlogStatus(blogId, 'published')} 
                          className="action-btn success"
                        >
                          APPROVE
                        </button>
                      )}
                      <button 
                        onClick={() => updateBlogStatus(blogId, 'flagged')} 
                        className="action-btn warn"
                      >
                        FLAG
                      </button>
                      <button 
                        onClick={() => deleteBlog(blogId)} 
                        className="action-btn danger"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}