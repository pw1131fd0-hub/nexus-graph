export default function HomePage() {
  return (
    <main className="main-container">
      <div className="graph-area">
        <header className="graph-header">
          <h1>NexusGraph</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn-secondary">Sign In</button>
            <button className="btn-primary">Analyze Repo</button>
          </div>
        </header>
        <div className="graph-canvas">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="4" cy="6" r="2"/>
              <circle cx="20" cy="6" r="2"/>
              <circle cx="4" cy="18" r="2"/>
              <circle cx="20" cy="18" r="2"/>
              <line x1="9.5" y1="10.5" x2="5.5" y2="7.5"/>
              <line x1="14.5" y1="10.5" x2="18.5" y2="7.5"/>
              <line x1="9.5" y1="13.5" x2="5.5" y2="16.5"/>
              <line x1="14.5" y1="13.5" x2="18.5" y2="16.5"/>
            </svg>
            <p style={{ marginTop: '1rem', fontSize: '1rem' }}>Enter a GitHub URL to generate knowledge graph</p>
            <input
              type="text"
              className="input-field"
              placeholder="https://github.com/username/repo"
              style={{ marginTop: '1.5rem', maxWidth: '400px' }}
            />
          </div>
        </div>
      </div>
      <aside className="detail-panel">
        <h2>Welcome to NexusGraph</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Paste a GitHub repository URL above to automatically parse code relationships
          and generate an interactive knowledge graph. Click any node to explore
          function calls, imports, and module dependencies.
        </p>
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-title">Quick Start</div>
          <ol style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            paddingLeft: '1.25rem',
            lineHeight: 2
          }}>
            <li>Enter a GitHub URL</li>
            <li>Click &quot;Analyze Repo&quot;</li>
            <li>Explore the interactive graph</li>
          </ol>
        </div>
      </aside>
    </main>
  );
}
