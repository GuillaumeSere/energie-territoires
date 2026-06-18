type EnergyKpiCardProps = {
  label: string;
  value: string;
  detail: string;
  trend?: string;
  tone?: "green" | "blue" | "amber" | "dark";
};

export function EnergyKpiCard({ label, value, detail, trend, tone = "green" }: EnergyKpiCardProps) {
  return (
    <article className={`kpi-card kpi-${tone}`}>
      <div>
        <p className="kpi-label">{label}</p>
        <strong>{value}</strong>
      </div>
      <p>{detail}</p>
      {trend ? <span>{trend}</span> : null}
    </article>
  );
}
