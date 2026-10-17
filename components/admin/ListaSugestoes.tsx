// =====================================================================
// LISTA DE SUGESTÕES PARA UM CAMPO DE TEXTO (datalist)
// Ao clicar no campo aparece a lista; a pessoa escolhe ou digita outra.
// Uso: <input list="lista-selo" ... />  +  <ListaSugestoes id="lista-selo" opcoes={[...]} />
// =====================================================================
export default function ListaSugestoes({ id, opcoes }: { id: string; opcoes: string[] }) {
  return (
    <datalist id={id}>
      {[...new Set(opcoes)].map((o) => <option key={o} value={o} />)}
    </datalist>
  );
}
