'use client';

import { useState } from 'react';
import { useGraphStore } from '@/store';
import { graphApi } from '@/lib/api';

export default function RepoInputForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setLoading, setError } = useGraphStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setLoading(true);
    setError(null);

    try {
      const repoPath = url.replace('https://github.com/', '');
      const name = repoPath.split('/').pop() || repoPath;
      const response = await graphApi.getGraph(name);
      console.log('Graph data:', response.data);
    } catch (err) {
      setError('Failed to fetch graph data');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '500px' }}>
      <input
        type="text"
        className="input-field"
        placeholder="https://github.com/username/repo"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ flex: 1 }}
      />
      <button type="submit" className="btn-primary" disabled={isLoading}>
        {isLoading ? 'Analyzing...' : 'Analyze Repo'}
      </button>
    </form>
  );
}
