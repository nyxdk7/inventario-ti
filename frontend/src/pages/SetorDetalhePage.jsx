import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../services/api";

function textoEspecificacoes(computador) {
  if (!computador?.mostrar_especificacoes) {
    return "-";
  }

  const partes = [];

  if (computador.processador) {
    partes.push(computador.processador);
  }

  if (computador.memoria_ram) {
    partes.push(computador.memoria_ram);
  }

  if (computador.armazenamento_tipo_display || computador.armazenamento_capacidade) {
    partes.push(
      [computador.armazenamento_tipo_display, computador.armazenamento_capacidade]
        .filter(Boolean)
        .join(" ")
    );
  }

  if (computador.fonte_watts) {
    partes.push(`Fonte ${computador.fonte_watts}W`);
  }

  return partes.length > 0 ? partes.join(" · ") : "-";
}

function descricaoEquipamento(equipamento) {
  return [equipamento?.marca, equipamento?.modelo].filter(Boolean).join(" ") || "-";
}

function badgeStatusEquipamento(status) {
  if (status === "em_uso") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "estoque") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (status === "manutencao") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function CampoInfo({ titulo, valor }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {valor || "-"}
      </p>
    </div>
  );
}

function Aviso({ aviso, onFechar }) {
  if (!aviso) {
    return null;
  }

  const estilos = {
    erro: "border-red-200 bg-red-50 text-red-900",
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
    </div>
  );
}

function ComputadorCard({ computador }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <h3 className="break-words text-base font-bold text-slate-950">
        {computador.nome_usuario}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <CampoInfo titulo="IP" valor={computador.ip_computador} />
        <CampoInfo titulo="MAC" valor={computador.mac_address} />
      </div>

      <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Especificações
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">
          {textoEspecificacoes(computador)}
        </p>
      </div>

      {computador.observacoes && (
        <p className="mt-4 line-clamp-3 break-words text-sm leading-6 text-slate-600">
          {computador.observacoes}
        </p>
      )}
    </div>
  );
}

