'use client';

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { GraphData, GraphNode } from '@/lib/api';

cytoscape.use(coseBilkent);

interface GraphCanvasProps {
  graphData: GraphData | null;
  onNodeClick: (node: GraphNode) => void;
}

export default function GraphCanvas({ graphData, onNodeClick }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#6366F1',
            label: 'data(label)',
            color: '#F8FAFC',
            'font-size': '11px',
            'text-valign': 'bottom',
            'text-margin-y': 8,
            width: 24,
            height: 24,
          },
        },
        {
          selector: 'node[type="file"]',
          style: {
            'background-color': '#6366F1',
            shape: 'rectangle',
            width: 32,
            height: 20,
          },
        },
        {
          selector: 'node[type="function"]',
          style: {
            'background-color': '#10B981',
            shape: 'ellipse',
            width: 20,
            height: 20,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#F59E0B',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': '#94A3B8',
            'target-arrow-color': '#94A3B8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge[type="CALLS"]',
          style: {
            'line-color': '#10B981',
            'target-arrow-color': '#10B981',
          },
        },
        {
          selector: 'edge[type="IMPORTS"]',
          style: {
            'line-color': '#6366F1',
            'target-arrow-color': '#6366F1',
            'line-style': 'dashed',
          },
        },
      ],
      layout: {
        name: 'cose-bilkent',
        animate: false,
        randomize: false,
        idealEdgeLength: 80,
        nodeRepulsion: 8000,
      },
      minZoom: 0.2,
      maxZoom: 3,
    });

    cyRef.current = cy;

    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      const nodeData = graphData?.nodes.find((n) => n.id === nodeId);
      if (nodeData) {
        onNodeClick(nodeData);
      }
    });

    return () => {
      cy.destroy();
    };
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graphData) return;

    cy.elements().remove();

    const nodes = graphData.nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
      },
    }));

    const edges = graphData.edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      },
    }));

    cy.add([...nodes, ...edges]);

    cy.layout({
      name: 'cose-bilkent',
      animate: true,
      animationDuration: 500,
      randomize: false,
      idealEdgeLength: 80,
      nodeRepulsion: 8000,
    }).run();
  }, [graphData]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--background)',
      }}
    />
  );
}
