import React from 'react';

export default function HotelManager() {
  const transactions = [
    { id: 'TXN-001', hotel: 'Everest View Hotel', user: 'trekker_88', amount: '$450', status: 'Completed', date: '2024-04-10' },
    { id: 'TXN-002', hotel: 'Yeti Mountain Home', user: 'kathmandu_eyes', amount: '$320', status: 'Pending', date: '2024-04-12' }
  ];

  const profileReports = [
    { id: 'REP-001', hotel: 'Everest View Hotel', report: 'Outstanding hospitality, oxygen nodes functional.', rating: '5/5' },
    { id: 'REP-002', hotel: 'Yeti Mountain Home', report: 'Good location, but delayed service.', rating: '3/5' }
  ];

  const safetyConcerns = [
    { id: 'SAF-001', hotel: 'Yeti Mountain Home', severity: 'Low', log: 'Heating failure in sector 4.' }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">HOTEL_PARTNER_HUB</h2>
      </div>

      {/* PROFILE REPORTS */}
      <section className="table-section">
        <h3 className="section-title">Profile Reports</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>REPORT_ID</th>
                <th>HOTEL_NODE</th>
                <th>REPORT_EXTRACT</th>
                <th>RATING</th>
              </tr>
            </thead>
            <tbody>
              {profileReports.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td className="highlight-text">{r.hotel}</td>
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
                <th>HOTEL_NODE</th>
                <th>USER</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td className="highlight-text">{t.hotel}</td>
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
        <h3 className="section-title">Safety Concerns</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>LOG_ID</th>
                <th>HOTEL_NODE</th>
                <th>SEVERITY</th>
                <th>INCIDENT_LOG</th>
              </tr>
            </thead>
            <tbody>
              {safetyConcerns.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td className="highlight-text">{c.hotel}</td>
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