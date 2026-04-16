import React from 'react';

export default function GuideManager({ safetyConcerns }) {
  const transactions = [
    { id: 'GTX-001', guide: 'Suman Gurung', user: 'trekker_88', amount: '$150', status: 'Completed' },
    { id: 'GTX-002', guide: 'Rita Tamang', user: 'kathmandu_eyes', amount: '$200', status: 'Pending' }
  ];

  const profileReports = [
    { id: 'GREP-001', guide: 'Suman Gurung', report: 'Excellent local knowledge and pacing.', rating: '5/5' }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">USER_GUIDE_MANAGEMENT</h2>
      </div>

      {/* PROFILE REPORTS */}
      <section className="table-section">
        <h3 className="section-title">Profile Reports</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>REPORT_ID</th>
                <th>GUIDE_NODE</th>
                <th>REPORT_EXTRACT</th>
                <th>RATING</th>
              </tr>
            </thead>
            <tbody>
              {profileReports.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td className="highlight-text">{r.guide}</td>
                  <td>{r.report}</td>
                  <td>{r.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* TOTAL TRANSACTIONS */}
      <section className="table-section">
        <h3 className="section-title">Total Transactions</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>TXN_ID</th>
                <th>GUIDE_NODE</th>
                <th>USER</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td className="highlight-text">{t.guide}</td>
                  <td>@{t.user}</td>
                  <td>{t.amount}</td>
                  <td><span className={`severity-tag ${t.status === 'Pending' ? 'high' : 'low'}`}>{t.status.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SAFETY CONCERNS */}
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
    </>
  );
}