import React from 'react';

const SkeletonBox = ({ width, height }) => (
  <div className="skeleton-box" style={{ width, height }} />
);

const SkeletonLoader = () => {
  return (
    <>
      <SkeletonBox width="300px" height="30px" />
      <div className="summary-grid" style={{ marginTop: '2.5rem' }}>
        <SkeletonBox width="100%" height="110px" />
        <SkeletonBox width="100%" height="110px" />
        <SkeletonBox width="100%" height="110px" />
      </div>
      <div className="table-section">
        <SkeletonBox width="250px" height="24px" />
        <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
          <SkeletonBox width="100%" height="200px" />
        </div>
      </div>
      <div className="table-section">
        <SkeletonBox width="250px" height="24px" />
        <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
          <SkeletonBox width="100%" height="300px" />
        </div>
      </div>
    </>
  );
};

export default SkeletonLoader;