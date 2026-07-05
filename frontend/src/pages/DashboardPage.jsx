import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiHardDrive,
  FiLayers,
  FiMapPin,
  FiTool,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

function numero(valor) {
  return Number(valor || 0);
}

function CardResumo({ titulo, valor, descricao, icone: Icone }) {
  return (
    <div className="border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {titulo}
          </p>

          <p className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
            {valor}
          </p>

          {descricao && (
            <p className="mt-2 text-sm leading-5 text-slate-500">
              {descricao}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-slate-950 text-white">
          <Icone size={21} />
        </div>
      </div>
    </div>
  );
}

function BarraLista({ titulo, descricao, itens, nomeCampo, totalCampo }) {
  const maiorValor = Math.max(...(itens || []).map((item) => numero(item[totalCampo])), 0);

  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <h2 className="text-base font-bold text-slate-950">
          {titulo}
        </h2>

        {descricao && (
          <p className="mt-1 text-sm text-slate-500">
            {descricao}
          </p>
        )}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {(!itens || itens.length === 0) && (
          <div className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Sem dados para exibir.
          </div>
        )}

        {(itens || []).map((item) => {
          const valor = numero(item[totalCampo]);
          const percentual = maiorValor > 0 ? Math.max((valor / maiorValor) * 100, 6) : 0;

          return (
            <div key={`${item[nomeCampo]}-${valor}`}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <p className="truncate text-sm font-semibold text-slate-700">
                  {item[nomeCampo] || "-"}
                </p>

                <p className="shrink-0 text-sm font-bold text-slate-950">
                  {valor}
                </p>
              </div>

              <div className="h-2 w-full bg-slate-100">
                <div
                  className="h-2 bg-slate-950"
                  style={{ width: `${percentual}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabelaDesktop({ titulo, descricao, cabecalhos, linhas, renderLinha }) {
  return (
    <div className="hidden border border-slate-200 bg-white lg:block">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-base font-bold text-slate-950">
          {titulo}
        </h2>

        {descricao && (
          <p className="mt-1 text-sm text-slate-500">
            {descricao}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {cabecalhos.map((cabecalho) => (
                <th key={cabecalho} className="px-5 py-3">
                  {cabecalho}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={cabecalhos.length} className="px-5 py-8 text-center text-slate-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}

            {linhas.map((linha) => renderLinha(linha))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListaMobile({ titulo, descricao, linhas, renderCard }) {
  return (
    <div className="border border-slate-200 bg-white lg:hidden">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-base font-bold text-slate-950">
          {titulo}
        </h2>

        {descricao && (
          <p className="mt-1 text-sm text-slate-500">
            {descricao}
          </p>
        )}
      </div>

      <div className="space-y-3 p-4">
        {linhas.length === 0 && (
          <div className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Nenhum registro encontrado.
          </div>
        )}

        {linhas.map((linha) => renderCard(linha))}
      </div>
    </div>
  );
}

function BadgeStatusEquipamento({ status }) {
  let classe = "border-slate-200 bg-slate-100 text-slate-700";

  if (status === "em_uso") {
    classe = "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "estoque") {
    classe = "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (status === "manutencao") {
    classe = "border-amber-200 bg-amber-50 text-amber-800";
  }

  return (
    <span className={`inline-flex border px-2 py-1 text-xs font-bold ${classe}`}>
      {status || "-"}
    </span>
  );
}

function BadgeStatusHistorico({ status }) {
  let classe = "border-slate-200 bg-slate-100 text-slate-700";

  if (status === "aberto") {
    classe = "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "andamento") {
    classe = "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "concluido") {
    classe = "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return (
    <span className={`inline-flex border px-2 py-1 text-xs font-bold ${classe}`}>
      {status || "-"}
    </span>
  );
}

function nomeEquipamento(equipamento) {
  if (!equipamento) {
    return "-";
  }

  const identificador = equipamento.patrimonio || equipamento.numero_serie || `ID ${equipamento.id}`;
  const modelo = [equipamento.marca, equipamento.modelo].filter(Boolean).join(" ");

  return `${equipamento.tipo_display || "Equipamento"} - ${identificador}${modelo ? ` - ${modelo}` : ""}`;
}

export default function DashboardPage() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDashboard() {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await apiRequest("/dashboard/");
      setDados(resposta);
    } catch (erroApi) {
      setErro(erroApi.message || "Erro ao carregar dashboard.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  if (carregando) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando dashboard...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="border border-red-200 bg-red-50 p-6 text-red-900">
          <p className="font-bold">Erro ao carregar dashboard</p>
          <p className="mt-1 text-sm">{erro}</p>

          <button
            type="button"
            onClick={carregarDashboard}
            className="mt-4 border border-red-300 px-4 py-2 text-sm font-bold hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const cards = dados?.cards || {};
  const ultimosComputadores = dados?.ultimos_computadores || [];
  const ultimosEquipamentos = dados?.ultimos_equipamentos || [];
  const ultimasManutencoes = dados?.ultimas_manutencoes || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Computadores"
          valor={numero(cards.total_computadores)}
          descricao="Usuários e máquinas cadastradas"
          icone={FiCpu}
        />

        <CardResumo
          titulo="Equipamentos"
          valor={numero(cards.total_equipamentos)}
          descricao="Patrimônio e almoxarifado"
          icone={FiHardDrive}
        />

        <CardResumo
          titulo="Setores"
          valor={numero(cards.total_setores)}
          descricao="Locais cadastrados"
          icone={FiMapPin}
        />

        <CardResumo
          titulo="Históricos"
          valor={numero(cards.total_manutencoes)}
          descricao="Manutenções e movimentações"
          icone={FiTool}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Sem setor"
          valor={numero(cards.computadores_sem_setor)}
          descricao="Computadores sem setor definido"
          icone={FiAlertTriangle}
        />

        <CardResumo
          titulo="Equipamentos sem setor"
          valor={numero(cards.equipamentos_sem_setor)}
          descricao="Itens sem localização"
          icone={FiLayers}
        />

        <CardResumo
          titulo="Em manutenção"
          valor={numero(cards.equipamentos_manutencao)}
          descricao="Equipamentos marcados em manutenção"
          icone={FiClock}
        />

        <CardResumo
          titulo="Concluídas"
          valor={numero(cards.manutencoes_concluidas)}
          descricao="Registros finalizados"
          icone={FiCheckCircle}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <BarraLista
          titulo="Computadores por setor"
          descricao="Distribuição dos computadores cadastrados"
          itens={dados?.computadores_por_setor || []}
          nomeCampo="setor"
          totalCampo="total"
        />

        <BarraLista
          titulo="Equipamentos por tipo"
          descricao="Quantidade por categoria de equipamento"
          itens={dados?.equipamentos_por_tipo || []}
          nomeCampo="tipo"
          totalCampo="total"
        />

        <BarraLista
          titulo="Equipamentos por status"
          descricao="Situação atual do patrimônio"
          itens={dados?.equipamentos_por_status || []}
          nomeCampo="status"
          totalCampo="total"
        />

        <BarraLista
          titulo="Histórico por status"
          descricao="Andamento dos registros de manutenção"
          itens={dados?.manutencoes_por_status || []}
          nomeCampo="status"
          totalCampo="total"
        />
      </section>

      <section className="space-y-6">
        <TabelaDesktop
          titulo="Últimos computadores"
          descricao="Cadastros mais recentes de usuários e computadores"
          cabecalhos={["Usuário", "Setor", "IP", "MAC", "Atualizado"]}
          linhas={ultimosComputadores}
          renderLinha={(computador) => (
            <tr key={computador.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-5 py-4 font-semibold text-slate-950">
                {computador.nome_usuario}
              </td>
              <td className="px-5 py-4 text-slate-700">
                {computador.setor?.nome || "-"}
              </td>
              <td className="px-5 py-4 font-mono text-slate-700">
                {computador.ip_computador}
              </td>
              <td className="px-5 py-4 font-mono text-slate-700">
                {computador.mac_address}
              </td>
              <td className="px-5 py-4 text-slate-500">
                {computador.atualizado_em}
              </td>
            </tr>
          )}
        />

        <ListaMobile
          titulo="Últimos computadores"
          descricao="Cadastros mais recentes"
          linhas={ultimosComputadores}
          renderCard={(computador) => (
            <div key={computador.id} className="border border-slate-200 p-4">
              <p className="font-bold text-slate-950">
                {computador.nome_usuario}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {computador.setor?.nome || "Sem setor"}
              </p>

              <div className="mt-3 grid gap-2 text-sm">
                <p><span className="font-semibold text-slate-700">IP:</span> {computador.ip_computador}</p>
                <p><span className="font-semibold text-slate-700">MAC:</span> {computador.mac_address}</p>
                <p><span className="font-semibold text-slate-700">Atualizado:</span> {computador.atualizado_em}</p>
              </div>
            </div>
          )}
        />

        <TabelaDesktop
          titulo="Últimos equipamentos"
          descricao="Itens mais recentes cadastrados no patrimônio/almoxarifado"
          cabecalhos={["Equipamento", "Patrimônio", "Setor", "Responsável", "Status"]}
          linhas={ultimosEquipamentos}
          renderLinha={(equipamento) => (
            <tr key={equipamento.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-950">
                  {equipamento.tipo_display}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {[equipamento.marca, equipamento.modelo].filter(Boolean).join(" ") || "-"}
                </p>
              </td>
              <td className="px-5 py-4 font-mono text-slate-700">
                {equipamento.patrimonio || "-"}
              </td>
              <td className="px-5 py-4 text-slate-700">
                {equipamento.setor?.nome || "-"}
              </td>
              <td className="px-5 py-4 text-slate-700">
                {equipamento.usuario_responsavel || "-"}
              </td>
              <td className="px-5 py-4">
                <BadgeStatusEquipamento status={equipamento.status_display} />
              </td>
            </tr>
          )}
        />

        <ListaMobile
          titulo="Últimos equipamentos"
          descricao="Itens mais recentes"
          linhas={ultimosEquipamentos}
          renderCard={(equipamento) => (
            <div key={equipamento.id} className="border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-950">
                    {equipamento.tipo_display}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[equipamento.marca, equipamento.modelo].filter(Boolean).join(" ") || "-"}
                  </p>
                </div>

                <BadgeStatusEquipamento status={equipamento.status_display} />
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                <p><span className="font-semibold text-slate-700">Patrimônio:</span> {equipamento.patrimonio || "-"}</p>
                <p><span className="font-semibold text-slate-700">Setor:</span> {equipamento.setor?.nome || "-"}</p>
                <p><span className="font-semibold text-slate-700">Responsável:</span> {equipamento.usuario_responsavel || "-"}</p>
              </div>
            </div>
          )}
        />

        <TabelaDesktop
          titulo="Últimos históricos"
          descricao="Últimos registros de manutenção, movimentação e observações"
          cabecalhos={["Equipamento", "Ocorrência", "Data", "Responsável", "Status"]}
          linhas={ultimasManutencoes}
          renderLinha={(manutencao) => (
            <tr key={manutencao.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-5 py-4 font-semibold text-slate-950">
                {nomeEquipamento(manutencao.equipamento)}
              </td>
              <td className="px-5 py-4 text-slate-700">
                {manutencao.tipo_ocorrencia_display}
              </td>
              <td className="px-5 py-4 text-slate-700">
                {manutencao.data_ocorrencia}
              </td>
              <td className="px-5 py-4 text-slate-700">
                {manutencao.responsavel_atendimento || "-"}
              </td>
              <td className="px-5 py-4">
                <BadgeStatusHistorico status={manutencao.status_display} />
              </td>
            </tr>
          )}
        />

        <ListaMobile
          titulo="Últimos históricos"
          descricao="Registros mais recentes"
          linhas={ultimasManutencoes}
          renderCard={(manutencao) => (
            <div key={manutencao.id} className="border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-950">
                    {manutencao.tipo_ocorrencia_display}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {nomeEquipamento(manutencao.equipamento)}
                  </p>
                </div>

                <BadgeStatusHistorico status={manutencao.status_display} />
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                <p><span className="font-semibold text-slate-700">Data:</span> {manutencao.data_ocorrencia}</p>
                <p><span className="font-semibold text-slate-700">Responsável:</span> {manutencao.responsavel_atendimento || "-"}</p>
                <p className="line-clamp-3"><span className="font-semibold text-slate-700">Descrição:</span> {manutencao.descricao || "-"}</p>
              </div>
            </div>
          )}
        />
      </section>
    </div>
  );
}