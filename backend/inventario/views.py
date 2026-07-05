import ipaddress
import json
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import (
    ComputadorUsuario,
    Equipamento,
    EquipamentoFoto,
    ManutencaoEquipamento,
    Setor,
)
from .utils import normalizar_mac


def resposta_erro(mensagem, status=400, extra=None):
    dados = {
        "ok": False,
        "erro": mensagem,
    }

    if extra:
        dados.update(extra)

    return JsonResponse(dados, status=status)


def carregar_json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return None


def validar_ipv4(valor):
    valor = (valor or "").strip()

    try:
        endereco = ipaddress.ip_address(valor)
    except ValueError:
        raise ValueError("IP inválido. Use um IPv4 válido, exemplo: 192.168.1.10.")

    if endereco.version != 4:
        raise ValueError("Informe apenas endereço IPv4.")

    return str(endereco)


def decimal_ou_none(valor):
    valor = str(valor or "").strip().replace(",", ".")

    if not valor:
        return None

    try:
        return Decimal(valor)
    except InvalidOperation:
        raise ValueError("Valor inválido. Use um valor numérico, exemplo: 150.00.")


def inteiro_positivo_ou_none(valor):
    valor = str(valor or "").strip()

    if not valor:
        return None

    try:
        numero = int(valor)
    except ValueError:
        raise ValueError("Informe um número válido.")

    if numero <= 0:
        raise ValueError("Informe um número maior que zero.")

    return numero


def data_ou_none(valor):
    valor = (valor or "").strip()

    if not valor:
        return None

    data = parse_date(valor)

    if data is None:
        raise ValueError("Data inválida.")

    return data


def data_hora_ou_agora(valor):
    valor = (valor or "").strip()

    if not valor:
        return timezone.now()

    data = parse_datetime(valor)

    if data is None:
        raise ValueError("Data inválida.")

    if timezone.is_naive(data):
        data = timezone.make_aware(data, timezone.get_current_timezone())

    return data


def arquivo_url(request, arquivo):
    if not arquivo:
        return ""

    try:
        return request.build_absolute_uri(arquivo.url)
    except ValueError:
        return ""


def setor_para_json(setor):
    return {
        "id": setor.id,
        "nome": setor.nome,
        "responsavel": setor.responsavel,
        "observacoes": setor.observacoes,
        "total_computadores": setor.computadores.count(),
        "total_equipamentos": setor.equipamentos.count(),
        "criado_em": setor.criado_em.strftime("%d/%m/%Y %H:%M"),
        "atualizado_em": setor.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }


def computador_para_json(computador):
    setor = None

    if computador.setor:
        setor = {
            "id": computador.setor.id,
            "nome": computador.setor.nome,
        }

    return {
        "id": computador.id,
        "nome_usuario": computador.nome_usuario,
        "setor": setor,
        "setor_id": computador.setor.id if computador.setor else None,
        "ip_computador": computador.ip_computador,
        "mac_address": computador.mac_address,
        "mostrar_especificacoes": computador.mostrar_especificacoes,
        "processador": computador.processador,
        "memoria_ram": computador.memoria_ram,
        "armazenamento_tipo": computador.armazenamento_tipo,
        "armazenamento_tipo_display": computador.get_armazenamento_tipo_display() if computador.armazenamento_tipo else "",
        "armazenamento_capacidade": computador.armazenamento_capacidade,
        "fonte_watts": computador.fonte_watts or "",
        "observacoes": computador.observacoes,
        "criado_em": computador.criado_em.strftime("%d/%m/%Y %H:%M"),
        "atualizado_em": computador.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }


def equipamento_foto_para_json(foto, request):
    return {
        "id": foto.id,
        "url": arquivo_url(request, foto.arquivo),
        "descricao": foto.descricao,
        "criado_em": foto.criado_em.strftime("%d/%m/%Y %H:%M"),
    }


def equipamento_para_json(equipamento, request):
    setor = None

    if equipamento.setor:
        setor = {
            "id": equipamento.setor.id,
            "nome": equipamento.setor.nome,
        }

    return {
        "id": equipamento.id,
        "tipo": equipamento.tipo,
        "tipo_display": equipamento.get_tipo_display(),
        "patrimonio": equipamento.patrimonio or "",
        "marca": equipamento.marca,
        "modelo": equipamento.modelo,
        "numero_serie": equipamento.numero_serie or "",
        "setor": setor,
        "setor_id": equipamento.setor.id if equipamento.setor else None,
        "usuario_responsavel": equipamento.usuario_responsavel,
        "status": equipamento.status,
        "status_display": equipamento.get_status_display(),
        "produto_novo": equipamento.produto_novo,
        "data_compra": equipamento.data_compra.strftime("%Y-%m-%d") if equipamento.data_compra else "",
        "fornecedor": equipamento.fornecedor,
        "numero_nota_fiscal": equipamento.numero_nota_fiscal,
        "valor_compra": str(equipamento.valor_compra) if equipamento.valor_compra is not None else "",
        "garantia_ate": equipamento.garantia_ate.strftime("%Y-%m-%d") if equipamento.garantia_ate else "",
        "origem": equipamento.origem,
        "origem_display": equipamento.get_origem_display() if equipamento.origem else "",
        "observacoes": equipamento.observacoes,
        "fotos": [
            equipamento_foto_para_json(foto, request)
            for foto in equipamento.fotos.all()
        ],
        "criado_em": equipamento.criado_em.strftime("%d/%m/%Y %H:%M"),
        "atualizado_em": equipamento.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }


