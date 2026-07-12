import { useIsMobile } from "@/hooks/use-mobile";
import type { ActiveRoadmapNode } from "./roadmap.data";
import { NODE_HEIGHT, NODE_WIDTH } from "./roadmap.data";

interface Props {
  nodes: ActiveRoadmapNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function generatePath(startX: number, startY: number, endX: number, endY: number) {
  const midY = (startY + endY) / 2;
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
}

function NodeCard({ node, isSelected, onClick }: { node: ActiveRoadmapNode; isSelected: boolean; onClick: () => void; }) {
  const W = NODE_WIDTH;
  const H = NODE_HEIGHT;

  const cfg = {
    completed: { bg: "var(--card)", border: "var(--success)", accentBar: "var(--success)", title: "var(--foreground)", label: "var(--success)", icon: "✓", statusText: "COMPLETED", cursor: "pointer" },
    inProgress: { bg: "var(--card)", border: "var(--info)", accentBar: "var(--info)", title: "var(--foreground)", label: "var(--info)", icon: "▶", statusText: "YOU ARE HERE", cursor: "pointer" },
    pending: { bg: "var(--surface)", border: "var(--border)", accentBar: "var(--border)", title: "var(--muted-foreground)", label: "var(--muted-foreground)", icon: "🔒", statusText: "LOCKED", cursor: "not-allowed" },
  } as const;

  const c = cfg[node.status];
  const isActive = node.status === "inProgress";
  const isPending = node.status === "pending";

  return (
    <g style={{ cursor: c.cursor }} onClick={!isPending ? onClick : undefined}>
      {/* Pulsing halo draws the eye to the single unlocked node */}
      {isActive && (
        <rect x={-7} y={-7} width={W + 14} height={H + 14} rx={13} fill="none" stroke={c.border} strokeWidth={2}>
          <animate attributeName="opacity" values="0.15;0.55;0.15" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="stroke-width" values="1.5;2.5;1.5" dur="2.4s" repeatCount="indefinite" />
        </rect>
      )}
      {isSelected && !isPending && (
        <rect x={-5} y={-5} width={W + 10} height={H + 10} rx={10} fill="none" stroke={c.border} strokeWidth={1.5} opacity={0.35} />
      )}
      <rect x={0} y={0} width={W} height={H} rx={8} fill={c.bg} stroke={c.border} strokeWidth={isSelected ? 1.5 : 0.75} opacity={isPending ? 0.7 : 1} />
      <rect x={0} y={0} width={3} height={H} rx={2} fill={c.accentBar} opacity={isPending ? 0.7 : 1} />

      {/* foreignObject truncates long titles with an ellipsis instead of
          letting SVG <text> spill outside the card boundary */}
      <foreignObject x={16} y={0} width={W - 28} height={H}>
        <div
          // @ts-ignore -- xmlns required for foreignObject content to render correctly
          xmlns="http://www.w3.org/1999/xhtml"
          title={node.curriculumTitle}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 3,
            height: "100%",
            fontFamily: "'Inter', sans-serif",
            opacity: isPending ? 0.7 : 1,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: c.accentBar, flexShrink: 0, lineHeight: 1 }}>{c.icon}</span>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: c.title,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              {node.curriculumTitle}
            </span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: c.label, letterSpacing: 1, marginLeft: 20 }}>
            {c.statusText}
          </span>
        </div>
      </foreignObject>
    </g>
  );
}

function getDynamicPosition(index: number, isMobile: boolean) {
  const VERTICAL_SPACING = 150;
  return { x: index % 2 === 0 ? (isMobile ? 20 : 90) : (isMobile ? 140 : 380), y: index * VERTICAL_SPACING + 50 };
}

export function RoadmapCanvas({ nodes, selectedId, onSelect }: Props) {
  const isMobile = useIsMobile();
  if (nodes.length === 0) return null;

  const lastNodePos = getDynamicPosition(nodes.length - 1, isMobile);
  const canvasH = lastNodePos.y + 150;
  const viewBoxWidth = isMobile ? 360 : 700;

  return (
    <div className="roadmap-canvas-scroll">
      <svg width="100%" viewBox={`0 0 ${viewBoxWidth} ${canvasH}`} style={{ display: "block", minHeight: canvasH }}>
        <defs>
          <pattern id="cgps-grid" width={24} height={24} patternUnits="userSpaceOnUse">
            <circle cx={1} cy={1} r={0.8} fill="var(--border)" />
          </pattern>
        </defs>
        <rect width={viewBoxWidth} height={canvasH} fill="url(#cgps-grid)" />

        {nodes.map((node, i) => {
          if (i === nodes.length - 1) return null;
          const posA = getDynamicPosition(i, isMobile);
          const posB = getDynamicPosition(i + 1, isMobile);
          const isDone = node.status === "completed";
          // The segment leading INTO the currently unlocked node gets an
          // animated "flowing" dash so it visually reads as "walk this way".
          const leadsToActive = nodes[i + 1]?.status === "inProgress";
          return (
            <path
              key={`path-${i}`}
              d={generatePath(posA.x + NODE_WIDTH / 2, posA.y + NODE_HEIGHT, posB.x + NODE_WIDTH / 2, posB.y)}
              fill="none"
              stroke={isDone ? "var(--success)" : leadsToActive ? "var(--info)" : "var(--foreground)"}
              strokeWidth={isDone ? 2 : leadsToActive ? 2 : 1.5}
              strokeDasharray={isDone ? "none" : "6 6"}
              opacity={isDone ? 1 : leadsToActive ? 0.8 : 0.4}
            >
              {!isDone && (
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.6s" repeatCount="indefinite" />
              )}
            </path>
          );
        })}

        {nodes.map((node, i) => (
          <g key={node.nodeId} transform={`translate(${getDynamicPosition(i, isMobile).x}, ${getDynamicPosition(i, isMobile).y})`}>
            <NodeCard node={node} isSelected={node.nodeId === selectedId} onClick={() => onSelect(node.nodeId)} />
          </g>
        ))}

        <text x={lastNodePos.x + NODE_WIDTH / 2} y={lastNodePos.y + NODE_HEIGHT + 60} textAnchor="middle" fontSize={26}>
          🏁
        </text>
      </svg>
    </div>
  );
}
