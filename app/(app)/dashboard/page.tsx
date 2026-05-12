import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STAGES, STAGE_COLORS } from "@/lib/pipeline";
import { formatCLP, daysSince } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getMesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMesLabel(mes: string) {
  const [y, m] = mes.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

function scoreColor(pct: number) {
  if (pct >= 100) return "#16a34a";
  if (pct >= 70) return "#4548FF";
  if (pct >= 40) return "#f97316";
  return "#ef4444";
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const mes = getMesActual();
  const [year, month] = mes.split("-").map(Number);
  const mesStart = new Date(year, month - 1, 1);
  const mesEnd = new Date(year, month, 1);

  const [allDeals, myDeals, okrs, metas] = await Promise.all([
    prisma.deal.findMany({
      include: { propietario: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.deal.findMany({
      where: { propietarioId: userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.oKR.findMany({
      where: { activo: true },
      include: { keyResults: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.metaMensual.findMany({ where: { mes } }),
  ]);

  // KPI calcs
  const activeDeals = allDeals.filter((d) => d.etapa !== "Cierre Ganado" && d.etapa !== "Cliente no califica");
  const totalPipeline = activeDeals.reduce((s, d) => s + (d.monto || 0), 0);
  const staleDeals = allDeals.filter((d) => daysSince(d.updatedAt) >= 7 && d.etapa !== "Cierre Ganado");
  const wonDeals = allDeals.filter((d) => d.etapa === "Cierre Ganado");
  const wonValue = wonDeals.reduce((s, d) => s + (d.monto || 0), 0);

  const byStage = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: allDeals.filter((d) => d.etapa === stage.id).length,
  }));

  // Actuals del mes
  const cierresMes = allDeals.filter((d) => {
    if (d.etapa !== "Cierre Ganado") return false;
    const fecha = d.fechaCierre || d.updatedAt;
    return fecha >= mesStart && fecha < mesEnd;
  });
  const reunionesMes = allDeals.filter((d) => d.fechaReunion && d.fechaReunion >= mesStart && d.fechaReunion < mesEnd);

  // All BDs: union of BDs in deals + BDs in metas
  const bdsFromDeals = [...new Set(allDeals.map((d) => d.businessDeveloper).filter(Boolean))] as string[];
  const bdsFromMetas = [...new Set(metas.filter((m) => m.assignee !== "equipo").map((m) => m.assignee))];
  const allBDs = [...new Set([...bdsFromDeals, ...bdsFromMetas])].sort();

  const metasByKey: Record<string, number> = {};
  metas.forEach((m) => { metasByKey[`${m.tipo}-${m.assignee}`] = m.objetivo; });

  // Build leaderboard rows
  const bdRows = allBDs.map((bd) => {
    const cierresActual = cierresMes.filter((d) => d.businessDeveloper === bd).length;
    const reunionesActual = reunionesMes.filter((d) => d.businessDeveloper === bd).length;
    const cierresMeta = metasByKey[`cierres-${bd}`] ?? 0;
    const reunionesMeta = metasByKey[`reuniones-${bd}`] ?? 0;
    const cierresPct = cierresMeta > 0 ? Math.min((cierresActual / cierresMeta) * 100, 100) : null;
    const reunionesPct = reunionesMeta > 0 ? Math.min((reunionesActual / reunionesMeta) * 100, 100) : null;
    const avgPct = [cierresPct, reunionesPct].filter((v) => v !== null) as number[];
    const score = avgPct.length > 0 ? avgPct.reduce((a, b) => a + b, 0) / avgPct.length : null;
    return { bd, cierresActual, reunionesActual, cierresMeta, reunionesMeta, cierresPct, reunionesPct, score };
  });

  // Sort: those with metas first (by score desc), then rest
  bdRows.sort((a, b) => {
    if (a.score !== null && b.score !== null) return b.score - a.score;
    if (a.score !== null) return -1;
    if (b.score !== null) return 1;
    return a.bd.localeCompare(b.bd);
  });

  // Team totals
  const teamCierresMeta = metasByKey["cierres-equipo"] ?? 0;
  const teamReunionesMeta = metasByKey["reuniones-equipo"] ?? 0;
  const teamCierresPct = teamCierresMeta > 0 ? Math.min((cierresMes.length / teamCierresMeta) * 100, 100) : null;
  const teamReunionesPct = teamReunionesMeta > 0 ? Math.min((reunionesMes.length / teamReunionesMeta) * 100, 100) : null;

  const hasMetas = metas.length > 0;

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: "#121755", textTransform: "uppercase", letterSpacing: "0.03em", margin: 0 }}>
          Dashboard
        </h1>
        <span style={{ fontSize: 13, color: "#888", textTransform: "capitalize" }}>{getMesLabel(mes)}</span>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <KpiCard title="Deals activos" value={String(activeDeals.length)} sub="en pipeline" accent="#4548FF" />
        <KpiCard title="Valor pipeline" value={formatCLP(totalPipeline)} sub="activo" accent="#4548FF" />
        <KpiCard title="Cierres del mes" value={String(cierresMes.length)} sub={formatCLP(wonValue)} accent="#16a34a" />
        <KpiCard title="Sin actividad +7d" value={String(staleDeals.length)} sub="requieren atención" accent={staleDeals.length > 0 ? "#ef4444" : "#16a34a"} />
      </div>

      {/* ═══ RENDIMIENTO DEL EQUIPO ═══ */}
      <div style={{ backgroundColor: "#FFF", border: "1px solid #E1E0E0", borderRadius: 12, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F0F2F7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: "#121755", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
              Rendimiento del Equipo
            </h2>
            <p style={{ fontSize: 12, color: "#888", margin: "3px 0 0" }}>Metas mensuales — {getMesLabel(mes)}</p>
          </div>
          <Link href="/admin/metas" style={{ fontSize: 12, color: "#4548FF", fontWeight: 600, textDecoration: "none" }}>
            Editar metas →
          </Link>
        </div>

        {!hasMetas ? (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>No hay metas configuradas para este mes.</p>
            <Link href="/admin/metas" style={{ padding: "8px 20px", borderRadius: 8, backgroundColor: "#4548FF", color: "#FFF", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Configurar metas del mes
            </Link>
          </div>
        ) : (
          <>
            {/* Team total row */}
            {(teamCierresMeta > 0 || teamReunionesMeta > 0) && (
              <div style={{ padding: "14px 24px", backgroundColor: "rgba(69,72,255,0.04)", borderBottom: "1px solid #E1E0E0", display: "grid", gridTemplateColumns: "200px 1fr 1fr 80px", gap: 16, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#121755", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    🏆
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#121755" }}>Total Equipo</span>
                </div>
                <MetricCol label="Cierres" actual={cierresMes.length} meta={teamCierresMeta} pct={teamCierresPct} />
                <MetricCol label="Reuniones" actual={reunionesMes.length} meta={teamReunionesMeta} pct={teamReunionesPct} />
                <ScoreBadge pct={[teamCierresPct, teamReunionesPct].filter((v) => v !== null).length > 0
                  ? ([teamCierresPct, teamReunionesPct].filter((v) => v !== null) as number[]).reduce((a, b) => a + b, 0) / ([teamCierresPct, teamReunionesPct].filter((v) => v !== null).length)
                  : null} />
              </div>
            )}

            {/* BD rows */}
            {bdRows.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#aaa" }}>Aún no hay Business Developers con deals asignados.</p>
              </div>
            ) : (
              bdRows.map((row, i) => (
                <div
                  key={row.bd}
                  style={{
                    padding: "16px 24px",
                    borderBottom: i < bdRows.length - 1 ? "1px solid #F0F2F7" : "none",
                    display: "grid",
                    gridTemplateColumns: "200px 1fr 1fr 80px",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  {/* BD name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      backgroundColor: row.score !== null ? `${scoreColor(row.score)}20` : "#F0F2F7",
                      border: `2px solid ${row.score !== null ? scoreColor(row.score) : "#E1E0E0"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                      color: row.score !== null ? scoreColor(row.score) : "#888",
                      flexShrink: 0,
                    }}>
                      {row.bd.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{row.bd}</span>
                  </div>

                  {/* Cierres */}
                  <MetricCol label="Cierres" actual={row.cierresActual} meta={row.cierresMeta} pct={row.cierresPct} />

                  {/* Reuniones */}
                  <MetricCol label="Reuniones" actual={row.reunionesActual} meta={row.reunionesMeta} pct={row.reunionesPct} />

                  {/* Score */}
                  <ScoreBadge pct={row.score} />
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Two-column: pipeline + mis deals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Pipeline por etapa */}
        <div style={{ backgroundColor: "#FFF", border: "1px solid #E1E0E0", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: "#121755", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 16 }}>
            Deals por etapa
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {byStage.map(({ stage, count }) => {
              const color = STAGE_COLORS[stage.color];
              const maxCount = Math.max(...byStage.map((b) => b.count), 1);
              return (
                <div key={stage.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 130, fontSize: 11, color: "#555", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {stage.emoji} {stage.label}
                  </span>
                  <div style={{ flex: 1, height: 8, backgroundColor: "#F0F2F7", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / maxCount) * 100}%`, backgroundColor: color, borderRadius: 4 }} />
                  </div>
                  <span style={{ width: 18, fontSize: 12, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", color: "#1D1D1F", textAlign: "right" }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mis deals */}
        <div style={{ backgroundColor: "#FFF", border: "1px solid #E1E0E0", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: "#121755", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Mis Deals
            </h2>
            <Link href="/pipeline" style={{ fontSize: 12, color: "#4548FF", fontWeight: 600, textDecoration: "none" }}>
              Ver pipeline →
            </Link>
          </div>
          {myDeals.length === 0 ? (
            <p style={{ fontSize: 13, color: "#aaa" }}>No tienes deals asignados aún.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myDeals.slice(0, 8).map((deal) => {
                const stage = PIPELINE_STAGES.find((s) => s.id === deal.etapa);
                const color = STAGE_COLORS[stage?.color || "blue"];
                const stale = daysSince(deal.updatedAt) >= 7;
                return (
                  <div key={deal.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F0F2F7" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{deal.nombre}</p>
                      <p style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                        {deal.etapa}
                        {stale && <span style={{ color: "#ef4444", marginLeft: 6, fontWeight: 600 }}>· +7d</span>}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {deal.monto && <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: "#121755" }}>{formatCLP(deal.monto)}</p>}
                      <span style={{ fontSize: 10, backgroundColor: color + "18", color, borderRadius: 4, padding: "2px 6px", fontWeight: 500 }}>
                        {stage?.probability ? `${stage.probability}%` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* OKRs — compact summary */}
      {okrs.length > 0 && (
        <div style={{ backgroundColor: "#FFF", border: "1px solid #E1E0E0", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: "#121755", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
              OKR — Objetivos del trimestre
            </h2>
            <Link href="/admin/okr" style={{ fontSize: 12, color: "#4548FF", fontWeight: 600, textDecoration: "none" }}>
              Gestionar →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {okrs.map((okr) => {
              const totalPct = okr.keyResults.length > 0
                ? okr.keyResults.reduce((s, kr) => s + Math.min(kr.actual / kr.objetivo, 1), 0) / okr.keyResults.length * 100
                : 0;
              const color = scoreColor(totalPct);
              return (
                <div key={okr.id} style={{ border: "1px solid #F0F2F7", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1, marginRight: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#4548FF", backgroundColor: "rgba(69,72,255,0.1)", padding: "2px 7px", borderRadius: 20, letterSpacing: "0.06em" }}>
                        {okr.trimestre}
                      </span>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: "#121755", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.3 }}>
                        {okr.objetivo}
                      </p>
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", color, flexShrink: 0 }}>
                      {Math.round(totalPct)}%
                    </span>
                  </div>
                  <div style={{ height: 6, backgroundColor: "#F0F2F7", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${totalPct}%`, backgroundColor: color, borderRadius: 3 }} />
                  </div>
                  {okr.keyResults.length > 0 && (
                    <p style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
                      {okr.keyResults.length} key result{okr.keyResults.length !== 1 ? "s" : ""} · {okr.keyResults.filter((kr) => kr.actual >= kr.objetivo).length} completado{okr.keyResults.filter((kr) => kr.actual >= kr.objetivo).length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stale deals alert */}
      {staleDeals.length > 0 && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
            ⚠️ Deals sin actividad hace +7 días
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {staleDeals.slice(0, 12).map((deal) => (
              <Link key={deal.id} href="/pipeline" style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#FFF", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "6px 12px", textDecoration: "none" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{deal.nombre}</span>
                <span style={{ fontSize: 11, color: "#ef4444" }}>{daysSince(deal.updatedAt)}d</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, accent }: { title: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{ backgroundColor: "#FFF", border: "1px solid #E1E0E0", borderRadius: 12, padding: 20, borderTop: `3px solid ${accent}` }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{title}</p>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: "#121755", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>{sub}</p>
    </div>
  );
}

function MetricCol({ label, actual, meta, pct }: { label: string; actual: number; meta: number; pct: number | null }) {
  const color = pct !== null ? scoreColor(pct) : "#ccc";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>{label}</span>
        {meta > 0 ? (
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", color }}>
            {actual}
            <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400 }}> / {meta}</span>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#aaa" }}>{actual} <span style={{ fontSize: 11 }}>sin meta</span></span>
        )}
      </div>
      <div style={{ height: 6, backgroundColor: "#F0F2F7", borderRadius: 3, overflow: "hidden" }}>
        {pct !== null && (
          <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 3, transition: "width 0.4s" }} />
        )}
      </div>
    </div>
  );
}

function ScoreBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <div />;
  const color = scoreColor(pct);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "inline-flex", flexDirection: "column", alignItems: "center",
        backgroundColor: `${color}12`, borderRadius: 8, padding: "6px 10px", border: `1px solid ${color}30`,
      }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, color, lineHeight: 1 }}>
          {Math.round(pct)}%
        </span>
        <span style={{ fontSize: 9, color, fontWeight: 600, letterSpacing: "0.05em", marginTop: 1 }}>SCORE</span>
      </div>
    </div>
  );
}