def manutencao_para_json(manutencao, request):
    return {
        "id": manutencao.id,
        "equipamento": equipamento_para_json(manutencao.equipamento, request),
        "equipamento_id": manutencao.equipamento.id,
        "tipo_ocorrencia": manutencao.tipo_ocorrencia,
        "tipo_ocorrencia_display": manutencao.get_tipo_ocorrencia_display(),
        "data_ocorrencia": manutencao.data_ocorrencia.strftime("%d/%m/%Y %H:%M"),
        "data_ocorrencia_input": manutencao.data_ocorrencia.strftime("%Y-%m-%dT%H:%M"),
        "responsavel_atendimento": manutencao.responsavel_atendimento,
        "descricao": manutencao.descricao,
        "custo": str(manutencao.custo) if manutencao.custo is not None else "",
        "status": manutencao.status,
        "status_display": manutencao.get_status_display(),
        "criado_em": manutencao.criado_em.strftime("%d/%m/%Y %H:%M"),
        "atualizado_em": manutencao.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }


def montar_duplicados_computador(queryset, ip_computador, mac_address):
    duplicados = []

    for computador in queryset:
        conflitos = []

        if computador.ip_computador == ip_computador:
            conflitos.append("IP")

        if computador.mac_address == mac_address:
            conflitos.append("MAC")

        duplicados.append({
            **computador_para_json(computador),
            "conflitos": conflitos,
        })

    return duplicados


def montar_duplicados_equipamento(queryset, patrimonio, numero_serie, request):
    duplicados = []

    patrimonio = (patrimonio or "").strip()
    numero_serie = (numero_serie or "").strip()

    for equipamento in queryset:
        conflitos = []

        if patrimonio and equipamento.patrimonio and equipamento.patrimonio.lower() == patrimonio.lower():
            conflitos.append("Patrimônio")

        if numero_serie and equipamento.numero_serie and equipamento.numero_serie.lower() == numero_serie.lower():
            conflitos.append("Número de série")

        duplicados.append({
            **equipamento_para_json(equipamento, request),
            "conflitos": conflitos,
        })

    return duplicados


def obter_setor_por_id(setor_id):
    if setor_id in [None, "", "null", "undefined"]:
        return None

    try:
        setor_id = int(setor_id)
    except (TypeError, ValueError):
        raise ValueError("Setor inválido.")

    try:
        return Setor.objects.get(pk=setor_id)
    except Setor.DoesNotExist:
        raise ValueError("Setor informado não foi encontrado.")


def obter_equipamento_por_id(equipamento_id):
    if equipamento_id in [None, "", "null", "undefined"]:
        raise ValueError("Informe o equipamento.")

    try:
        equipamento_id = int(equipamento_id)
    except (TypeError, ValueError):
        raise ValueError("Equipamento inválido.")

    try:
        return (
            Equipamento.objects
            .select_related("setor")
            .prefetch_related("fotos")
            .get(pk=equipamento_id)
        )
    except Equipamento.DoesNotExist:
        raise ValueError("Equipamento informado não foi encontrado.")


