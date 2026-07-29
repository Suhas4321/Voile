/* ============================================================
 * SkeletonKeypoints — simulated DWPose pose-detection wireframe
 * overlay. Renders glowing keypoint dots and connecting lines
 * on top of a model photo to visualize pose detection.
 * ============================================================ */

interface SkeletonKeypointsProps {
  className?: string;
}

// Keypoint positions as percentages of the photo area (simulated).
const POINTS: { id: string; x: number; y: number }[] = [
  { id: 'head', x: 50, y: 12 },
  { id: 'neck', x: 50, y: 22 },
  { id: 'lshoulder', x: 38, y: 27 },
  { id: 'rshoulder', x: 62, y: 27 },
  { id: 'lelbow', x: 32, y: 44 },
  { id: 'relbow', x: 68, y: 44 },
  { id: 'lwrist', x: 30, y: 60 },
  { id: 'rwrist', x: 70, y: 60 },
  { id: 'hip', x: 50, y: 52 },
  { id: 'lhip', x: 43, y: 53 },
  { id: 'rhip', x: 57, y: 53 },
  { id: 'lknee', x: 44, y: 74 },
  { id: 'rknee', x: 56, y: 74 },
  { id: 'lankle', x: 45, y: 92 },
  { id: 'rankle', x: 55, y: 92 },
];

// Bone connections (pairs of point ids).
const BONES: [string, string][] = [
  ['head', 'neck'],
  ['neck', 'lshoulder'],
  ['neck', 'rshoulder'],
  ['lshoulder', 'lelbow'],
  ['lelbow', 'lwrist'],
  ['rshoulder', 'relbow'],
  ['relbow', 'rwrist'],
  ['neck', 'hip'],
  ['hip', 'lhip'],
  ['hip', 'rhip'],
  ['lhip', 'lknee'],
  ['lknee', 'lankle'],
  ['rhip', 'rknee'],
  ['rknee', 'rankle'],
  ['lshoulder', 'rshoulder'],
  ['lhip', 'rhip'],
];

function pt(id: string) {
  return POINTS.find((p) => p.id === id)!;
}

export function SkeletonKeypoints({ className = '' }: SkeletonKeypointsProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    >
      {/* Bone lines */}
      {BONES.map(([a, b], i) => {
        const pa = pt(a);
        const pb = pt(b);
        return (
          <line
            key={i}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke="rgba(0,242,254,0.65)"
            strokeWidth={0.55}
            strokeLinecap="round"
          />
        );
      })}
      {/* Keypoint dots */}
      {POINTS.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={1.1}
          fill="#00F2FE"
          className="animate-skeleton-pulse"
          style={{ animationDelay: `${(p.x + p.y) % 10 * 0.12}s` }}
        />
      ))}
    </svg>
  );
}
