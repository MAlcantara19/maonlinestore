// =====================================================================
// ESQUELETOS DE CARREGAMENTO — blocos cinza pulsando no formato da
// página enquanto os dados chegam do banco (no lugar do "Carregando...").
// =====================================================================
const bloco = "brilho-esqueleto rounded-xl"; // cinza com um brilho passando (shimmer)

export function EsqueletoLoja() {
  return (
    <div>
      <div className="brilho-esqueleto h-40" />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className={`${bloco} h-10 w-full`} />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>
              <div className={`${bloco} aspect-square`} />
              <div className={`${bloco} mt-2 h-4 w-3/4`} />
              <div className={`${bloco} mt-1 h-4 w-1/3`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EsqueletoProduto() {
  return (
    <div>
      <div className="brilho-esqueleto h-40" />
      <div className="mx-auto max-w-5xl gap-8 px-4 py-6 md:grid md:grid-cols-2">
        <div className={`${bloco} aspect-square`} />
        <div className="mt-4 space-y-3 md:mt-0">
          <div className={`${bloco} h-8 w-2/3`} />
          <div className={`${bloco} h-4 w-full`} />
          <div className={`${bloco} h-4 w-5/6`} />
          <div className={`${bloco} h-12 w-full`} />
        </div>
      </div>
    </div>
  );
}
