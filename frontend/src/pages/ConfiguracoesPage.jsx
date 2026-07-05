import { useEffect, useState } from "react";
import {
  FiArchive,
  FiCheck,
  FiFileText,
  FiInfo,
  FiRefreshCw,
  FiSave,
  FiSettings,
  FiShield,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

const configuracoesIniciais = {
  geral: {
    nome_sistema: "Inventário de T.I.",
    nome_empresa: "MS Mind",
    email_suporte: "",
    fuso_horario: "America/Porto_Velho",
    texto_login: "Use seu usuário e senha para acessar o painel.",
  },
  seguranca: {
    exigir_troca_primeiro_acesso: true,
    tamanho_minimo_senha: 6,
    tempo_sessao_horas: 8,
    bloquear_apos_tentativas: 5,
  },
  backups: {
    backup_automatico: true,
    horario_backup: "02:00",
    dias_retencao: 14,
    pasta_destino: "/var/backups/inventario-ti",
  },
  relatorios: {
    nome_empresa_relatorio: "MS Mind",
    responsavel_padrao: "Setor de T.I.",
    rodape_pdf: "Relatório emitido pelo sistema de Inventário de T.I.",
    mostrar_data_emissao: true,
  },
};

function Aviso({ aviso, aoFechar }) {
  if (!aviso) {
    return null;
  }

  const classes = {
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-900",
    erro: "border-red-200 bg-red-50 text-red-900",
    info: "border-sky-200 bg-sky-50 text-sky-900",
  };

  return (
    <div className={`mb-5 border p-4 ${classes[aviso.tipo] || classes.info}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold">{aviso.titulo}</p>

          {aviso.texto && (
            <p className="mt-1 text-sm leading-5">{aviso.texto}</p>
          )}
        </div>

        <button
          type="button"
          onClick={aoFechar}
          className="text-sm font-bold opacity-70 hover:opacity-100"
        >
          X
        </button>
      </div>
    </div>
  );
}

function AbaBotao({ ativa, icone: Icone, texto, aoClicar }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      className={[
        "flex items-center gap-2 border px-4 py-3 text-sm font-bold",
        ativa
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      <Icone size={16} />
      {texto}
    </button>
  );
}

function CampoTexto({
  label,
  secao,
  campo,
  valor,
  aoAlterar,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={valor || ""}
        onChange={(evento) => aoAlterar(secao, campo, evento.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
      />
    </div>
  );
}

function CampoNumero({
  label,
  secao,
  campo,
  valor,
  aoAlterar,
  min = 0,
  max,
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type="number"
        min={min}
        max={max}
        value={valor ?? ""}
        onChange={(evento) => aoAlterar(secao, campo, Number(evento.target.value))}
        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
      />
    </div>
  );
}

function CampoCheckbox({ label, descricao, secao, campo, valor, aoAlterar }) {
  return (
    <label className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4">
      <input
        type="checkbox"
        checked={Boolean(valor)}
        onChange={(evento) => aoAlterar(secao, campo, evento.target.checked)}
        className="mt-0.5 h-5 w-5 sm:h-4 sm:w-4"
      />

      <span>
        <span className="block text-sm font-bold text-slate-800">{label}</span>

        {descricao && (
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {descricao}
          </span>
        )}
      </span>
    </label>
  );
}

function InfoLinha({ label, valor }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {valor || "-"}
      </p>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [abaAtual, setAbaAtual] = useState("geral");
  const [configuracoes, setConfiguracoes] = useState(configuracoesIniciais);
  const [infoSistema, setInfoSistema] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  async function carregarConfiguracoes() {
    setCarregando(true);

    try {
      const dados = await apiRequest("/configuracoes/");

      setConfiguracoes(dados.configuracoes || configuracoesIniciais);
      setInfoSistema(dados.info_sistema || null);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar configurações",
        texto: erro.message,
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  function alterarCampo(secao, campo, valor) {
    setConfiguracoes((estadoAtual) => ({
      ...estadoAtual,
      [secao]: {
        ...(estadoAtual[secao] || {}),
        [campo]: valor,
      },
    }));
  }

  async function salvarConfiguracoes() {
    setSalvando(true);
    setAviso(null);

    try {
      const dados = await apiRequest("/configuracoes/", {
        method: "PUT",
        body: JSON.stringify({
          configuracoes,
        }),
      });

      setConfiguracoes(dados.configuracoes || configuracoes);
      setInfoSistema(dados.info_sistema || infoSistema);

      setAviso({
        tipo: "sucesso",
        titulo: "Configurações salvas",
        texto: dados.mensagem || "As alterações foram gravadas com sucesso.",
      });
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao salvar configurações",
        texto: erro.message,
      });
    } finally {
      setSalvando(false);
    }
  }

  function renderizarAba() {
    if (carregando) {
      return (
        <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Carregando configurações...
        </div>
      );
    }

    if (abaAtual === "geral") {
      return (
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-base font-black text-slate-950">
              Configurações gerais
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Informações básicas exibidas no sistema.
            </p>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <CampoTexto
              label="Nome do sistema"
              secao="geral"
              campo="nome_sistema"
              valor={configuracoes.geral?.nome_sistema}
              aoAlterar={alterarCampo}
            />

            <CampoTexto
              label="Nome da empresa"
              secao="geral"
              campo="nome_empresa"
              valor={configuracoes.geral?.nome_empresa}
              aoAlterar={alterarCampo}
            />

            <CampoTexto
              label="E-mail de suporte"
              secao="geral"
              campo="email_suporte"
              valor={configuracoes.geral?.email_suporte}
              aoAlterar={alterarCampo}
              placeholder="Ex: ti@empresa.com"
              type="email"
            />

            <CampoTexto
              label="Fuso horário"
              secao="geral"
              campo="fuso_horario"
              valor={configuracoes.geral?.fuso_horario}
              aoAlterar={alterarCampo}
              placeholder="America/Porto_Velho"
            />

            <div className="lg:col-span-2">
              <CampoTexto
                label="Texto da tela de login"
                secao="geral"
                campo="texto_login"
                valor={configuracoes.geral?.texto_login}
                aoAlterar={alterarCampo}
              />
            </div>
          </div>
        </div>
      );
    }

    if (abaAtual === "seguranca") {
      return (
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-base font-black text-slate-950">
              Segurança
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Regras de acesso e senha do sistema.
            </p>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <CampoCheckbox
              label="Exigir troca de senha no primeiro acesso"
              descricao="Recomendado para usuários cadastrados com senha temporária."
              secao="seguranca"
              campo="exigir_troca_primeiro_acesso"
              valor={configuracoes.seguranca?.exigir_troca_primeiro_acesso}
              aoAlterar={alterarCampo}
            />

            <CampoNumero
              label="Tamanho mínimo da senha"
              secao="seguranca"
              campo="tamanho_minimo_senha"
              valor={configuracoes.seguranca?.tamanho_minimo_senha}
              aoAlterar={alterarCampo}
              min={6}
              max={30}
            />

            <CampoNumero
              label="Tempo de sessão em horas"
              secao="seguranca"
              campo="tempo_sessao_horas"
              valor={configuracoes.seguranca?.tempo_sessao_horas}
              aoAlterar={alterarCampo}
              min={1}
              max={48}
            />

            <CampoNumero
              label="Bloquear após tentativas"
              secao="seguranca"
              campo="bloquear_apos_tentativas"
              valor={configuracoes.seguranca?.bloquear_apos_tentativas}
              aoAlterar={alterarCampo}
              min={3}
              max={20}
            />
          </div>
        </div>
      );
    }

    if (abaAtual === "backups") {
      return (
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-base font-black text-slate-950">
              Backups
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Parâmetros usados como referência para a rotina de backup.
            </p>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <CampoCheckbox
              label="Backup automático ativo"
              descricao="A rotina atual roda via cron na VPS."
              secao="backups"
              campo="backup_automatico"
              valor={configuracoes.backups?.backup_automatico}
              aoAlterar={alterarCampo}
            />

            <CampoTexto
              label="Horário do backup"
              secao="backups"
              campo="horario_backup"
              valor={configuracoes.backups?.horario_backup}
              aoAlterar={alterarCampo}
              type="time"
            />

            <CampoNumero
              label="Dias de retenção"
              secao="backups"
              campo="dias_retencao"
              valor={configuracoes.backups?.dias_retencao}
              aoAlterar={alterarCampo}
              min={1}
              max={365}
            />

            <CampoTexto
              label="Pasta de destino"
              secao="backups"
              campo="pasta_destino"
              valor={configuracoes.backups?.pasta_destino}
              aoAlterar={alterarCampo}
            />

            <div className="lg:col-span-2 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Essas configurações ficam salvas no sistema. A rotina atual de backup
              continua rodando pela VPS via cron. Depois podemos ligar essa tela
              diretamente ao agendamento automático também.
            </div>
          </div>
        </div>
      );
    }

    if (abaAtual === "relatorios") {
      return (
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-base font-black text-slate-950">
              Relatórios
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Informações padrão para PDF e Excel.
            </p>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <CampoTexto
              label="Nome da empresa nos relatórios"
              secao="relatorios"
              campo="nome_empresa_relatorio"
              valor={configuracoes.relatorios?.nome_empresa_relatorio}
              aoAlterar={alterarCampo}
            />

            <CampoTexto
              label="Responsável padrão"
              secao="relatorios"
              campo="responsavel_padrao"
              valor={configuracoes.relatorios?.responsavel_padrao}
              aoAlterar={alterarCampo}
            />

            <div className="lg:col-span-2">
              <CampoTexto
                label="Rodapé dos PDFs"
                secao="relatorios"
                campo="rodape_pdf"
                valor={configuracoes.relatorios?.rodape_pdf}
                aoAlterar={alterarCampo}
              />
            </div>

            <CampoCheckbox
              label="Mostrar data de emissão"
              descricao="Exibe data/hora no relatório gerado."
              secao="relatorios"
              campo="mostrar_data_emissao"
              valor={configuracoes.relatorios?.mostrar_data_emissao}
              aoAlterar={alterarCampo}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-base font-black text-slate-950">
            Informações do sistema
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Dados técnicos do ambiente atual.
          </p>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <div>
            <InfoLinha label="Servidor" valor={infoSistema?.servidor} />
            <InfoLinha label="Ambiente" valor={infoSistema?.ambiente} />
            <InfoLinha label="Backend" valor={infoSistema?.backend} />
            <InfoLinha label="Banco de dados" valor={infoSistema?.banco} />
            <InfoLinha label="Sistema operacional" valor={infoSistema?.sistema_operacional} />
          </div>

          <div>
            <InfoLinha label="Arquivo de configuração" valor={infoSistema?.arquivo_configuracao} />
            <InfoLinha label="Total de backups" valor={infoSistema?.total_backups} />
            <InfoLinha label="Espaço usado pelos backups" valor={infoSistema?.tamanho_backups} />
            <InfoLinha label="Último backup" valor={infoSistema?.ultimo_backup?.data || "-"} />
            <InfoLinha label="Atualizado em" valor={infoSistema?.atualizado_em} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Configurações do sistema
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ajuste parâmetros gerais, segurança, backups e relatórios.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={carregarConfiguracoes}
            disabled={carregando}
            className="flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <FiRefreshCw size={16} />
            Atualizar
          </button>

          <button
            type="button"
            onClick={salvarConfiguracoes}
            disabled={salvando || carregando}
            className="flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {salvando ? (
              <>
                <span className="h-4 w-4 animate-spin border-2 border-white/40 border-t-white" />
                Salvando...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Salvar configurações
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <AbaBotao
          ativa={abaAtual === "geral"}
          icone={FiSettings}
          texto="Geral"
          aoClicar={() => setAbaAtual("geral")}
        />

        <AbaBotao
          ativa={abaAtual === "seguranca"}
          icone={FiShield}
          texto="Segurança"
          aoClicar={() => setAbaAtual("seguranca")}
        />

        <AbaBotao
          ativa={abaAtual === "backups"}
          icone={FiArchive}
          texto="Backups"
          aoClicar={() => setAbaAtual("backups")}
        />

        <AbaBotao
          ativa={abaAtual === "relatorios"}
          icone={FiFileText}
          texto="Relatórios"
          aoClicar={() => setAbaAtual("relatorios")}
        />

        <AbaBotao
          ativa={abaAtual === "sistema"}
          icone={FiInfo}
          texto="Sistema"
          aoClicar={() => setAbaAtual("sistema")}
        />
      </div>

      {renderizarAba()}

      {!carregando && (
        <div className="mt-5 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
          <FiCheck className="mt-0.5 shrink-0" size={18} />
          As configurações ficam salvas no backend e poderão ser usadas em novas
          regras do sistema sem precisar alterar código diretamente.
        </div>
      )}
    </div>
  );
}