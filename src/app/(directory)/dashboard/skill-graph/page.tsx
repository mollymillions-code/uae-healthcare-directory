'use client'

import { useState, useCallback, useMemo } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Category =
  | 'research'
  | 'report'
  | 'social'
  | 'video'
  | 'email'
  | 'analytics'
  | 'platform'
  | 'advertising'

interface SkillNode {
  id: string
  label: string
  category: Category
  x: number
  y: number
}

interface Edge {
  from: string
  to: string
}

/* ------------------------------------------------------------------ */
/*  Design Tokens                                                      */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<Category, string> = {
  research: '#3a86ff',
  report: '#7b2cbf',
  social: '#006828',
  video: '#d4a855',
  email: '#e63946',
  analytics: '#2ec4b6',
  platform: '#1a1a1a',
  advertising: '#ff6b35',
}

const CATEGORY_LABELS: Record<Category, string> = {
  research: 'Research',
  report: 'Report',
  social: 'Social',
  video: 'Video',
  email: 'Email',
  analytics: 'Analytics',
  platform: 'Platform',
  advertising: 'Advertising',
}

const NODE_W = 148
const NODE_H = 48
const NODE_RX = 10

/* ------------------------------------------------------------------ */
/*  Node Definitions with Manual Layout                                */
/* ------------------------------------------------------------------ */

const NODES: SkillNode[] = [
  // Row 1 — Research phase (y=60)
  { id: 'research-conductor',         label: 'Research Conductor',    category: 'research',  x: 60,   y: 60 },
  { id: 'deep-researcher',            label: 'Deep Researcher',       category: 'research',  x: 240,  y: 60 },
  { id: 'research-synthesizer',       label: 'Research Synthesizer',  category: 'research',  x: 420,  y: 60 },
  { id: 'research-scorer',            label: 'Research Scorer',       category: 'research',  x: 600,  y: 60 },

  // Row 2 — Report phase (y=170)
  { id: 'report-architect',           label: 'Report Architect',      category: 'report',    x: 60,   y: 170 },
  { id: 'content-writer',             label: 'Content Writer',        category: 'report',    x: 240,  y: 170 },
  { id: 'zavis-creative-director',    label: 'Creative Director',     category: 'platform',  x: 420,  y: 170 },
  { id: 'report-renderer',            label: 'Report Renderer',       category: 'report',    x: 600,  y: 170 },
  { id: 'report-preview-manager',     label: 'Preview Manager',       category: 'report',    x: 780,  y: 170 },
  { id: 'research-publisher',         label: 'Research Publisher',    category: 'report',    x: 960,  y: 170 },

  // Row 3 — Social distribution (y=300)
  { id: 'research-content-extractor', label: 'Content Extractor',     category: 'research',  x: 60,   y: 300 },
  { id: 'social-asset-generator',     label: 'Asset Generator',       category: 'social',    x: 240,  y: 300 },
  { id: 'social-post-composer',       label: 'Post Composer',         category: 'social',    x: 420,  y: 300 },
  { id: 'social-qa-checker',          label: 'QA Checker',            category: 'social',    x: 600,  y: 300 },
  { id: 'social-approval-gate',       label: 'Approval Gate',         category: 'social',    x: 780,  y: 300 },
  { id: 'social-publisher',           label: 'Social Publisher',      category: 'social',    x: 960,  y: 300 },

  // Row 4 — Video branch + Email branch (y=420)
  { id: 'voiceover-script-writer',    label: 'Voiceover Writer',      category: 'video',     x: 240,  y: 420 },
  { id: 'video-producer',             label: 'Video Producer',        category: 'video',     x: 420,  y: 420 },
  { id: 'email-content-composer',     label: 'Email Composer',        category: 'email',     x: 700,  y: 420 },
  { id: 'email-template-designer',    label: 'Email Designer',        category: 'email',     x: 880,  y: 420 },
  { id: 'email-marketer',             label: 'Email Marketer',        category: 'email',     x: 1060, y: 420 },

  // Row 5 — Measurement (y=540)
  { id: 'performance-collector',      label: 'Performance Collector', category: 'analytics', x: 240,  y: 540 },
  { id: 'analytics-reporter',         label: 'Analytics Reporter',    category: 'analytics', x: 420,  y: 540 },

  // Row 6 — Support / satellite skills (y=670, y=740)
  { id: 'zavis-knowledge',            label: 'Knowledge Base',        category: 'platform',     x: 60,   y: 670 },
  { id: 'zavis-designer',             label: 'Zavis Designer',        category: 'platform',     x: 240,  y: 670 },
  { id: 'zavis-master',               label: 'Master Orchestrator',   category: 'platform',     x: 420,  y: 670 },
  { id: 'prompt-composer',            label: 'Prompt Composer',       category: 'video',        x: 600,  y: 670 },
  { id: 'image-creator',              label: 'Image Creator',         category: 'video',        x: 600,  y: 740 },
  { id: 'seo-optimizer',              label: 'SEO Optimizer',         category: 'analytics',    x: 780,  y: 670 },
  { id: 'campaign-planner',           label: 'Campaign Planner',      category: 'advertising',  x: 960,  y: 670 },
  { id: 'social-calendar-manager',    label: 'Calendar Manager',      category: 'social',       x: 60,   y: 740 },
  { id: 'social-content-adapter',     label: 'Content Adapter',       category: 'social',       x: 240,  y: 740 },
  { id: 'social-platform-connector',  label: 'Platform Connector',    category: 'social',       x: 420,  y: 740 },
  { id: 'social-analytics-reporter',  label: 'Social Analytics',      category: 'social',       x: 780,  y: 740 },
  { id: 'ad-manager',                 label: 'Ad Manager',            category: 'advertising',  x: 960,  y: 740 },
  { id: 'ads-optimization-loop',      label: 'Ads Optimization',      category: 'advertising',  x: 1140, y: 740 },
]

