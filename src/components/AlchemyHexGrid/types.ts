// Types for the Alchemy Hexagonal Grid Visualization

export type Phase = 'prima-materia' | 'solutio' | 'coagulatio';

export type NodeType = 'hub' | 'input' | 'output' | 'phase' | 'process';

export type NodeStatus = 'ready' | 'active' | 'complete' | 'error' | 'inactive';

export interface HexPosition {
  q: number; // Cube coordinate q
  r: number; // Cube coordinate r
  s: number; // Cube coordinate s (q + r + s = 0)
  x: number; // Pixel x position
  y: number; // Pixel y position
}

export interface PhaseNode {
  id: string;
  type: NodeType;
  phase?: Phase;
  label: string;
  status: NodeStatus;
  position: HexPosition;
  
  // Visualization data
  processingTime?: number;
  promptCount?: number;
  currentPrompt?: string;
  progress?: number; // 0-100
  
  // Styling
  color?: string;
  glowIntensity?: number;
}

export interface Connection {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  active: boolean;
  animated: boolean;
  progress?: number; // 0-1 for animation progress
  label?: string;
}

export interface HexGridState {
  nodes: PhaseNode[];
  connections: Connection[];
  activePhase: string | null;
  focusedNode: string | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  animationSpeed: number;
}

export interface AlchemyHexGridProps {
  width?: number;
  height?: number;
  onNodeClick?: (node: PhaseNode) => void;
  onNodeHover?: (node: PhaseNode | null) => void;
  animationSpeed?: number;
  initialZoom?: number;
  enableZoomControls?: boolean;
  enablePan?: boolean;
}

export interface GenerationSession {
  sessionId: string;
  input: string;
  phases: {
    [key in Phase]?: {
      prompt: string;
      processingTime: number;
      status: NodeStatus;
      timestamp: string;
    };
  };
  currentPhase?: Phase;
  completed: boolean;
}

// Animation configuration
export interface AnimationConfig {
  nodeTransition: {
    duration: number;
    ease: string;
  };
  connectionTransition: {
    duration: number;
    ease: string;
  };
  focusTransition: {
    duration: number;
    ease: string;
    scale: number;
  };
  glowAnimation: {
    duration: number;
    ease: string;
  };
}

// Hexagon calculations
export interface HexMetrics {
  size: number; // Radius from center to vertex
  width: number;
  height: number;
  verticalSpacing: number;
  horizontalSpacing: number;
}

// Tooltip data
export interface TooltipData {
  node: PhaseNode;
  position: { x: number; y: number };
  visible: boolean;
}