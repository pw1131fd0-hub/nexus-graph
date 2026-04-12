'use client';

import { GraphNode } from '@/lib/api';

interface NodeDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

export default function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  if (!node) {
    return (
      <aside className="detail-panel">
        <h2>Node Details</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Click on a node in the graph to view its details.
        </p>
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Node Details</h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '1.25rem',
          }}
        >
          ×
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: node.type === 'file' ? 'var(--primary)' : 'var(--secondary)',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {node.type}
          </span>
        </div>
        <div className="card-title">{node.label}</div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
          {node.filePath}
        </p>
      </div>

      <div className="card">
        <div className="card-title">Description</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {node.description || 'No description available.'}
        </p>
      </div>

      <div className="card">
        <div className="card-title">Metrics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
          <div>
            <div className="card-metric" style={{ fontSize: '1.25rem' }}>
              {node.metrics.linesOfCode}
            </div>
            <div className="card-label">Lines of Code</div>
          </div>
          <div>
            <div className="card-metric" style={{ fontSize: '1.25rem' }}>
              {node.metrics.functionCount}
            </div>
            <div className="card-label">Functions</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button className="btn-primary" style={{ flex: 1 }}>
          View Code
        </button>
        <button className="btn-secondary" style={{ flex: 1 }}>
          Add Note
        </button>
      </div>
    </aside>
  );
}
