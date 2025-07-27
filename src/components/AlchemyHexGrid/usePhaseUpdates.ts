import { useState, useEffect, useCallback } from 'react';
import { PhaseNode, Connection, Phase, NodeStatus } from './types';
import { api } from '../../utils/api';

interface PhaseUpdate {
  phase: Phase;
  status: NodeStatus;
  processingTime?: number;
  prompt?: string;
  progress?: number;
}

export const usePhaseUpdates = (
  nodes: PhaseNode[],
  connections: Connection[],
  onPhaseChange?: (phase: Phase, update: PhaseUpdate) => void
) => {
  const [updatedNodes, setUpdatedNodes] = useState(nodes);
  const [updatedConnections, setUpdatedConnections] = useState(connections);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll for node status updates
  const pollNodeStatus = useCallback(async () => {
    if (!isProcessing) return;

    try {
      const response = await api.getNodesStatus();
      if (response.success && response.data) {
        const statusData = response.data;
        
        // Update nodes based on API response
        setUpdatedNodes(prevNodes => 
          prevNodes.map(node => {
            const apiNode = statusData.find((s: any) => s.id === node.id);
            if (apiNode) {
              return {
                ...node,
                status: apiNode.status,
                processingTime: apiNode.processingTime,
                promptCount: apiNode.promptCount,
                currentPrompt: apiNode.currentPrompt,
                progress: apiNode.progress
              };
            }
            return node;
          })
        );
      }
    } catch (error) {
      console.error('Failed to fetch node status:', error);
    }
  }, [isProcessing]);

  // Start phase processing
  const startPhaseProcessing = useCallback((sessionId: string) => {
    setIsProcessing(true);
    
    // Simulate phase progression (replace with actual API integration)
    const phases: Phase[] = ['prima-materia', 'solutio', 'coagulatio'];
    let phaseIndex = 0;

    const processNextPhase = () => {
      if (phaseIndex >= phases.length) {
        setIsProcessing(false);
        setCurrentPhase(null);
        
        // Mark output as complete
        setUpdatedNodes(prev => prev.map(node => 
          node.id === 'output' ? { ...node, status: 'complete' } : node
        ));
        
        // Activate final connection
        setUpdatedConnections(prev => prev.map(conn =>
          conn.id === 'coagulatio-output' ? { ...conn, active: true, animated: false } : conn
        ));
        
        return;
      }

      const phase = phases[phaseIndex];
      setCurrentPhase(phase);

      // Update node statuses
      setUpdatedNodes(prev => prev.map(node => {
        if (node.phase === phase) {
          return { ...node, status: 'active', progress: 0 };
        } else if (node.id === 'hub' && phaseIndex === 0) {
          return { ...node, status: 'active' };
        } else if (node.id === 'input' && phaseIndex === 0) {
          return { ...node, status: 'complete' };
        } else if (phaseIndex > 0 && node.phase === phases[phaseIndex - 1]) {
          return { ...node, status: 'complete', progress: 100 };
        }
        return node;
      }));

      // Update connections
      setUpdatedConnections(prev => prev.map(conn => {
        if (
          (phase === 'prima-materia' && (conn.id === 'input-hub' || conn.id === 'hub-prima')) ||
          (phase === 'solutio' && conn.id === 'prima-solutio') ||
          (phase === 'coagulatio' && conn.id === 'solutio-coagulatio')
        ) {
          return { ...conn, active: true, animated: true };
        }
        return conn;
      }));

      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        
        setUpdatedNodes(prev => prev.map(node =>
          node.phase === phase ? { ...node, progress } : node
        ));

        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Mark phase as complete
          setUpdatedNodes(prev => prev.map(node =>
            node.phase === phase ? { ...node, status: 'complete', progress: 100 } : node
          ));

          // Stop animation on connection
          setUpdatedConnections(prev => prev.map(conn => ({
            ...conn,
            animated: false
          })));

          phaseIndex++;
          setTimeout(processNextPhase, 500);
        }
      }, 300);
    };

    // Start with input activation
    setUpdatedNodes(prev => prev.map(node =>
      node.id === 'input' ? { ...node, status: 'active' } : node
    ));

    setTimeout(processNextPhase, 1000);
  }, []);

  // Listen for generation events
  useEffect(() => {
    // This would connect to your actual generation API
    // For now, expose the startPhaseProcessing function
    (window as any).startAlchemyVisualization = startPhaseProcessing;

    return () => {
      delete (window as any).startAlchemyVisualization;
    };
  }, [startPhaseProcessing]);

  // Poll for updates when processing
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(pollNodeStatus, 1000);
    return () => clearInterval(interval);
  }, [isProcessing, pollNodeStatus]);

  return {
    nodes: updatedNodes,
    connections: updatedConnections,
    currentPhase,
    isProcessing,
    startPhaseProcessing
  };
};