/* ------------------------------------------------------------------ */
/*  Edge Definitions                                                   */
/* ------------------------------------------------------------------ */

const EDGES: Edge[] = [
  // Research phase
  { from: 'research-conductor', to: 'deep-researcher' },
  { from: 'deep-researcher', to: 'research-synthesizer' },
  { from: 'research-synthesizer', to: 'research-scorer' },

  // Research → Report
  { from: 'research-synthesizer', to: 'report-architect' },

  // Report phase
  { from: 'report-architect', to: 'content-writer' },
  { from: 'content-writer', to: 'zavis-creative-director' },
  { from: 'zavis-creative-director', to: 'report-renderer' },
  { from: 'report-renderer', to: 'report-preview-manager' },
  { from: 'report-preview-manager', to: 'research-publisher' },

  // Distribution — Social branch
  { from: 'research-publisher', to: 'research-content-extractor' },
  { from: 'research-content-extractor', to: 'social-asset-generator' },
  { from: 'social-asset-generator', to: 'social-post-composer' },
  { from: 'social-post-composer', to: 'social-qa-checker' },
  { from: 'social-qa-checker', to: 'social-approval-gate' },
  { from: 'social-approval-gate', to: 'social-publisher' },

  // Distribution — Video branch
  { from: 'social-asset-generator', to: 'voiceover-script-writer' },
  { from: 'voiceover-script-writer', to: 'video-producer' },
  { from: 'video-producer', to: 'social-publisher' },

  // Distribution — Email branch
  { from: 'research-publisher', to: 'email-content-composer' },
  { from: 'email-content-composer', to: 'email-template-designer' },
  { from: 'email-template-designer', to: 'email-marketer' },

  // Measurement phase
  { from: 'social-publisher', to: 'performance-collector' },
  { from: 'performance-collector', to: 'analytics-reporter' },
  { from: 'analytics-reporter', to: 'research-scorer' },

  // Support skill connections
  { from: 'zavis-knowledge', to: 'content-writer' },
  { from: 'zavis-knowledge', to: 'social-post-composer' },
  { from: 'zavis-knowledge', to: 'email-content-composer' },

  { from: 'zavis-designer', to: 'report-renderer' },
  { from: 'zavis-designer', to: 'social-asset-generator' },
  { from: 'zavis-designer', to: 'email-template-designer' },

  { from: 'zavis-master', to: 'content-writer' },
  { from: 'zavis-master', to: 'social-post-composer' },

  { from: 'prompt-composer', to: 'zavis-creative-director' },
  { from: 'prompt-composer', to: 'image-creator' },

  { from: 'seo-optimizer', to: 'research-publisher' },
  { from: 'seo-optimizer', to: 'social-post-composer' },

  { from: 'campaign-planner', to: 'social-calendar-manager' },
  { from: 'campaign-planner', to: 'ad-manager' },

  { from: 'social-calendar-manager', to: 'social-publisher' },
  { from: 'social-content-adapter', to: 'social-post-composer' },
  { from: 'social-platform-connector', to: 'social-publisher' },
  { from: 'social-analytics-reporter', to: 'performance-collector' },

  { from: 'ad-manager', to: 'ads-optimization-loop' },
  { from: 'ads-optimization-loop', to: 'ad-manager' },
]