@require_http_methods(["GET"])
def dashboard_resumo(request):
    total_computadores = ComputadorUsuario.objects.count()
    total_setores = Setor.objects.count()
    computadores_sem_setor = ComputadorUsuario.objects.filter(setor__isnull=True).count()
    computadores_cadastrados_hoje = ComputadorUsuario.objects.filter(
        criado_em__date=timezone.localdate()
    ).count()

    total_equipamentos = Equipamento.objects.count()
    equipamentos_sem_setor = Equipamento.objects.filter(setor__isnull=True).count()
    equipamentos_sem_responsavel = Equipamento.objects.filter(usuario_responsavel="").count()
    equipamentos_manutencao = Equipamento.objects.filter(status=Equipamento.STATUS_MANUTENCAO).count()

    total_manutencoes = ManutencaoEquipamento.objects.count()
    manutencoes_abertas = ManutencaoEquipamento.objects.filter(status=ManutencaoEquipamento.STATUS_ABERTO).count()
    manutencoes_andamento = ManutencaoEquipamento.objects.filter(status=ManutencaoEquipamento.STATUS_ANDAMENTO).count()
    manutencoes_concluidas = ManutencaoEquipamento.objects.filter(status=ManutencaoEquipamento.STATUS_CONCLUIDO).count()

    ultimos_computadores_queryset = (
        ComputadorUsuario.objects.select_related("setor")
        .order_by("-criado_em")[:5]
    )

    ultimos_equipamentos_queryset = (
        Equipamento.objects.select_related("setor")
        .prefetch_related("fotos")
        .order_by("-criado_em")[:5]
    )

    ultimas_manutencoes_queryset = (
        ManutencaoEquipamento.objects.select_related("equipamento", "equipamento__setor")
        .prefetch_related("equipamento__fotos")
        .order_by("-data_ocorrencia", "-criado_em")[:5]
    )

    computadores_por_setor = []

    for setor in Setor.objects.all():
        total = setor.computadores.count()

        if total > 0:
            computadores_por_setor.append({
                "setor": setor.nome,
                "total": total,
            })

    if computadores_sem_setor > 0:
        computadores_por_setor.append({
            "setor": "Sem setor",
            "total": computadores_sem_setor,
        })

    computadores_por_setor = sorted(
        computadores_por_setor,
        key=lambda item: item["total"],
        reverse=True,
    )

    equipamentos_por_tipo = []

    for valor, rotulo in Equipamento.TIPOS:
        total = Equipamento.objects.filter(tipo=valor).count()

        if total > 0:
            equipamentos_por_tipo.append({
                "tipo": rotulo,
                "total": total,
            })

    equipamentos_por_status = []

    for valor, rotulo in Equipamento.STATUS:
        total = Equipamento.objects.filter(status=valor).count()

        if total > 0:
            equipamentos_por_status.append({
                "status": rotulo,
                "total": total,
            })

    manutencoes_por_status = []

    for valor, rotulo in ManutencaoEquipamento.STATUS:
        total = ManutencaoEquipamento.objects.filter(status=valor).count()

        if total > 0:
            manutencoes_por_status.append({
                "status": rotulo,
                "total": total,
            })

    manutencoes_por_tipo = []

    for valor, rotulo in ManutencaoEquipamento.TIPOS:
        total = ManutencaoEquipamento.objects.filter(tipo_ocorrencia=valor).count()

        if total > 0:
            manutencoes_por_tipo.append({
                "tipo": rotulo,
                "total": total,
            })

    return JsonResponse({
        "ok": True,
        "cards": {
            "total_computadores": total_computadores,
            "total_setores": total_setores,
            "computadores_sem_setor": computadores_sem_setor,
            "cadastrados_hoje": computadores_cadastrados_hoje,
            "total_equipamentos": total_equipamentos,
            "equipamentos_sem_setor": equipamentos_sem_setor,
            "equipamentos_sem_responsavel": equipamentos_sem_responsavel,
            "equipamentos_manutencao": equipamentos_manutencao,
            "total_manutencoes": total_manutencoes,
            "manutencoes_abertas": manutencoes_abertas,
            "manutencoes_andamento": manutencoes_andamento,
            "manutencoes_concluidas": manutencoes_concluidas,
        },
        "computadores_por_setor": computadores_por_setor,
        "equipamentos_por_tipo": equipamentos_por_tipo,
        "equipamentos_por_status": equipamentos_por_status,
        "manutencoes_por_status": manutencoes_por_status,
        "manutencoes_por_tipo": manutencoes_por_tipo,
        "ultimos_computadores": [
            computador_para_json(computador)
            for computador in ultimos_computadores_queryset
        ],
        "ultimos_equipamentos": [
            equipamento_para_json(equipamento, request)
            for equipamento in ultimos_equipamentos_queryset
        ],
        "ultimas_manutencoes": [
            manutencao_para_json(manutencao, request)
            for manutencao in ultimas_manutencoes_queryset
        ],
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def setores(request):
    if request.method == "GET":
        busca = request.GET.get("q", "").strip()

        queryset = Setor.objects.all()

        if busca:
            queryset = queryset.filter(
                Q(nome__icontains=busca)
                | Q(responsavel__icontains=busca)
                | Q(observacoes__icontains=busca)
            )

        return JsonResponse({
            "ok": True,
            "total": queryset.count(),
            "resultados": [setor_para_json(setor) for setor in queryset],
        })

    dados = carregar_json(request)

    if dados is None:
        return resposta_erro("JSON inválido.", status=400)

    nome = (dados.get("nome") or "").strip()
    responsavel = (dados.get("responsavel") or "").strip()
    observacoes = (dados.get("observacoes") or "").strip()

    if not nome:
        return resposta_erro("Informe o nome do setor.")

    setor_duplicado = Setor.objects.filter(nome__iexact=nome).first()

    if setor_duplicado:
        return resposta_erro(
            "Já existe um setor cadastrado com esse nome.",
            status=409,
            extra={
                "setor": setor_para_json(setor_duplicado),
            },
        )

    setor = Setor(
        nome=nome,
        responsavel=responsavel,
        observacoes=observacoes,
    )

    try:
        setor.full_clean()
        setor.save()
    except ValidationError as erro:
        return resposta_erro(erro.message_dict, status=400)
    except IntegrityError:
        return resposta_erro("Já existe um setor cadastrado com esse nome.", status=409)

    return JsonResponse({
        "ok": True,
        "mensagem": "Setor cadastrado com sucesso.",
        "setor": setor_para_json(setor),
    }, status=201)


@csrf_exempt
@require_http_methods(["PUT", "PATCH", "DELETE"])
def setor_detalhe(request, pk):
    setor = get_object_or_404(Setor, pk=pk)

    if request.method == "DELETE":
        nome = setor.nome
        setor.delete()

        return JsonResponse({
            "ok": True,
            "mensagem": f"Setor {nome} removido com sucesso.",
        })

    dados = carregar_json(request)

    if dados is None:
        return resposta_erro("JSON inválido.", status=400)

    nome = (dados.get("nome") or "").strip()
    responsavel = (dados.get("responsavel") or "").strip()
    observacoes = (dados.get("observacoes") or "").strip()

    if not nome:
        return resposta_erro("Informe o nome do setor.")

    setor_duplicado = Setor.objects.exclude(pk=setor.pk).filter(nome__iexact=nome).first()

    if setor_duplicado:
        return resposta_erro(
            "Já existe outro setor cadastrado com esse nome.",
            status=409,
            extra={
                "setor": setor_para_json(setor_duplicado),
            },
        )

    setor.nome = nome
    setor.responsavel = responsavel
    setor.observacoes = observacoes

    try:
        setor.full_clean()
        setor.save()
    except ValidationError as erro:
        return resposta_erro(erro.message_dict, status=400)
    except IntegrityError:
        return resposta_erro("Já existe outro setor cadastrado com esse nome.", status=409)

    return JsonResponse({
        "ok": True,
        "mensagem": "Setor atualizado com sucesso.",
        "setor": setor_para_json(setor),
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def computadores(request):
    if request.method == "GET":
        busca = request.GET.get("q", "").strip()

        queryset = ComputadorUsuario.objects.select_related("setor").all()

        if busca:
            queryset = queryset.filter(
                Q(nome_usuario__icontains=busca)
                | Q(setor__nome__icontains=busca)
                | Q(ip_computador__icontains=busca)
                | Q(mac_address__icontains=busca)
                | Q(processador__icontains=busca)
                | Q(memoria_ram__icontains=busca)
                | Q(armazenamento_tipo__icontains=busca)
                | Q(armazenamento_capacidade__icontains=busca)
                | Q(observacoes__icontains=busca)
            )

        return JsonResponse({
            "ok": True,
            "total": queryset.count(),
            "opcoes": {
                "armazenamentos": [
                    {"value": valor, "label": rotulo}
                    for valor, rotulo in ComputadorUsuario.ARMAZENAMENTO_TIPOS
                ],
            },
            "resultados": [computador_para_json(computador) for computador in queryset],
        })

    dados = carregar_json(request)

    if dados is None:
        return resposta_erro("JSON inválido.", status=400)

    nome_usuario = (dados.get("nome_usuario") or "").strip()
    ip_bruto = (dados.get("ip_computador") or "").strip()
    mac_bruto = (dados.get("mac_address") or "").strip()
    observacoes = (dados.get("observacoes") or "").strip()
    setor_id = dados.get("setor_id")

    mostrar_especificacoes = bool(dados.get("mostrar_especificacoes"))
    processador = (dados.get("processador") or "").strip()
    memoria_ram = (dados.get("memoria_ram") or "").strip()
    armazenamento_tipo = (dados.get("armazenamento_tipo") or "").strip()
    armazenamento_capacidade = (dados.get("armazenamento_capacidade") or "").strip()
    fonte_watts_bruto = dados.get("fonte_watts")

    if not nome_usuario:
        return resposta_erro("Informe o nome do usuário.")

    if not ip_bruto:
        return resposta_erro("Informe o IP do computador.")

    if not mac_bruto:
        return resposta_erro("Informe o endereço MAC do computador.")

    if armazenamento_tipo and armazenamento_tipo not in [valor for valor, _ in ComputadorUsuario.ARMAZENAMENTO_TIPOS]:
        return resposta_erro("Tipo de armazenamento inválido.")

    try:
        ip_computador = validar_ipv4(ip_bruto)
        mac_address = normalizar_mac(mac_bruto)
        setor = obter_setor_por_id(setor_id)
        fonte_watts = inteiro_positivo_ou_none(fonte_watts_bruto)
    except ValueError as erro:
        return resposta_erro(str(erro), status=400)

    duplicados_queryset = ComputadorUsuario.objects.select_related("setor").filter(
        Q(ip_computador=ip_computador) | Q(mac_address=mac_address)
    )

    if duplicados_queryset.exists():
        duplicados = montar_duplicados_computador(
            duplicados_queryset,
            ip_computador,
            mac_address,
        )

        return resposta_erro(
            "Já existe computador cadastrado com esse IP ou endereço MAC.",
            status=409,
            extra={
                "duplicados": duplicados,
            },
        )

    computador = ComputadorUsuario(
        nome_usuario=nome_usuario,
        setor=setor,
        ip_computador=ip_computador,
        mac_address=mac_address,
        mostrar_especificacoes=mostrar_especificacoes,
        processador=processador,
        memoria_ram=memoria_ram,
        armazenamento_tipo=armazenamento_tipo,
        armazenamento_capacidade=armazenamento_capacidade,
        fonte_watts=fonte_watts,
        observacoes=observacoes,
    )

    try:
        computador.full_clean()
        computador.save()
    except ValidationError as erro:
        return resposta_erro(erro.message_dict, status=400)

    return JsonResponse({
        "ok": True,
        "mensagem": "Computador cadastrado com sucesso.",
        "computador": computador_para_json(computador),
    }, status=201)


@csrf_exempt
@require_http_methods(["PUT", "PATCH", "DELETE"])
def computador_detalhe(request, pk):
    computador = get_object_or_404(ComputadorUsuario, pk=pk)

    if request.method == "DELETE":
        computador.delete()

        return JsonResponse({
            "ok": True,
            "mensagem": "Cadastro removido com sucesso.",
        })

    dados = carregar_json(request)

    if dados is None:
        return resposta_erro("JSON inválido.", status=400)

    nome_usuario = (dados.get("nome_usuario") or computador.nome_usuario).strip()
    ip_bruto = (dados.get("ip_computador") or computador.ip_computador).strip()
    mac_bruto = (dados.get("mac_address") or computador.mac_address).strip()
    observacoes = (dados.get("observacoes") or "").strip()
    setor_id = dados.get("setor_id", computador.setor_id)

    mostrar_especificacoes = bool(dados.get("mostrar_especificacoes"))
    processador = (dados.get("processador") or "").strip()
    memoria_ram = (dados.get("memoria_ram") or "").strip()
    armazenamento_tipo = (dados.get("armazenamento_tipo") or "").strip()
    armazenamento_capacidade = (dados.get("armazenamento_capacidade") or "").strip()
    fonte_watts_bruto = dados.get("fonte_watts")

    if not nome_usuario:
        return resposta_erro("Informe o nome do usuário.")

    if not ip_bruto:
        return resposta_erro("Informe o IP do computador.")

    if not mac_bruto:
        return resposta_erro("Informe o endereço MAC do computador.")

    if armazenamento_tipo and armazenamento_tipo not in [valor for valor, _ in ComputadorUsuario.ARMAZENAMENTO_TIPOS]:
        return resposta_erro("Tipo de armazenamento inválido.")

    try:
        ip_computador = validar_ipv4(ip_bruto)
        mac_address = normalizar_mac(mac_bruto)
        setor = obter_setor_por_id(setor_id)
        fonte_watts = inteiro_positivo_ou_none(fonte_watts_bruto)
    except ValueError as erro:
        return resposta_erro(str(erro), status=400)

    duplicados_queryset = ComputadorUsuario.objects.select_related("setor").exclude(pk=computador.pk).filter(
        Q(ip_computador=ip_computador) | Q(mac_address=mac_address)
    )

    if duplicados_queryset.exists():
        duplicados = montar_duplicados_computador(
            duplicados_queryset,
            ip_computador,
            mac_address,
        )

        return resposta_erro(
            "Já existe outro computador cadastrado com esse IP ou endereço MAC.",
            status=409,
            extra={
                "duplicados": duplicados,
            },
        )

    computador.nome_usuario = nome_usuario
    computador.setor = setor
    computador.ip_computador = ip_computador
    computador.mac_address = mac_address
    computador.mostrar_especificacoes = mostrar_especificacoes
    computador.processador = processador
    computador.memoria_ram = memoria_ram
    computador.armazenamento_tipo = armazenamento_tipo
    computador.armazenamento_capacidade = armazenamento_capacidade
    computador.fonte_watts = fonte_watts
    computador.observacoes = observacoes

    try:
        computador.full_clean()
        computador.save()
    except ValidationError as erro:
        return resposta_erro(erro.message_dict, status=400)

    return JsonResponse({
        "ok": True,
        "mensagem": "Cadastro atualizado com sucesso.",
        "computador": computador_para_json(computador),
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def equipamentos(request):
    if request.method == "GET":
        busca = request.GET.get("q", "").strip()

        queryset = Equipamento.objects.select_related("setor").prefetch_related("fotos").all()

        if busca:
            queryset = queryset.filter(
                Q(tipo__icontains=busca)
                | Q(patrimonio__icontains=busca)
                | Q(marca__icontains=busca)
                | Q(modelo__icontains=busca)
                | Q(numero_serie__icontains=busca)
                | Q(setor__nome__icontains=busca)
                | Q(usuario_responsavel__icontains=busca)
                | Q(status__icontains=busca)
                | Q(fornecedor__icontains=busca)
                | Q(numero_nota_fiscal__icontains=busca)
                | Q(origem__icontains=busca)
                | Q(observacoes__icontains=busca)
            ).distinct()

        return JsonResponse({
            "ok": True,
            "total": queryset.count(),
            "opcoes": {
                "tipos": [{"value": valor, "label": rotulo} for valor, rotulo in Equipamento.TIPOS],
                "status": [{"value": valor, "label": rotulo} for valor, rotulo in Equipamento.STATUS],
                "origens": [{"value": valor, "label": rotulo} for valor, rotulo in Equipamento.ORIGENS],
            },
            "resultados": [equipamento_para_json(equipamento, request) for equipamento in queryset],
        })

    dados = carregar_json(request)

    if dados is None:
        return resposta_erro("JSON inválido.", status=400)

    tipo = (dados.get("tipo") or "").strip()
    patrimonio = (dados.get("patrimonio") or "").strip()
    marca = (dados.get("marca") or "").strip()
    modelo = (dados.get("modelo") or "").strip()
    numero_serie = (dados.get("numero_serie") or "").strip()
    setor_id = dados.get("setor_id")
    usuario_responsavel = (dados.get("usuario_responsavel") or "").strip()
    status = (dados.get("status") or Equipamento.STATUS_EM_USO).strip()
    produto_novo = bool(dados.get("produto_novo"))
    data_compra_bruta = (dados.get("data_compra") or "").strip()
    fornecedor = (dados.get("fornecedor") or "").strip()
    numero_nota_fiscal = (dados.get("numero_nota_fiscal") or "").strip()
    valor_compra_bruto = dados.get("valor_compra")
    garantia_ate_bruta = (dados.get("garantia_ate") or "").strip()
    origem = (dados.get("origem") or "").strip()
    observacoes = (dados.get("observacoes") or "").strip()

    if not tipo:
        return resposta_erro("Informe o tipo do equipamento.")

    if status not in [valor for valor, _ in Equipamento.STATUS]:
        return resposta_erro("Status inválido.")

    if tipo not in [valor for valor, _ in Equipamento.TIPOS]:
        return resposta_erro("Tipo de equipamento inválido.")

    if origem and origem not in [valor for valor, _ in Equipamento.ORIGENS]:
        return resposta_erro("Origem inválida.")

    try:
        setor = obter_setor_por_id(setor_id)
        data_compra = data_ou_none(data_compra_bruta)
        garantia_ate = data_ou_none(garantia_ate_bruta)
        valor_compra = decimal_ou_none(valor_compra_bruto)
    except ValueError as erro:
        return resposta_erro(str(erro), status=400)

    filtros_duplicados = Q()

    if patrimonio:
        filtros_duplicados |= Q(patrimonio__iexact=patrimonio)

    if numero_serie:
        filtros_duplicados |= Q(numero_serie__iexact=numero_serie)

    if filtros_duplicados:
        duplicados_queryset = Equipamento.objects.select_related("setor").prefetch_related("fotos").filter(filtros_duplicados)

        if duplicados_queryset.exists():
            duplicados = montar_duplicados_equipamento(
                duplicados_queryset,
                patrimonio,
                numero_serie,
                request,
            )

            return resposta_erro(
                "Já existe equipamento cadastrado com esse patrimônio ou número de série.",
                status=409,
                extra={
                    "duplicados": duplicados,
                },
            )

    equipamento = Equipamento(
        tipo=tipo,
        patrimonio=patrimonio or None,
        marca=marca,
        modelo=modelo,
        numero_serie=numero_serie or None,
        setor=setor,
        usuario_responsavel=usuario_responsavel,
        status=status,
        produto_novo=produto_novo,
        data_compra=data_compra,
        fornecedor=fornecedor,
        numero_nota_fiscal=numero_nota_fiscal,
        valor_compra=valor_compra,
        garantia_ate=garantia_ate,
        origem=origem,
        observacoes=observacoes,
    )

    try:
        equipamento.full_clean()
        equipamento.save()
    except ValidationError as erro:
        return resposta_erro(erro.message_dict, status=400)
    except IntegrityError:
        return resposta_erro(
            "Já existe equipamento cadastrado com esse patrimônio ou número de série.",
            status=409,
        )

    return JsonResponse({
        "ok": True,
        "mensagem": "Equipamento cadastrado com sucesso.",
        "equipamento": equipamento_para_json(equipamento, request),
    }, status=201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def equipamento_detalhe(request, pk):
    equipamento = get_object_or_404(
        Equipamento.objects.select_related("setor").prefetch_related("fotos"),
        pk=pk,
    )

    if request.method == "GET":
        manutencoes_queryset = (
            ManutencaoEquipamento.objects
            .select_related("equipamento", "equipamento__setor")
            .prefetch_related("equipamento__fotos")
            .filter(equipamento=equipamento)
            .order_by("-data_ocorrencia", "-criado_em")
        )

        return JsonResponse({
            "ok": True,
            "equipamento": equipamento_para_json(equipamento, request),
            "manutencoes": [
                manutencao_para_json(manutencao, request)
                for manutencao in manutencoes_queryset
            ],
            "opcoes_manutencao": {
                "tipos": [
                    {"value": valor, "label": rotulo}
                    for valor, rotulo in ManutencaoEquipamento.TIPOS
                ],
                "status": [
                    {"value": valor, "label": rotulo}
                    for valor, rotulo in ManutencaoEquipamento.STATUS
                ],
            },
        })

    if request.method == "DELETE":
        equipamento.delete()

        return JsonResponse({
            "ok": True,
            "mensagem": "Equipamento removido com sucesso.",
        })

    dados = carregar_json(request)

    if dados is None:
        return resposta_erro("JSON inválido.", status=400)

    tipo = (dados.get("tipo") or "").strip()
    patrimonio = (dados.get("patrimonio") or "").strip()
    marca = (dados.get("marca") or "").strip()
    modelo = (dados.get("modelo") or "").strip()
    numero_serie = (dados.get("numero_serie") or "").strip()
    setor_id = dados.get("setor_id")
    usuario_responsavel = (dados.get("usuario_responsavel") or "").strip()
    status = (dados.get("status") or "").strip()
    produto_novo = bool(dados.get("produto_novo"))
    data_compra_bruta = (dados.get("data_compra") or "").strip()
    fornecedor = (dados.get("fornecedor") or "").strip()
    numero_nota_fiscal = (dados.get("numero_nota_fiscal") or "").strip()
    valor_compra_bruto = dados.get("valor_compra")
    garantia_ate_bruta = (dados.get("garantia_ate") or "").strip()
    origem = (dados.get("origem") or "").strip()
    observacoes = (dados.get("observacoes") or "").strip()

    if not tipo:
        return resposta_erro("Informe o tipo do equipamento.")

    if status not in [valor for valor, _ in Equipamento.STATUS]:
        return resposta_erro("Status inválido.")

    if tipo not in [valor for valor, _ in Equipamento.TIPOS]:
        return resposta_erro("Tipo de equipamento inválido.")

    if origem and origem not in [valor for valor, _ in Equipamento.ORIGENS]:
        return resposta_erro("Origem inválida.")

    try:
        setor = obter_setor_por_id(setor_id)
        data_compra = data_ou_none(data_compra_bruta)
        garantia_ate = data_ou_none(garantia_ate_bruta)
        valor_compra = decimal_ou_none(valor_compra_bruto)
    except ValueError as erro:
        return resposta_erro(str(erro), status=400)

    filtros_duplicados = Q()

    if patrimonio:
        filtros_duplicados |= Q(patrimonio__iexact=patrimonio)

    if numero_serie:
        filtros_duplicados |= Q(numero_serie__iexact=numero_serie)

    if filtros_duplicados:
        duplicados_queryset = (
            Equipamento.objects.select_related("setor")
            .prefetch_related("fotos")
            .exclude(pk=equipamento.pk)
            .filter(filtros_duplicados)
        )

        if duplicados_queryset.exists():
            duplicados = montar_duplicados_equipamento(
                duplicados_queryset,
                patrimonio,
                numero_serie,
                request,
            )

            return resposta_erro(
                "Já existe outro equipamento cadastrado com esse patrimônio ou número de série.",
                status=409,
                extra={
                    "duplicados": duplicados,
                },
            )

    equipamento.tipo = tipo
    equipamento.patrimonio = patrimonio or None
    equipamento.marca = marca
    equipamento.modelo = modelo
    equipamento.numero_serie = numero_serie or None
    equipamento.setor = setor
    equipamento.usuario_responsavel = usuario_responsavel
    equipamento.status = status
    equipamento.produto_novo = produto_novo
    equipamento.data_compra = data_compra
    equipamento.fornecedor = fornecedor
    equipamento.numero_nota_fiscal = numero_nota_fiscal
    equipamento.valor_compra = valor_compra
    equipamento.garantia_ate = garantia_ate
    equipamento.origem = origem
    equipamento.observacoes = observacoes

    try:
        equipamento.full_clean()
        equipamento.save()
    except ValidationError as erro:
        return resposta_erro(erro.message_dict, status=400)
    except IntegrityError:
        return resposta_erro(
            "Já existe outro equipamento cadastrado com esse patrimônio ou número de série.",
            status=409,
        )

    return JsonResponse({
        "ok": True,
        "mensagem": "Equipamento atualizado com sucesso.",
        "equipamento": equipamento_para_json(equipamento, request),
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def equipamento_fotos(request, pk):
    equipamento = get_object_or_404(
        Equipamento.objects.select_related("setor").prefetch_related("fotos"),
        pk=pk,
    )

    if request.method == "GET":
        return JsonResponse({
            "ok": True,
            "fotos": [
                equipamento_foto_para_json(foto, request)
                for foto in equipamento.fotos.all()
            ],
        })

    arquivos = request.FILES.getlist("fotos")

    if not arquivos:
        arquivo_unico = request.FILES.get("foto")

        if arquivo_unico:
            arquivos = [arquivo_unico]

    if not arquivos:
        return resposta_erro("Envie pelo menos uma foto.", status=400)

    fotos_criadas = []

    for arquivo in arquivos:
        foto = EquipamentoFoto.objects.create(
            equipamento=equipamento,
            arquivo=arquivo,
            descricao=(request.POST.get("descricao") or "").strip(),
        )

        fotos_criadas.append(foto)

    return JsonResponse({
        "ok": True,
        "mensagem": "Foto(s) anexada(s) com sucesso.",
        "fotos": [
            equipamento_foto_para_json(foto, request)
            for foto in fotos_criadas
        ],
        "equipamento": equipamento_para_json(equipamento, request),
    }, status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
def equipamento_foto_detalhe(request, pk):
    foto = get_object_or_404(EquipamentoFoto, pk=pk)
    foto.delete()

    return JsonResponse({
        "ok": True,
        "mensagem": "Foto removida com sucesso.",
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def manutencoes(request):
    if request.method == "GET":
        busca = request.GET.get("q", "").strip()
        equipamento_id = request.GET.get("equipamento_id", "").strip()

        queryset = (
            ManutencaoEquipamento.objects
            .select_related("equipamento", "equipamento__setor")
            .prefetch_related("equipamento__fotos")
            .all()
        )

        if equipamento_id:
            queryset = queryset.filter(equipamento_id=equipamento_id)

        if busca:
            queryset = queryset.filter(
                Q(equipamento__patrimonio__icontains=busca)
                | Q(equipamento__marca__icontains=busca)
                | Q(equipamento__modelo__icontains=busca)
                | Q(equipamento__numero_serie__icontains=busca)
                | Q(equipamento__usuario_responsavel__icontains=busca)
                | Q(equipamento__setor__nome__icontains=busca)
                | Q(tipo_ocorrencia__icontains=busca)
                | Q(status__icontains=busca)
                | Q(responsavel_atendimento__icontains=busca)
                | Q(descricao__icontains=busca)
            )

        return JsonResponse({
            "ok": True,
            "total": queryset.count(),
            "opcoes": {
                "tipos": [{"value": valor, "label": rotulo} for valor, rotulo in ManutencaoEquipamento.TIPOS],
                "status": [{"value": valor, "label": rotulo} for valor, rotulo in ManutencaoEquipamento.STATUS],
            },
            "resultados": [manutencao_para_json(manutencao, request) for manutencao in queryset],
        })

    dados = carregar_json(request)

    if dados is None:
        return resposta_erro("JSON inválido.", status=400)

    equipamento_id = dados.get("equipamento_id")
    tipo_ocorrencia = (dados.get("tipo_ocorrencia") or ManutencaoEquipamento.TIPO_MANUTENCAO).strip()
    data_ocorrencia_bruta = (dados.get("data_ocorrencia") or "").strip()
    responsavel_atendimento = (dados.get("responsavel_atendimento") or "").strip()
    descricao = (dados.get("descricao") or "").strip()
    custo_bruto = dados.get("custo")
    status = (dados.get("status") or ManutencaoEquipamento.STATUS_ABERTO).strip()

    if tipo_ocorrencia not in [valor for valor, _ in ManutencaoEquipamento.TIPOS]:
        return resposta_erro("Tipo de ocorrência inválido.")

    if status not in [valor for valor, _ in ManutencaoEquipamento.STATUS]:
        return resposta_erro("Status inválido.")

    if not descricao:
        return resposta_erro("Informe a descrição do serviço.")

    try:
        equipamento = obter_equipamento_por_id(equipamento_id)
        data_ocorrencia = data_hora_ou_agora(data_ocorrencia_bruta)
        custo = decimal_ou_none(custo_bruto)
    except ValueError as erro:
        return resposta_erro(str(erro), status=400)

    manutencao = ManutencaoEquipamento(
        equipamento=equipamento,
        tipo_ocorrencia=tipo_ocorrencia,
        data_ocorrencia=data_ocorrencia,
        responsavel_atendimento=responsavel_atendimento,
        descricao=descricao,
        custo=custo,
        status=status,
    )

    try:
        manutencao.full_clean()
        manutencao.save()
    except ValidationError as erro:
        return resposta_erro(erro.message_dict, status=400)

    if status in [ManutencaoEquipamento.STATUS_ABERTO, ManutencaoEquipamento.STATUS_ANDAMENTO]:
        equipamento.status = Equipamento.STATUS_MANUTENCAO
        equipamento.save()

    return JsonResponse({
        "ok": True,
        "mensagem": "Histórico/manutenção cadastrado com sucesso.",
        "manutencao": manutencao_para_json(manutencao, request),
    }, status=201)


@csrf_exempt
@require_http_methods(["PUT", "PATCH", "DELETE"])
def manutencao_detalhe(request, pk):
    manutencao = get_object_or_404(
        ManutencaoEquipamento.objects
        .select_related("equipamento", "equipamento__setor")
        .prefetch_related("equipamento__fotos"),
        pk=pk,
    )

    if request.method == "DELETE":
        manutencao.delete()

        return JsonResponse({
            "ok": True,
            "mensagem": "Registro removido com sucesso.",
        })

    dados = carregar_json(request)

    if dados is None:
        return resposta_erro("JSON inválido.", status=400)

    equipamento_id = dados.get("equipamento_id")
    tipo_ocorrencia = (dados.get("tipo_ocorrencia") or "").strip()
    data_ocorrencia_bruta = (dados.get("data_ocorrencia") or "").strip()
    responsavel_atendimento = (dados.get("responsavel_atendimento") or "").strip()
    descricao = (dados.get("descricao") or "").strip()
    custo_bruto = dados.get("custo")
    status = (dados.get("status") or "").strip()

    if tipo_ocorrencia not in [valor for valor, _ in ManutencaoEquipamento.TIPOS]:
        return resposta_erro("Tipo de ocorrência inválido.")

    if status not in [valor for valor, _ in ManutencaoEquipamento.STATUS]:
        return resposta_erro("Status inválido.")

    if not descricao:
        return resposta_erro("Informe a descrição do serviço.")

    try:
        equipamento = obter_equipamento_por_id(equipamento_id)
        data_ocorrencia = data_hora_ou_agora(data_ocorrencia_bruta)
        custo = decimal_ou_none(custo_bruto)
    except ValueError as erro:
        return resposta_erro(str(erro), status=400)

    manutencao.equipamento = equipamento
    manutencao.tipo_ocorrencia = tipo_ocorrencia
    manutencao.data_ocorrencia = data_ocorrencia
    manutencao.responsavel_atendimento = responsavel_atendimento
    manutencao.descricao = descricao
    manutencao.custo = custo
    manutencao.status = status

    try:
        manutencao.full_clean()
        manutencao.save()
    except ValidationError as erro:
        return resposta_erro(erro.message_dict, status=400)

    if status in [ManutencaoEquipamento.STATUS_ABERTO, ManutencaoEquipamento.STATUS_ANDAMENTO]:
        equipamento.status = Equipamento.STATUS_MANUTENCAO
        equipamento.save()

    return JsonResponse({
        "ok": True,
        "mensagem": "Histórico/manutenção atualizado com sucesso.",
        "manutencao": manutencao_para_json(manutencao, request),
    })