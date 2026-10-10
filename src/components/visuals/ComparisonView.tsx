export function ComparisonView({ columns, rows, large = false }: { columns: string[]; rows: string[][]; large?: boolean }) {
  if (!columns?.length || !rows?.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${large ? "text-[17px]" : "text-[13px]"}`}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className={`border-b border-line bg-surface-2 px-3 py-2.5 text-left font-mono font-medium uppercase tracking-[0.5px] text-muted ${large ? "text-[12px]" : "text-[10px]"}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((_, j) => (
                <td key={j} className={`border-b border-line px-3 align-top ${large ? "py-3.5" : "py-2.5"} leading-[1.5] ${j === 0 ? "font-bold" : ""}`}>
                  {r?.[j] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
