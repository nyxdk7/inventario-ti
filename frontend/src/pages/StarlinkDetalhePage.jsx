import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiCloud,
  FiCreditCard,
  FiHardDrive,
  FiInfo,
  FiMapPin,
  FiRadio,
  FiRefreshCw,
  FiUser,
  FiWifi,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

function formatarMoeda(valor) {
  if (valor === "" || valor === null || valor === undefined) return "-";
  const numero = Number(String(valor).replace(",", "."));
  if (Number.isNaN(numero)) return valor;
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(valor) {
  if (!valor) return "-";
  const [ano, mes, dia] = String(valor).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

function badgeStatus(status) {
  const classes = {
    ativa: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cancelada: "border-red-200 bg-red-50 text-red-700",
    espera: "border-amber-200 bg-amber-50 text-amber-700",
    manutencao: "border-orange-200 bg-orange-50 text-orange-700",
    reserva: "border-slate-200 bg-slate-100 text-slate-700",
  };
  return classes[status] || classes.reserva;
}

function iconeStatusClasse(status) {
  const classes = {
    ativa: "text-emerald-500",
    cancelada: "text-red-500",
    espera: "text-amber-500",
    manutencao: "text-orange-500",
    reserva: "text-slate-400",
  };

  return classes[status] || classes.reserva;
}

function Info({ titulo, valor, icone: Icone }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {Icone && <Icone size={19} className="mt-0.5 shrink-0 text-slate-400" />}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">{valor || "-"}</p>
        </div>
      </div>
    </div>
  );
}

function Secao({ titulo, descricao, children }) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="font-black text-slate-950">{titulo}</h3>
        {descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Metrica({ titulo, valor, unidade }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-2 text-xl font-black text-slate-950">
        {valor === "" || valor === null || valor === undefined ? "-" : valor}
        {valor !== "" && valor !== null && valor !== undefined && unidade ? <span className="ml-1 text-sm font-semibold text-slate-500">{unidade}</span> : null}
      </p>
    </div>
  );
}

export default function StarlinkDetalhePage({ starlinkId, aoVoltar }) {
  const [starlink, setStarlink] = useState(null);
  const [aba, setAba] = useState("geral");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const dados = await apiRequest(`/starlinks/${starlinkId}/`);
      setStarlink(dados.starlink);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [starlinkId]);

  if (carregando) {
    return <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Carregando Starlink...</div>;
  }

  if (erro || !starlink) {
    return (
      <div className="border border-red-200 bg-red-50 p-5 text-red-700">
        <p className="font-bold">Não foi possível carregar a Starlink.</p>
        <p className="mt-1 text-sm">{erro}</p>
        <button type="button" onClick={aoVoltar} className="mt-4 border border-red-300 px-4 py-2 text-sm font-bold">Voltar</button>
      </div>
    );
  }

  const telemetria = starlink.telemetria || {};
  const abas = [
    ["geral", "Visão geral", FiInfo],
    ["assinatura", "Assinatura", FiCreditCard],
    ["equipamento", "Equipamento", FiHardDrive],
    ["telemetria", "Telemetria", FiRadio],
    ["integracao", "Integração", FiCloud],
  ];

  return (
    <div>
      <button type="button" onClick={aoVoltar} className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
        <FiArrowLeft size={17} /> Voltar para Starlinks
      </button>

      <div className="border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <FiWifi
                size={26}
                className={`shrink-0 ${iconeStatusClasse(starlink.status)}`}
                title={`Status: ${starlink.status_display}`}
              />
              <h2 className="text-2xl font-black text-slate-950">{starlink.nome}</h2>
              <span className={`border px-2.5 py-1 text-xs font-bold ${badgeStatus(starlink.status)}`}>{starlink.status_display}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-600">{starlink.modelo} · {starlink.plano || "Plano não informado"}</p>
            <p className="mt-1 text-sm text-slate-500">Série: {starlink.numero_serie}</p>
          </div>

          <button type="button" onClick={carregar} className="flex items-center justify-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
            <FiRefreshCw size={16} /> Atualizar dados
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto border border-slate-200 bg-white p-2">
        <div className="flex min-w-max gap-1">
          {abas.map(([valor, rotulo, Icone]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setAba(valor)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold ${aba === valor ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Icone size={16} /> {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {aba === "geral" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Info titulo="Localização" valor={starlink.localizacao} icone={FiMapPin} />
              <Info titulo="Responsável" valor={starlink.responsavel} icone={FiUser} />
              <Info titulo="Setor" valor={starlink.setor?.nome} icone={FiMapPin} />
              <Info titulo="Tipo de utilização" valor={starlink.tipo_utilizacao_display} icone={FiWifi} />
              <Info titulo="Placa" valor={starlink.placa || "Não se aplica"} icone={FiMapPin} />
              <Info titulo="Centro de custo" valor={starlink.centro_custo} icone={FiCreditCard} />
              <Info titulo="Criada em" valor={starlink.criado_em} icone={FiCalendar} />
              <Info titulo="Atualizada em" valor={starlink.atualizado_em} icone={FiCalendar} />
            </div>
            <Secao titulo="Observações">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{starlink.observacoes || "Nenhuma observação cadastrada."}</p>
            </Secao>
          </div>
        )}

        {aba === "assinatura" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Info titulo="E-mail da conta" valor={starlink.email_conta} icone={FiUser} />
              <Info titulo="Telefone" valor={starlink.telefone} icone={FiUser} />
              <Info titulo="Plano" valor={starlink.plano} icone={FiCreditCard} />
              <Info titulo="Situação" valor={starlink.status_display} icone={FiInfo} />
              <Info titulo="Data da cobrança" valor={formatarData(starlink.data_cobranca)} icone={FiCalendar} />
              <Info titulo="Valor da mensalidade" valor={formatarMoeda(starlink.valor_mensalidade)} icone={FiCreditCard} />
            </div>
            <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              A senha da conta não é armazenada nem exibida neste módulo.
            </div>
          </div>
        )}

        {aba === "equipamento" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Info titulo="Modelo" valor={starlink.modelo} icone={FiHardDrive} />
              <Info titulo="Número de série" valor={starlink.numero_serie} icone={FiHardDrive} />
              <Info titulo="Kit Number" valor={starlink.kit_number} icone={FiHardDrive} />
              <Info titulo="Starlink ID" valor={starlink.starlink_id} icone={FiCloud} />
            </div>
            <Secao titulo="Vínculo com o inventário" descricao="Relacionamento opcional com um equipamento já cadastrado.">
              {starlink.equipamento ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Info titulo="Tipo" valor={starlink.equipamento.tipo_display} />
                  <Info titulo="Marca" valor={starlink.equipamento.marca} />
                  <Info titulo="Modelo" valor={starlink.equipamento.modelo} />
                  <Info titulo="Patrimônio" valor={starlink.equipamento.patrimonio} />
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhum equipamento do inventário está vinculado.</p>
              )}
            </Secao>
          </div>
        )}

        {aba === "telemetria" && (
          <div className="space-y-4">
            <div className="border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              A estrutura de telemetria está pronta. Os valores serão preenchidos quando a API oficial for configurada.
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Metrica titulo="Status da conexão" valor={telemetria.status_conexao_display || "Desconhecido"} />
              <Metrica titulo="Download" valor={telemetria.download_mbps} unidade="Mb/s" />
              <Metrica titulo="Upload" valor={telemetria.upload_mbps} unidade="Mb/s" />
              <Metrica titulo="Latência" valor={telemetria.latencia_ms} unidade="ms" />
              <Metrica titulo="Perda de pacotes" valor={telemetria.perda_pacotes_percentual} unidade="%" />
              <Metrica titulo="Obstrução" valor={telemetria.obstrucao_percentual} unidade="%" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info titulo="Última comunicação" valor={telemetria.ultima_comunicacao} icone={FiRadio} />
              <Info titulo="Última atualização da telemetria" valor={telemetria.atualizado_em} icone={FiRefreshCw} />
            </div>
          </div>
        )}

        {aba === "integracao" && (
          <div className="space-y-4">
            <div className={`border p-4 text-sm ${starlink.integracao_habilitada ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              {starlink.integracao_habilitada
                ? `Integração marcada como habilitada. Estado atual: ${starlink.status_sincronizacao_display}.`
                : "Integração ainda não habilitada para este cadastro."}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Info titulo="Account ID" valor={starlink.account_id} icone={FiCloud} />
              <Info titulo="Starlink ID" valor={starlink.starlink_id} icone={FiCloud} />
              <Info titulo="User Terminal ID" valor={starlink.user_terminal_id} icone={FiCloud} />
              <Info titulo="Service Line ID" valor={starlink.service_line_id} icone={FiCloud} />
              <Info titulo="Kit Number" valor={starlink.kit_number} icone={FiCloud} />
              <Info titulo="Última sincronização" valor={starlink.ultima_sincronizacao} icone={FiRefreshCw} />
            </div>
            {starlink.mensagem_erro_sincronizacao && (
              <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{starlink.mensagem_erro_sincronizacao}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
