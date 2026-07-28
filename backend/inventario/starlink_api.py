import json
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Equipamento, Setor, Starlink, StarlinkTelemetria


def resposta_erro(mensagem, status=400, extra=None):
    dados = {"ok": False, "erro": mensagem}
    if extra:
        dados.update(extra)
    return JsonResponse(dados, status=status)


def carregar_json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return None


def data_ou_none(valor):
    valor = (valor or "").strip()
    if not valor:
        return None
    data = parse_date(valor)
    if data is None:
        raise ValueError("Data inválida.")
    return data


def decimal_ou_none(valor):
    valor = str(valor or "").strip()
    if "," in valor:
        valor = valor.replace(".", "").replace(",", ".")
    if not valor:
        return None
    try:
        return Decimal(valor)
    except InvalidOperation:
        raise ValueError("Valor inválido.")


def obter_setor(valor):
    if valor in [None, "", "null", "undefined"]:
        return None
    try:
        return Setor.objects.get(pk=int(valor))
    except (TypeError, ValueError, Setor.DoesNotExist):
        raise ValueError("Setor informado não foi encontrado.")


def obter_equipamento(valor, starlink_atual=None):
    if valor in [None, "", "null", "undefined"]:
        return None
    try:
        equipamento = Equipamento.objects.get(pk=int(valor))
    except (TypeError, ValueError, Equipamento.DoesNotExist):
        raise ValueError("Equipamento informado não foi encontrado.")

    vinculadas = Starlink.objects.filter(equipamento=equipamento)
    if starlink_atual and starlink_atual.pk:
        vinculadas = vinculadas.exclude(pk=starlink_atual.pk)
    if vinculadas.exists():
        raise ValueError("Esse equipamento já está vinculado a outra Starlink.")
    return equipamento


def telemetria_para_json(starlink):
    try:
        telemetria = starlink.telemetria
    except StarlinkTelemetria.DoesNotExist:
        return {
            "status_conexao": "desconhecido",
            "status_conexao_display": "Desconhecido",
            "download_mbps": "",
            "upload_mbps": "",
            "latencia_ms": "",
            "perda_pacotes_percentual": "",
            "obstrucao_percentual": "",
            "uptime_segundos": "",
            "ultima_comunicacao": "",
            "atualizado_em": "",
        }

    return {
        "status_conexao": telemetria.status_conexao,
        "status_conexao_display": telemetria.get_status_conexao_display(),
        "download_mbps": str(telemetria.download_mbps) if telemetria.download_mbps is not None else "",
        "upload_mbps": str(telemetria.upload_mbps) if telemetria.upload_mbps is not None else "",
        "latencia_ms": str(telemetria.latencia_ms) if telemetria.latencia_ms is not None else "",
        "perda_pacotes_percentual": str(telemetria.perda_pacotes_percentual) if telemetria.perda_pacotes_percentual is not None else "",
        "obstrucao_percentual": str(telemetria.obstrucao_percentual) if telemetria.obstrucao_percentual is not None else "",
        "uptime_segundos": telemetria.uptime_segundos or "",
        "ultima_comunicacao": telemetria.ultima_comunicacao.strftime("%d/%m/%Y %H:%M") if telemetria.ultima_comunicacao else "",
        "atualizado_em": telemetria.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }


