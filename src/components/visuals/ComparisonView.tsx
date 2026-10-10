export function ComparisonView({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (!columns?.length || !rows?.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className="border-b border-line bg-[#f7f9f8] px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.5px] text-muted"
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
                <td key={j} className={`border-b border-line px-3 py-2.5 align-top leading-[1.5] ${j === 0 ? "font-bold" : ""}`}>
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