function EquipamentoCard({ equipamento }) {
  const fotoPrincipal = equipamento.fotos?.[0];

  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 border border-slate-200 bg-slate-100">
          {fotoPrincipal ? (
            <img
              src={fotoPrincipal.url}
              alt="Foto do equipamento"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
              Sem foto
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-bold text-slate-950">
            {equipamento.tipo_display}
          </h3>

          <p className="mt-1 break-words text-sm text-slate-500">
            {descricaoEquipamento(equipamento)}
          </p>

          <div className="mt-2">
            <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgeStatusEquipamento(equipamento.status)}`}>
              {equipamento.status_display}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <CampoInfo titulo="Patrimônio" valor={equipamento.patrimonio} />
        <CampoInfo titulo="Série" valor={equipamento.numero_serie} />
        <CampoInfo titulo="Responsável" valor={equipamento.usuario_responsavel} />
        <CampoInfo titulo="Fotos" valor={equipamento.fotos?.length || 0} />
      </div>
    </div>
  );
}

export default function SetorDetalhePage({ setorId, aoVoltar }) {
  const [setor, setSetor] = useState(null);
  const [computadores, setComputadores] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [buscaComputadores, setBuscaComputadores] = useState("");
  const [buscaEquipamentos, setBuscaEquipamentos] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState(null);

  async function carregarDetalhes() {
    setCarregando(true);
    setAviso(null);

    try {
      const [dadosSetores, dadosComputadores, dadosEquipamentos] = await Promise.all([
        apiRequest("/setores/"),
        apiRequest("/computadores/"),
        apiRequest("/equipamentos/"),
      ]);

      const setorEncontrado = (dadosSetores.resultados || []).find(
        (item) => Number(item.id) === Number(setorId)
      );

      const computadoresDoSetor = (dadosComputadores.resultados || []).filter(
        (computador) => Number(computador.setor?.id) === Number(setorId)
      );

      const equipamentosDoSetor = (dadosEquipamentos.resultados || []).filter(
        (equipamento) => Number(equipamento.setor?.id) === Number(setorId)
      );

      setSetor(setorEncontrado || null);
      setComputadores(computadoresDoSetor);
      setEquipamentos(equipamentosDoSetor);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar detalhes do setor",
        texto: erro.message,
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDetalhes();
  }, [setorId]);

  const computadoresFiltrados = useMemo(() => {
    const termo = buscaComputadores.trim().toLowerCase();

    if (!termo) {
      return computadores;
    }

    return computadores.filter((computador) => {
      const texto = [
        computador.nome_usuario,
        computador.ip_computador,
        computador.mac_address,
        computador.processador,
        computador.memoria_ram,
        computador.armazenamento_tipo_display,
        computador.armazenamento_capacidade,
        computador.observacoes,
      ].filter(Boolean).join(" ").toLowerCase();

      return texto.includes(termo);
    });
  }, [computadores, buscaComputadores]);

  const equipamentosFiltrados = useMemo(() => {
    const termo = buscaEquipamentos.trim().toLowerCase();

    if (!termo) {
      return equipamentos;
    }

    return equipamentos.filter((equipamento) => {
      const texto = [
        equipamento.tipo_display,
        equipamento.patrimonio,
        equipamento.marca,
        equipamento.modelo,
        equipamento.numero_serie,
        equipamento.usuario_responsavel,
        equipamento.status_display,
        equipamento.observacoes,
      ].filter(Boolean).join(" ").toLowerCase();

      return texto.includes(termo);
    });
  }, [equipamentos, buscaEquipamentos]);

  const usuariosUnicos = useMemo(() => {
    return computadores
      .map((computador) => computador.nome_usuario)
      .filter(Boolean)
      .filter((nome, index, lista) => lista.indexOf(nome) === index);
  }, [computadores]);

  if (carregando) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando detalhes do setor...
        </div>
      </div>
    );
  }

  if (!setor) {
    return (
      <div className="mx-auto max-w-7xl">
        <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

        <div className="border border-red-200 bg-red-50 p-6 text-red-900">
          <p className="font-bold">
            Setor não encontrado.
          </p>

          <button
            type="button"
            onClick={aoVoltar}
            className="mt-4 w-full border border-red-300 px-4 py-3 text-sm font-bold hover:bg-red-100 sm:w-auto"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

      <div className="mb-5 border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={aoVoltar}
              className="mb-4 w-full border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:w-auto sm:px-3 sm:py-2 sm:text-xs"
            >
              Voltar para setores
            </button>

            <h2 className="break-words text-xl font-bold text-slate-950 sm:text-2xl">
              {setor.nome}
            </h2>

            <p className="mt-2 break-words text-sm text-slate-500">
              Responsável: {setor.responsavel || "-"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <span className="border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              {computadores.length} computador(es)
            </span>

            <span className="border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              {equipamentos.length} equipamento(s)
            </span>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CampoInfo titulo="Usuários vinculados" valor={usuariosUnicos.length} />
        <CampoInfo titulo="Computadores" valor={computadores.length} />
        <CampoInfo titulo="Equipamentos" valor={equipamentos.length} />
        <CampoInfo titulo="Atualizado em" valor={setor.atualizado_em} />
      </section>

      {setor.observacoes && (
        <section className="mt-6 border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Observações do setor
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {setor.observacoes}
          </p>
        </section>
      )}

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Computadores e usuários
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Usuários dos computadores vinculados a este setor.
              </p>
            </div>

            <input
              type="text"
              value={buscaComputadores}
              onChange={(evento) => setBuscaComputadores(evento.target.value)}
              placeholder="Buscar usuário, IP, MAC..."
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 lg:max-w-xs lg:py-2.5"
            />
          </div>

          <div className="p-4 sm:p-5">
            {computadoresFiltrados.length === 0 && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Nenhum computador encontrado neste setor.
              </div>
            )}

            {computadoresFiltrados.length > 0 && (
              <div className="space-y-4">
                {computadoresFiltrados.map((computador) => (
                  <ComputadorCard key={computador.id} computador={computador} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Equipamentos do setor
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Patrimônios, dispositivos e itens alocados neste setor.
              </p>
            </div>

            <input
              type="text"
              value={buscaEquipamentos}
              onChange={(evento) => setBuscaEquipamentos(evento.target.value)}
              placeholder="Buscar patrimônio, série..."
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 lg:max-w-xs lg:py-2.5"
            />
          </div>

          <div className="p-4 sm:p-5">
            {equipamentosFiltrados.length === 0 && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Nenhum equipamento encontrado neste setor.
              </div>
            )}

            {equipamentosFiltrados.length > 0 && (
              <div className="space-y-4">
                {equipamentosFiltrados.map((equipamento) => (
                  <EquipamentoCard key={equipamento.id} equipamento={equipamento} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}