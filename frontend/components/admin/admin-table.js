export default function AdminTable({ title, columns = [], rows = [] }) {
  return (
    <section className="panel p-5">
      <div className="editorial-title mb-4 text-lg font-bold text-white">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-muted">
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-white/10">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-3 text-[#ece7e2]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
