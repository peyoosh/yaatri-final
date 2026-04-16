import React from 'react';

export default function GuideManager({ safetyConcerns }) {
  return (
    <section className="table-section">
      <h3 className="section-title">Guide Safety Concerns</h3>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>GUIDE_NAME</th>
              <th>REGION</th>
              <th>SEVERITY</th>
              <th>INCIDENT_LOG</th>
            </tr>
          </thead>
          <tbody>
            {safetyConcerns.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.region}</td>
                <td><span className={`severity-tag ${c.severity.toLowerCase()}`}>{c.severity}</span></td>
                <td>{c.log}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}