def starlink_para_json(starlink, detalhado=False):
    setor = None
    if starlink.setor:
        setor = {"id": starlink.setor.id, "nome": starlink.setor.nome}

    equipamento = None
    if starlink.equipamento:
        equipamento = {
            "id": starlink.equipamento.id,
            "tipo_display": starlink.equipamento.tipo_outro_descricao
            if starlink.equipamento.tipo == Equipamento.TIPO_OUTRO and starlink.equipamento.tipo_outro_descricao
            else starlink.equipamento.get_tipo_display(),
            "marca": starlink.equipamento.marca,
            "modelo": starlink.equipamento.modelo,
            "patrimonio": starlink.equipamento.patrimonio or "",
        }

    dados = {
        "id": starlink.id,
        "nome": starlink.nome,
        "email_conta": starlink.email_conta,
        "telefone": starlink.telefone,
        "localizacao": starlink.localizacao,
        "plano": starlink.plano,
        "placa": starlink.placa,
        "numero_serie": starlink.numero_serie,
        "modelo": starlink.modelo,
        "status": starlink.status,
        "status_display": starlink.get_status_display(),
        "tipo_utilizacao": starlink.tipo_utilizacao,
        "tipo_utilizacao_display": starlink.get_tipo_utilizacao_display(),
        "responsavel": starlink.responsavel,
        "setor": setor,
        "setor_id": starlink.setor_id,
        "equipamento": equipamento,
        "equipamento_id": starlink.equipamento_id,
        "data_cobranca": starlink.data_ativacao.strftime("%Y-%m-%d") if starlink.data_ativacao else "",
        "valor_mensalidade": str(starlink.valor_mensalidade) if starlink.valor_mensalidade is not None else "",
        "centro_custo": starlink.centro_custo,
        "observacoes": starlink.observacoes,
        "integracao_habilitada": starlink.integracao_habilitada,
        "status_sincronizacao": starlink.status_sincronizacao,
        "status_sincronizacao_display": starlink.get_status_sincronizacao_display(),
        "ultima_sincronizacao": starlink.ultima_sincronizacao.strftime("%d/%m/%Y %H:%M") if starlink.ultima_sincronizacao else "",
        "criado_em": starlink.criado_em.strftime("%d/%m/%Y %H:%M"),
        "atualizado_em": starlink.atualizado_em.strftime("%d/%m/%Y %H:%M"),
        "telemetria": telemetria_para_json(starlink),
    }

    if detalhado:
        dados.update({
            "account_id": starlink.account_id or "",
            "starlink_id": starlink.starlink_id or "",
            "user_terminal_id": starlink.user_terminal_id or "",
            "service_line_id": starlink.service_line_id or "",
            "kit_number": starlink.kit_number or "",
            "mensagem_erro_sincronizacao": starlink.mensagem_erro_sincronizacao,
        })

    return dados


def opcoes_json():
    return {
        "status": [{"value": valor, "label": rotulo} for valor, rotulo in Starlink.STATUS],
        "tipos_utilizacao": [{"value": valor, "label": rotulo} for valor, rotulo in Starlink.TIPOS_UTILIZACAO],
        "status_sincronizacao": [{"value": valor, "label": rotulo} for valor, rotulo in Starlink.STATUS_SINCRONIZACAO],
    }


def aplicar_dados(starlink, dados):
    campos_texto = [
        "nome", "email_conta", "telefone", "localizacao", "plano", "placa",
        "numero_serie", "modelo", "status", "tipo_utilizacao", "responsavel",
        "centro_custo", "observacoes", "account_id", "starlink_id",
        "user_terminal_id", "service_line_id", "kit_number",
    ]

    for campo in campos_texto:
        if campo in dados:
            setattr(starlink, campo, (dados.get(campo) or "").strip())

    if "setor_id" in dados:
        starlink.setor = obter_setor(dados.get("setor_id"))

    if "equipamento_id" in dados:
        starlink.equipamento = obter_equipamento(dados.get("equipamento_id"), starlink_atual=starlink if starlink.pk else None)

    if "data_cobranca" in dados:
        starlink.data_ativacao = data_ou_none(dados.get("data_cobranca"))

    if "valor_mensalidade" in dados:
        starlink.valor_mensalidade = decimal_ou_none(dados.get("valor_mensalidade"))

    if "integracao_habilitada" in dados:
        starlink.integracao_habilitada = bool(dados.get("integracao_habilitada"))

    if starlink.status == Starlink.STATUS_CANCELADA:
        if not starlink.data_cancelamento:
            starlink.data_cancelamento = timezone.localdate()
    else:
        starlink.data_cancelamento = None

    if starlink.integracao_habilitada and starlink.status_sincronizacao == Starlink.SINCRONIZACAO_NAO_CONFIGURADA:
        starlink.status_sincronizacao = Starlink.SINCRONIZACAO_PENDENTE


