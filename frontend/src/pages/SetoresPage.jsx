import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const formularioInicial = {
  nome: "",
  responsavel: "",
  observacoes: "",
};

function Aviso({ aviso, onFechar }) {
  if (!aviso) {
    return null;
  }

  const estilos = {
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-900",
    erro: "border-red-200 bg-red-50 text-red-900",
    duplicado: "border-amber-200 bg-amber-50 text-amber-950",
  };

  return (
    <div className={`mb-5 border p-4 ${estilos[aviso.tipo] || estilos.erro}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">
            {aviso.titulo}
          </p>

          {aviso.texto && (
            <p className="mt-1 text-sm">
              {aviso.texto}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="text-sm font-bold opacity-70 hover:opacity-100"
        >
          X
        </button>
      </div>

      {aviso.setor && (
        <div className="mt-4 border border-amber-200 bg-white p-3 text-sm">
          <p>
            <span className="font-bold">Setor existente:</span> {aviso.setor.nome}
          </p>

          <p className="mt-1">
            <span className="font-bold">Responsável:</span> {aviso.setor.responsavel || "-"}
          </p>
        </div>
      )}
    </div>
  );
}

function CardInfo({ titulo, valor }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {valor || "-"}
      </p>
    </div>
  );
}

function SetorCardMobile({ setor, aoVerDetalhes, aoEditar, aoExcluir }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div>
        <h3 className="break-words text-base font-bold text-slate-950">
          {setor.nome}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Responsável: {setor.responsavel || "-"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <CardInfo titulo="Computadores" valor={setor.total_computadores} />
        <CardInfo titulo="Equipamentos" valor={setor.total_equipamentos} />
        <CardInfo titulo="Criado em" valor={setor.criado_em} />
        <CardInfo titulo="Atualizado" valor={setor.atualizado_em} />
      </div>

      {setor.observacoes && (
        <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Observações
          </p>

          <p className="mt-1 line-clamp-4 break-words text-sm leading-6 text-slate-700">
            {setor.observacoes}
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={() => aoVerDetalhes?.(setor.id)}
          className="w-full border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          Ver detalhes
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => aoEditar(setor)}
            className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={() => aoExcluir(setor)}
            className="border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SetoresPage({ aoVerDetalhes }) {
  const [setores, setSetores] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  async function carregarSetores(termoBusca = busca) {
    setCarregando(true);

    try {
      const query = termoBusca.trim()
        ? `?q=${encodeURIComponent(termoBusca.trim())}`
        : "";

      const dados = await apiRequest(`/setores/${query}`);

      setSetores(dados.resultados || []);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar setores",
        texto: erro.message,
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const temporizador = setTimeout(() => {
      carregarSetores(busca);
    }, 250);

    return () => clearTimeout(temporizador);
  }, [busca]);

  function atualizarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: value,
    }));
  }

  function limparFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
  }

  async function salvarSetor(evento) {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);

    const editando = Boolean(editandoId);

    const endpoint = editando
      ? `/setores/${editandoId}/`
      : "/setores/";

    const metodo = editando ? "PUT" : "POST";

    try {
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formulario),
      });

      setAviso({
        tipo: "sucesso",
        titulo: editando ? "Setor atualizado" : "Setor cadastrado",
        texto: dados.mensagem,
      });

      limparFormulario();
      setBusca("");
      await carregarSetores("");
    } catch (erro) {
      if (erro.status === 409) {
        setAviso({
          tipo: "duplicado",
          titulo: "Setor duplicado encontrado",
          texto: erro.dados?.erro || "Já existe um setor cadastrado com esse nome.",
          setor: erro.dados?.setor || null,
        });

        return;
      }

      setAviso({
        tipo: "erro",
        titulo: "Não foi possível salvar",
        texto: erro.message,
      });
    } finally {
      setSalvando(false);
    }
  }

  function editarSetor(setor) {
    setEditandoId(setor.id);

    setFormulario({
      nome: setor.nome || "",
      responsavel: setor.responsavel || "",
      observacoes: setor.observacoes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function excluirSetor(setor) {
    const confirmar = window.confirm(
      `Deseja realmente remover o setor ${setor.nome}?\n\nOs computadores e equipamentos desse setor não serão apagados, apenas ficarão sem setor definido.`
    );

    if (!confirmar) {
      return;
    }

    try {
      const dados = await apiRequest(`/setores/${setor.id}/`, {
        method: "DELETE",
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Setor removido",
        texto: dados.mensagem,
      });

      await carregarSetores();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao remover",
        texto: erro.message,
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-slate-950">
              {editandoId ? "Editar setor" : "Novo setor"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Cadastre setores, locais ou departamentos usados no inventário.
            </p>
          </div>

          <form onSubmit={salvarSetor} className="space-y-4 p-4 sm:p-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Nome do setor
              </label>

              <input
                type="text"
                name="nome"
                value={formulario.nome}
                onChange={atualizarCampo}
                placeholder="Ex: Administrativo"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Responsável
              </label>

              <input
                type="text"
                name="responsavel"
                value={formulario.responsavel}
                onChange={atualizarCampo}
                placeholder="Ex: João Silva"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Observações
              </label>

              <textarea
                name="observacoes"
                value={formulario.observacoes}
                onChange={atualizarCampo}
                placeholder="Ex: sala administrativa, setor financeiro, almoxarifado..."
                rows={5}
                className="w-full resize-none border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Atualizar setor"
                    : "Cadastrar setor"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Setores cadastrados
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total encontrado: {setores.length}
              </p>
            </div>

            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por setor, responsável ou observação..."
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 lg:max-w-xs lg:py-2.5"
            />
          </div>

          <div className="p-4 lg:hidden">
            {carregando && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Carregando setores...
              </div>
            )}

            {!carregando && setores.length === 0 && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Nenhum setor cadastrado ainda.
              </div>
            )}

            {!carregando && setores.length > 0 && (
              <div className="space-y-4">
                {setores.map((setor) => (
                  <SetorCardMobile
                    key={setor.id}
                    setor={setor}
                    aoVerDetalhes={aoVerDetalhes}
                    aoEditar={editarSetor}
                    aoExcluir={excluirSetor}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Setor</th>
                  <th className="px-5 py-3">Responsável</th>
                  <th className="px-5 py-3">Computadores</th>
                  <th className="px-5 py-3">Equipamentos</th>
                  <th className="px-5 py-3">Observações</th>
                  <th className="px-5 py-3">Atualizado</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                      Carregando setores...
                    </td>
                  </tr>
                )}

                {!carregando && setores.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                      Nenhum setor cadastrado ainda.
                    </td>
                  </tr>
                )}

                {!carregando && setores.map((setor) => (
                  <tr key={setor.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      {setor.nome}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {setor.responsavel || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {setor.total_computadores}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {setor.total_equipamentos}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      {setor.observacoes || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {setor.atualizado_em}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => aoVerDetalhes?.(setor.id)}
                          className="border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          Ver detalhes
                        </button>

                        <button
                          type="button"
                          onClick={() => editarSetor(setor)}
                          className="border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirSetor(setor)}
                          className="border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}