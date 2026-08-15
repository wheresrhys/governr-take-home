export type Severity = "LOW" | "MODERATE" | "HIGH";

type SeverityStyle = {
  label: string;
  badgeClassName: string;
};

type ColorBucket = "yellow" | "orange" | "red";

const bucketStyles: Record<ColorBucket, string> = {
  yellow:
    "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  orange:
    "bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-600/20",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

const severityBuckets: Record<Severity, { label: string; bucket: ColorBucket }> = {
  LOW: { label: "Low", bucket: "yellow" },
  MODERATE: { label: "Moderate", bucket: "orange" },
  HIGH: { label: "High", bucket: "red" },
};

export function severityColor(severity: Severity): SeverityStyle {
  const { label, bucket } = severityBuckets[severity];
  return { label, badgeClassName: bucketStyles[bucket] };
}

export function scoreColor(score: number): SeverityStyle {
  if (score >= 100) {
    return { label: "High", badgeClassName: bucketStyles.red };
  }
  if (score >= 10) {
    return { label: "Moderate", badgeClassName: bucketStyles.orange };
  }
  return { label: "Low", badgeClassName: bucketStyles.yellow };
}
