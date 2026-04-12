import { Router, Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

interface GraphNode {
  id: string;
  type: 'file' | 'function';
  label: string;
  filePath: string;
  description: string;
  metrics: {
    linesOfCode: number;
    functionCount: number;
    callCount?: number;
  };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'CALLS' | 'IMPORTS' | 'CONTAINS';
}

const mockGraphData: Record<string, { nodes: GraphNode[]; edges: GraphEdge[] }> = {
  'react': {
    nodes: [
      { id: 'node_1', type: 'file', label: 'index.js', filePath: 'src/index.js', description: 'Main entry point', metrics: { linesOfCode: 45, functionCount: 3 } },
      { id: 'node_2', type: 'function', label: 'renderApp', filePath: 'src/index.js', description: 'Renders main component', metrics: { linesOfCode: 12, functionCount: 1, callCount: 5 } },
      { id: 'node_3', type: 'file', label: 'App.js', filePath: 'src/App.js', description: 'Main App component', metrics: { linesOfCode: 120, functionCount: 8 } },
    ],
    edges: [
      { id: 'edge_1', source: 'node_1', target: 'node_2', type: 'CALLS' },
      { id: 'edge_2', source: 'node_2', target: 'node_3', type: 'CALLS' },
    ],
  },
};

router.get('/:repoId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId } = req.params;
    const graphData = mockGraphData[repoId];

    if (!graphData) {
      res.json({ nodes: [], edges: [] });
      return;
    }

    res.json(graphData);
  } catch (err) {
    next(err);
  }
});

router.get('/:repoId/nodes/:nodeId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId, nodeId } = req.params;
    const graphData = mockGraphData[repoId];

    if (!graphData) {
      throw createError('Repository not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const node = graphData.nodes.find((n) => n.id === nodeId);
    if (!node) {
      throw createError('Node not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const calledBy = graphData.edges
      .filter((e) => e.target === nodeId)
      .map((e) => e.source);

    const calls = graphData.edges
      .filter((e) => e.source === nodeId)
      .map((e) => e.target);

    res.json({
      ...node,
      calledBy,
      calls,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:repoId/search', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId } = req.params;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw createError('Search query is required', 400, 'VALIDATION_ERROR');
    }

    const graphData = mockGraphData[repoId];
    if (!graphData) {
      res.json({ results: [] });
      return;
    }

    const results = graphData.nodes
      .filter((n) => n.label.toLowerCase().includes(q.toLowerCase()))
      .map((n) => ({ ...n, score: 0.9 }));

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
