import React from 'react';

export default function DestinationManager({
  destinations,
  editingDest,
  setEditingDest,
  deleteDestination,
  saveDestination,
  handleProtocolChange,
  addProtocol
}) {

  const startNewDestination = () => {
    setEditingDest({
      isNew: true,
      rank: '',
      title: '',
      region: '',
      stats: '',
      image: '',
      topographicData: '',
      pathfindingCoordinates: '',
      protocols: []
    });
  };

  if (editingDest) {
    return (
      <div className="destination-editor">
        <h2 className="page-title">{editingDest.isNew ? 'CREATE_NEW_NODE' : `EDITING_NODE: ${editingDest.title}`}</h2>
        <form onSubmit={saveDestination}>
          <div className="form-grid">
            <input type="text" placeholder="Rank (e.g., 04)" value={editingDest.rank} onChange={e => setEditingDest({...editingDest, rank: e.target.value})} required disabled={!editingDest.isNew} />
            <input type="text" placeholder="Title (e.g., Upper Mustang)" value={editingDest.title} onChange={e => setEditingDest({...editingDest, title: e.target.value})} required />
            <input type="text" placeholder="Region (e.g., RESTRICTED_SECTOR)" value={editingDest.region} onChange={e => setEditingDest({...editingDest, region: e.target.value})} />
            <input type="text" placeholder="Stats (e.g., 3,840M | ATMOS: ARID)" value={editingDest.stats} onChange={e => setEditingDest({...editingDest, stats: e.target.value})} />
            <input type="text" placeholder="Image URL" value={editingDest.image} onChange={e => setEditingDest({...editingDest, image: e.target.value})} />
            <input type="text" placeholder="Topographic Data URL" value={editingDest.topographicData} onChange={e => setEditingDest({...editingDest, topographicData: e.target.value})} />
            <input type="text" placeholder="Pathfinding Coordinates (Lat, Lng)" value={editingDest.pathfindingCoordinates} onChange={e => setEditingDest({...editingDest, pathfindingCoordinates: e.target.value})} />
          </div>

          <h3 className="section-title" style={{ marginTop: '2rem' }}>Experience Protocols</h3>
          {editingDest.protocols?.map((proto, index) => (
            <div key={index} className="protocol-editor">
              <input type="text" placeholder="Protocol Title" value={proto.title} onChange={e => handleProtocolChange(index, 'title', e.target.value)} />
              <textarea placeholder="Protocol Description" value={proto.desc} onChange={e => handleProtocolChange(index, 'desc', e.target.value)} />
            </div>
          ))}
          <button type="button" className="action-btn info" onClick={addProtocol}>+ ADD_PROTOCOL</button>

          <div className="form-actions">
            <button type="button" className="action-btn warn" onClick={() => setEditingDest(null)}>CANCEL</button>
            <button type="submit" className="action-btn info">SAVE_NODE</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">DESTINATION_CORE_MANAGEMENT</h2>
        <button className="action-btn info" onClick={startNewDestination}>+ CREATE_NEW_NODE</button>
      </div>

      <section className="table-section">
        <h3 className="section-title">System Destination Nodes</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>TITLE</th>
                <th>REGION</th>
                <th>STATS</th>
                <th>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map(d => (
                <tr key={d.rank}>
                  <td>{d.rank}</td>
                  <td className="highlight-text">{d.title}</td>
                  <td>{d.region}</td>
                  <td>{d.stats}</td>
                  <td className="actions-cell">
                    <button onClick={() => setEditingDest({ ...d, isNew: false })} className="action-btn info">EDIT</button>
                    <button onClick={() => deleteDestination(d.rank)} className="action-btn danger">PURGE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}