/* ------------------------------------------------------------------ */
/*  Derived Data                                                       */
/* ------------------------------------------------------------------ */

const NODE_MAP = new Map(NODES.map(n => [n.id, n]))

// Pre-compute adjacency
function buildAdjacency() {
  const connected = new Map<string, Set<string>>()
  for (const n of NODES) connected.set(n.id, new Set())
  for (const e of EDGES) {
    connected.get(e.from)?.add(e.to)
    connected.get(e.to)?.add(e.from)
  }
  return connected
}

const ADJACENCY = buildAdjacency()

// Stats
const TOTAL_SKILLS = NODES.length
const TOTAL_CONNECTIONS = EDGES.length
// Pipeline depth: longest chain in the main pipeline
const PIPELINE_DEPTH = 15 // research-conductor → ... → social-publisher (main chain)

/* ------------------------------------------------------------------ */
/*  SVG Helpers                                                        */
/* ------------------------------------------------------------------ */

function edgePath(from: SkillNode, to: SkillNode): string {
  const x1 = from.x + NODE_W / 2
  const y1 = from.y + NODE_H / 2
  const x2 = to.x + NODE_W / 2
  const y2 = to.y + NODE_H / 2

  // Determine connection points based on relative position
  let sx: number, sy: number, ex: number, ey: number

  const dx = x2 - x1
  const dy = y2 - y1

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant — connect right edge to left edge
    if (dx > 0) {
      sx = from.x + NODE_W
      sy = from.y + NODE_H / 2
      ex = to.x
      ey = to.y + NODE_H / 2
    } else {
      sx = from.x
      sy = from.y + NODE_H / 2
      ex = to.x + NODE_W
      ey = to.y + NODE_H / 2
    }
  } else {
    // Vertical dominant — connect bottom edge to top edge
    if (dy > 0) {
      sx = from.x + NODE_W / 2
      sy = from.y + NODE_H
      ex = to.x + NODE_W / 2
      ey = to.y
    } else {
      sx = from.x + NODE_W / 2
      sy = from.y
      ex = to.x + NODE_W / 2
      ey = to.y - 0
    }
  }

  // Bezier control points for a smooth curve
  const mx = (sx + ex) / 2
  const my = (sy + ey) / 2

  if (Math.abs(sx - ex) > Math.abs(sy - ey)) {
    // Horizontal: use horizontal bezier
    return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`
  } else {
    // Vertical: use vertical bezier
    return `M ${sx} ${sy} C ${sx} ${my}, ${ex} ${my}, ${ex} ${ey}`
  }
}

function getInputsOutputs(nodeId: string) {
  const inputs: string[] = []
  const outputs: string[] = []
  for (const e of EDGES) {
    if (e.from === nodeId) outputs.push(e.to)
    if (e.to === nodeId) inputs.push(e.from)
  }
  return { inputs, outputs }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SkillGraphPage() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const activeNode = selectedNode ?? hoveredNode

  const connectedSet = useMemo(() => {
    if (!activeNode) return null
    const s = new Set<string>([activeNode])
    const adj = ADJACENCY.get(activeNode)
    if (adj) adj.forEach(id => s.add(id))
    return s
  }, [activeNode])

  const connectedEdges = useMemo(() => {
    if (!activeNode) return null
    const s = new Set<number>()
    EDGES.forEach((e, i) => {
      if (e.from === activeNode || e.to === activeNode) s.add(i)
    })
    return s
  }, [activeNode])

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNode(prev => (prev === id ? null : id))
  }, [])

  const handleBgClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Detail panel data
  const detailNode = selectedNode ? NODE_MAP.get(selectedNode) : null
  const detailIO = selectedNode ? getInputsOutputs(selectedNode) : null

  // SVG viewBox dimensions
  const VB_W = 1300
  const VB_H = 810

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
          Skill Orchestration Graph
        </h1>
        <p style={{ color: '#666', fontSize: 14, margin: '4px 0 0' }}>
          Interactive pipeline map — hover or click any node to trace its connections
        </p>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          display: 'flex',
          gap: 32,
          padding: '20px 24px',
          background: '#ffffff',
          border: '1px solid #e8e3da',
          borderRadius: 8,
          marginBottom: 20,
          marginTop: 20,
        }}
      >
        {[
          { label: 'Total Skills', value: TOTAL_SKILLS },
          { label: 'Active Connections', value: TOTAL_CONNECTIONS },
          { label: 'Pipeline Depth', value: PIPELINE_DEPTH },
        ].map(stat => (
          <div key={stat.label}>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: '#1a1a1a',
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#999',
                marginTop: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 500,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Graph Container */}
      <div
        style={{
          position: 'relative',
          background: '#f5f0e8',
          border: '1px solid #e8e3da',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Legend — top right */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px 14px',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(6px)',
            borderRadius: 6,
            padding: '8px 14px',
            zIndex: 10,
            maxWidth: 380,
          }}
        >
          {(Object.keys(CATEGORY_COLORS) as Category[]).map(cat => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: CATEGORY_COLORS[cat],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>
                {CATEGORY_LABELS[cat]}
              </span>
            </div>
          ))}
        </div>

        {/* Phase labels */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 16,
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Mission Control
          </span>
        </div>

        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onClick={handleBgClick}
        >
          {/* Defs: arrowheads and glow filter */}
          <defs>
            {(Object.keys(CATEGORY_COLORS) as Category[]).map(cat => (
              <marker
                key={cat}
                id={`arrow-${cat}`}
                viewBox="0 0 10 6"
                refX="9"
                refY="3"
                markerWidth="8"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 3 L 0 6 z" fill={CATEGORY_COLORS[cat]} />
              </marker>
            ))}
            <marker
              id="arrow-glow"
              viewBox="0 0 10 6"
              refX="9"
              refY="3"
              markerWidth="8"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 3 L 0 6 z" fill="#006828" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Animated flow dot */}
            <circle id="flow-dot" r="2.5" fill="#006828" />
          </defs>

          {/* Phase region labels in SVG */}
          {[
            { label: 'RESEARCH', y: 46, color: '#3a86ff' },
            { label: 'REPORT', y: 156, color: '#7b2cbf' },
            { label: 'SOCIAL', y: 286, color: '#006828' },
            { label: 'VIDEO / EMAIL', y: 406, color: '#d4a855' },
            { label: 'MEASUREMENT', y: 526, color: '#2ec4b6' },
            { label: 'SUPPORT', y: 656, color: '#999' },
          ].map(phase => (
            <text
              key={phase.label}
              x={VB_W - 12}
              y={phase.y}
              textAnchor="end"
              style={{
                fontSize: 9,
                fontWeight: 700,
                fill: phase.color,
                opacity: 0.5,
                letterSpacing: '0.12em',
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {phase.label}
            </text>
          ))}

          {/* Edges */}
          {EDGES.map((edge, i) => {
            const fromNode = NODE_MAP.get(edge.from)
            const toNode = NODE_MAP.get(edge.to)
            if (!fromNode || !toNode) return null

            const sourceColor = CATEGORY_COLORS[fromNode.category]
            const isHighlighted = connectedEdges?.has(i) ?? false
            const isDimmed = activeNode !== null && !isHighlighted

            const pathD = edgePath(fromNode, toNode)
            const pathId = `edge-${i}`

            return (
              <g key={i}>
                <path
                  id={pathId}
                  d={pathD}
                  fill="none"
                  stroke={isHighlighted ? '#006828' : sourceColor}
                  strokeWidth={isHighlighted ? 2.2 : 1.2}
                  strokeOpacity={isDimmed ? 0.1 : isHighlighted ? 1 : 0.35}
                  markerEnd={
                    isHighlighted
                      ? 'url(#arrow-glow)'
                      : `url(#arrow-${fromNode.category})`
                  }
                  style={{
                    transition: 'stroke-opacity 0.2s ease, stroke-width 0.2s ease',
                    ...(isHighlighted ? { filter: 'url(#glow)' } : {}),
                  }}
                />
                {/* Animated flow dot on highlighted edges */}
                {isHighlighted && (
                  <circle r="3" fill="#006828" opacity="0.8">
                    <animateMotion dur="1.5s" repeatCount="indefinite">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const color = CATEGORY_COLORS[node.category]
            const isActive = activeNode === node.id
            const isConnected = connectedSet?.has(node.id) ?? false
            const isDimmed = activeNode !== null && !isConnected

            return (
              <g
                key={node.id}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                  opacity: isDimmed ? 0.25 : 1,
                }}
                onMouseEnter={() => {
                  if (!selectedNode) setHoveredNode(node.id)
                }}
                onMouseLeave={() => {
                  if (!selectedNode) setHoveredNode(null)
                }}
                onClick={e => {
                  e.stopPropagation()
                  handleNodeClick(node.id)
                }}
              >
                {/* Shadow */}
                <rect
                  x={node.x + 1}
                  y={node.y + 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={NODE_RX}
                  fill="rgba(0,0,0,0.04)"
                />
                {/* Node body */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={NODE_RX}
                  fill="#ffffff"
                  stroke={isActive ? '#006828' : color}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
                    ...(isActive
                      ? {
                          filter: 'drop-shadow(0 0 6px rgba(0,104,40,0.4))',
                        }
                      : {}),
                  }}
                />
                {/* Category indicator dot */}
                <circle
                  cx={node.x + 14}
                  cy={node.y + NODE_H / 2}
                  r={4}
                  fill={color}
                />
                {/* Label */}
                <text
                  x={node.x + 24}
                  y={node.y + NODE_H / 2 + 1}
                  dominantBaseline="central"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    fill: '#1a1a1a',
                    fontFamily: "'DM Sans', sans-serif",
                    pointerEvents: 'none',
                  }}
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Detail Panel — appears when a node is selected */}
        {detailNode && detailIO && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 8,
              border: `2px solid ${CATEGORY_COLORS[detailNode.category]}`,
              padding: '16px 20px',
              maxWidth: 360,
              zIndex: 20,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: CATEGORY_COLORS[detailNode.category],
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                {detailNode.label}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 12,
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {CATEGORY_LABELS[detailNode.category]} &middot; {detailNode.id}
            </div>

            {detailIO.inputs.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                  }}
                >
                  Inputs from
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {detailIO.inputs.map(id => {
                    const n = NODE_MAP.get(id)
                    return (
                      <span
                        key={id}
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: n
                            ? `${CATEGORY_COLORS[n.category]}15`
                            : '#f0f0f0',
                          color: n ? CATEGORY_COLORS[n.category] : '#666',
                          fontWeight: 500,
                        }}
                      >
                        {n?.label ?? id}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {detailIO.outputs.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                  }}
                >
                  Outputs to
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {detailIO.outputs.map(id => {
                    const n = NODE_MAP.get(id)
                    return (
                      <span
                        key={id}
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: n
                            ? `${CATEGORY_COLORS[n.category]}15`
                            : '#f0f0f0',
                          color: n ? CATEGORY_COLORS[n.category] : '#666',
                          fontWeight: 500,
                        }}
                      >
                        {n?.label ?? id}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {detailIO.inputs.length === 0 && detailIO.outputs.length === 0 && (
              <div style={{ fontSize: 12, color: '#999' }}>
                No direct connections
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