@csrf_exempt
@require_http_methods(["GET", "POST"])
def starlinks(request):
    if request.method == "GET":
        busca = request.GET.get("q", "").strip()
        status = request.GET.get("status", "").strip()
        tipo_utilizacao = request.GET.get("tipo_utilizacao", "").strip()

        queryset = Starlink.objects.select_related("setor", "equipamento", "telemetria").all()

        if busca:
            queryset = queryset.filter(
                Q(nome__icontains=busca)
                | Q(email_conta__icontains=busca)
                | Q(localizacao__icontains=busca)
                | Q(plano__icontains=busca)
                | Q(placa__icontains=busca)
                | Q(numero_serie__icontains=busca)
                | Q(modelo__icontains=busca)
                | Q(responsavel__icontains=busca)
                | Q(setor__nome__icontains=busca)
            )

        if status:
            queryset = queryset.filter(status=status)

        if tipo_utilizacao:
            queryset = queryset.filter(tipo_utilizacao=tipo_utilizacao)

        total_geral = Starlink.objects.count()
        resumo = {
            "total": total_geral,
            "ativas": Starlink.objects.filter(status=Starlink.STATUS_ATIVA).count(),
            "canceladas": Starlink.objects.filter(status=Starlink.STATUS_CANCELADA).count(),
            "em_espera": Starlink.objects.filter(status=Starlink.STATUS_ESPERA).count(),
            "manutencao": Starlink.objects.filter(status=Starlink.STATUS_MANUTENCAO).count(),
            "moveis": Starlink.objects.filter(tipo_utilizacao__in=[Starlink.TIPO_VEICULO, Starlink.TIPO_MAQUINA]).count(),
            "sem_localizacao": Starlink.objects.filter(localizacao="").count(),
        }

        return JsonResponse({
            "ok": True,
            "total": queryset.count(),
            "resumo": resumo,
            "opcoes": opcoes_json(),
            "resultados": [starlink_para_json(item) for item in queryset],
        })

    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    starlink = Starlink()
    try:
        aplicar_dados(starlink, dados)
        starlink.full_clean()
        starlink.save()
    except ValueError as erro:
        return resposta_erro(str(erro))
    except ValidationError as erro:
        return resposta_erro(erro.message_dict)
    except IntegrityError:
        return resposta_erro("Já existe uma Starlink com esse nome, número de série ou identificador da API.", status=409)

    return JsonResponse({
        "ok": True,
        "mensagem": "Starlink cadastrada com sucesso.",
        "starlink": starlink_para_json(starlink, detalhado=True),
    }, status=201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def starlink_detalhe(request, pk):
    starlink = get_object_or_404(
        Starlink.objects.select_related("setor", "equipamento", "telemetria"),
        pk=pk,
    )

    if request.method == "GET":
        return JsonResponse({
            "ok": True,
            "starlink": starlink_para_json(starlink, detalhado=True),
            "opcoes": opcoes_json(),
        })

    if request.method == "DELETE":
        nome = starlink.nome
        starlink.delete()
        return JsonResponse({"ok": True, "mensagem": f"Starlink {nome} removida com sucesso."})

    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    try:
        aplicar_dados(starlink, dados)
        starlink.full_clean()
        starlink.save()
    except ValueError as erro:
        return resposta_erro(str(erro))
    except ValidationError as erro:
        return resposta_erro(erro.message_dict)
    except IntegrityError:
        return resposta_erro("Já existe outra Starlink com esse nome, número de série ou identificador da API.", status=409)

    return JsonResponse({
        "ok": True,
        "mensagem": "Starlink atualizada com sucesso.",
        "starlink": starlink_para_json(starlink, detalhado=True),
    })
