// =====================================================================
// AVALIAÇÕES NA LOJA — cartões com estrelas, texto e foto, numa faixa
// que desliza para o lado. Usado na página do produto e no fim da loja.
// =====================================================================
type Avaliacao = { id: string; nome: string | null; texto: string; foto_url: string | null; estrelas: number };

export default function Avaliacoes({ itens, cor, titulo = "💬 Quem comprou, aprovou" }: { itens: Avaliacao[]; cor: string; titulo?: string }) {
  if (!itens.length) return null;
  const media = itens.reduce((s, a) => s + a.estrelas, 0) / itens.length;
  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-xl font-bold">{titulo}</h2>
        <span className="text-sm opacity-70">⭐ {media.toFixed(1).replace(".", ",")} · {itens.length} {itens.length === 1 ? "avaliação" : "avaliações"}</span>
      </div>
      <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-3">
        {itens.map((a, i) => (
          <article key={a.id} className="animar-entrada w-72 shrink-0 snap-start rounded-2xl border bg-white/80 p-4 shadow-sm" style={{ borderColor: `${cor}33`, animationDelay: `${i * 60}ms` }}>
            {a.foto_url && <img src={a.foto_url} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />}
            <span className="text-sm">{"⭐".repeat(a.estrelas)}</span>
            <p className="mt-1 whitespace-pre-line text-sm">“{a.texto}”</p>
            <b className="mt-2 block text-xs" style={{ color: cor }}>— {a.nome || "Cliente"}</b>
          </article>
        ))}
      </div>
    </section>
  );
}
