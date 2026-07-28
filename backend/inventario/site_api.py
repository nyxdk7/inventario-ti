import json

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q, Sum
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import (
    ComputadorUsuario,
    Equipamento,
    PatchPanel,
    PatchPanelPorta,
    RackAtivo,
    Setor,
    SiteRack,
    SwitchPorta,
    SwitchRede,
)


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


def inteiro_positivo(valor, nome, minimo=1, maximo=None):
    try:
        numero = int(valor)
    except (TypeError, ValueError):
        raise ValueError(f"Informe um valor válido para {nome}.")

    if numero < minimo or (maximo is not None and numero > maximo):
        limite = f" entre {minimo} e {maximo}" if maximo is not None else f" maior ou igual a {minimo}"
        raise ValueError(f"Informe {nome}{limite}.")
    return numero


def obter_setor(valor):
    if valor in [None, "", "null", "undefined"]:
        return None
    try:
        return Setor.objects.get(pk=int(valor))
    except (TypeError, ValueError, Setor.DoesNotExist):
        raise ValueError("Setor informado não foi encontrado.")


def obter_equipamento(valor, ativo_atual=None):
    if valor in [None, "", "null", "undefined"]:
        return None
    try:
        equipamento = Equipamento.objects.get(pk=int(valor))
    except (TypeError, ValueError, Equipamento.DoesNotExist):
        raise ValueError("Equipamento informado não foi encontrado.")

    vinculados = RackAtivo.objects.filter(equipamento=equipamento)
    if ativo_atual and ativo_atual.pk:
        vinculados = vinculados.exclude(pk=ativo_atual.pk)
    if vinculados.exists():
        raise ValueError("Esse equipamento já está instalado em outro rack.")
    return equipamento


def obter_switch(valor, ativo_atual=None):
    if valor in [None, "", "null", "undefined"]:
        return None
    try:
        switch = SwitchRede.objects.get(pk=int(valor))
    except (TypeError, ValueError, SwitchRede.DoesNotExist):
        raise ValueError("Switch informado não foi encontrado.")

    vinculados = RackAtivo.objects.filter(switch_rede=switch)
    if ativo_atual and ativo_atual.pk:
        vinculados = vinculados.exclude(pk=ativo_atual.pk)
    if vinculados.exists():
        raise ValueError("Esse switch já está instalado em outro rack.")
    return switch


def obter_computador(valor):
    if valor in [None, "", "null", "undefined"]:
        return None
    try:
        return ComputadorUsuario.objects.get(pk=int(valor))
    except (TypeError, ValueError, ComputadorUsuario.DoesNotExist):
        raise ValueError("Computador informado não foi encontrado.")


def obter_switch_porta(valor):
    if valor in [None, "", "null", "undefined"]:
        return None
    try:
        return SwitchPorta.objects.select_related("switch").get(pk=int(valor))
    except (TypeError, ValueError, SwitchPorta.DoesNotExist):
        raise ValueError("Porta de switch informada não foi encontrada.")


def equipamento_resumo(equipamento):
    if not equipamento:
        return None
    tipo = (
        equipamento.tipo_outro_descricao
        if equipamento.tipo == Equipamento.TIPO_OUTRO and equipamento.tipo_outro_descricao
        else equipamento.get_tipo_display()
    )
    return {
        "id": equipamento.id,
        "tipo_display": tipo,
        "marca": equipamento.marca,
        "modelo": equipamento.modelo,
        "patrimonio": equipamento.patrimonio or "",
        "numero_serie": equipamento.numero_serie or "",
    }


def switch_resumo(switch):
    if not switch:
        return None
    return {
        "id": switch.id,
        "nome": switch.nome,
        "marca": switch.marca,
        "modelo": switch.modelo,
        "ip_gerenciamento": str(switch.ip_gerenciamento or ""),
        "quantidade_portas": switch.quantidade_portas,
        "status": switch.status,
        "status_display": switch.get_status_display(),
    }


def porta_patch_para_json(porta):
    return {
        "id": porta.id,
        "numero": porta.numero,
        "status": porta.status,
        "status_display": porta.get_status_display(),
        "identificacao": porta.identificacao,
        "ponto_logico": porta.ponto_logico,
        "local_destino": porta.local_destino,
        "setor": {"id": porta.setor.id, "nome": porta.setor.nome} if porta.setor else None,
        "setor_id": porta.setor_id,
        "computador": {
            "id": porta.computador.id,
            "nome_usuario": porta.computador.nome_usuario,
            "ip_computador": porta.computador.ip_computador,
            "mac_address": porta.computador.mac_address,
        } if porta.computador else None,
        "computador_id": porta.computador_id,
        "equipamento": equipamento_resumo(porta.equipamento),
        "equipamento_id": porta.equipamento_id,
        "switch_porta": {
            "id": porta.switch_porta.id,
            "numero": porta.switch_porta.numero,
            "switch_id": porta.switch_porta.switch_id,
            "switch_nome": porta.switch_porta.switch.nome,
        } if porta.switch_porta else None,
        "switch_porta_id": porta.switch_porta_id,
        "observacoes": porta.observacoes,
        "atualizado_em": porta.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }


def patch_panel_para_json(patch_panel):
    portas = patch_panel.portas.select_related(
        "setor", "computador", "equipamento", "switch_porta", "switch_porta__switch"
    ).all()
    return {
        "id": patch_panel.id,
        "quantidade_portas": patch_panel.quantidade_portas,
        "categoria": patch_panel.categoria,
        "categoria_display": patch_panel.get_categoria_display(),
        "tipo_conector": patch_panel.tipo_conector,
        "tipo_conector_display": patch_panel.get_tipo_conector_display(),
        "identificacao": patch_panel.identificacao,
        "observacoes": patch_panel.observacoes,
        "portas": [porta_patch_para_json(porta) for porta in portas],
        "resumo": {
            "livres": portas.filter(status=PatchPanelPorta.STATUS_LIVRE).count(),
            "em_uso": portas.filter(status=PatchPanelPorta.STATUS_EM_USO).count(),
            "reserva": portas.filter(status=PatchPanelPorta.STATUS_RESERVA).count(),
            "defeituosas": portas.filter(status=PatchPanelPorta.STATUS_DEFEITUOSA).count(),
        },
    }


def ativo_para_json(ativo, detalhado=False):
    dados = {
        "id": ativo.id,
        "site_id": ativo.site_id,
        "nome": ativo.nome,
        "tipo": ativo.tipo,
        "tipo_display": ativo.tipo_outro_descricao if ativo.tipo == RackAtivo.TIPO_OUTRO and ativo.tipo_outro_descricao else ativo.get_tipo_display(),
        "tipo_outro_descricao": ativo.tipo_outro_descricao,
        "lado": ativo.lado,
        "lado_display": ativo.get_lado_display(),
        "posicao_u": ativo.posicao_u,
        "posicao_u_final": ativo.posicao_u_final,
        "altura_u": ativo.altura_u,
        "marca": ativo.marca,
        "modelo": ativo.modelo,
        "patrimonio": ativo.patrimonio or "",
        "numero_serie": ativo.numero_serie or "",
        "ip_gerenciamento": str(ativo.ip_gerenciamento or ""),
        "mac_address": ativo.mac_address,
        "status": ativo.status,
        "status_display": ativo.get_status_display(),
        "equipamento": equipamento_resumo(ativo.equipamento),
        "equipamento_id": ativo.equipamento_id,
        "switch_rede": switch_resumo(ativo.switch_rede),
        "switch_rede_id": ativo.switch_rede_id,
        "observacoes": ativo.observacoes,
        "criado_em": ativo.criado_em.strftime("%d/%m/%Y %H:%M"),
        "atualizado_em": ativo.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }

    if ativo.tipo == RackAtivo.TIPO_PATCH_PANEL:
        try:
            dados["patch_panel"] = patch_panel_para_json(ativo.patch_panel)
        except PatchPanel.DoesNotExist:
            dados["patch_panel"] = None
    elif detalhado:
        dados["patch_panel"] = None

    return dados


def site_para_json(site, detalhado=False):
    ativos = site.ativos.select_related("equipamento", "switch_rede").all()
    total_u = ativos.aggregate(total=Sum("altura_u"))["total"] or 0
    usados_frente = ativos.filter(lado=RackAtivo.LADO_FRENTE).aggregate(total=Sum("altura_u"))["total"] or 0
    usados_traseira = ativos.filter(lado=RackAtivo.LADO_TRASEIRA).aggregate(total=Sum("altura_u"))["total"] or 0

    dados = {
        "id": site.id,
        "nome": site.nome,
        "codigo": site.codigo or "",
        "setor": {"id": site.setor.id, "nome": site.setor.nome} if site.setor else None,
        "setor_id": site.setor_id,
        "localizacao": site.localizacao,
        "responsavel": site.responsavel,
        "altura_u": site.altura_u,
        "largura_polegadas": site.largura_polegadas,
        "status": site.status,
        "status_display": site.get_status_display(),
        "observacoes": site.observacoes,
        "total_ativos": ativos.count(),
        "ocupacao": {
            "total_u_somado": total_u,
            "usados_frente": usados_frente,
            "livres_frente": max(site.altura_u - usados_frente, 0),
            "percentual_frente": round((usados_frente / site.altura_u) * 100, 1) if site.altura_u else 0,
            "usados_traseira": usados_traseira,
            "livres_traseira": max(site.altura_u - usados_traseira, 0),
            "percentual_traseira": round((usados_traseira / site.altura_u) * 100, 1) if site.altura_u else 0,
        },
        "criado_em": site.criado_em.strftime("%d/%m/%Y %H:%M"),
        "atualizado_em": site.atualizado_em.strftime("%d/%m/%Y %H:%M"),
    }

    if detalhado:
        dados["ativos"] = [ativo_para_json(ativo, detalhado=True) for ativo in ativos]

    return dados


def opcoes_json():
    return {
        "status_sites": [{"value": valor, "label": rotulo} for valor, rotulo in SiteRack.STATUS],
        "tipos_ativos": [{"value": valor, "label": rotulo} for valor, rotulo in RackAtivo.TIPOS],
        "status_ativos": [{"value": valor, "label": rotulo} for valor, rotulo in RackAtivo.STATUS],
        "lados": [{"value": valor, "label": rotulo} for valor, rotulo in RackAtivo.LADOS],
        "categorias_patch": [{"value": valor, "label": rotulo} for valor, rotulo in PatchPanel.CATEGORIAS],
        "conectores_patch": [{"value": valor, "label": rotulo} for valor, rotulo in PatchPanel.CONECTORES],
        "status_portas_patch": [{"value": valor, "label": rotulo} for valor, rotulo in PatchPanelPorta.STATUS],
    }


def aplicar_dados_site(site, dados):
    for campo in ["nome", "codigo", "localizacao", "responsavel", "status", "observacoes"]:
        if campo in dados:
            setattr(site, campo, (dados.get(campo) or "").strip())

    if "setor_id" in dados:
        site.setor = obter_setor(dados.get("setor_id"))
    if "altura_u" in dados:
        site.altura_u = inteiro_positivo(dados.get("altura_u"), "altura do rack", 4, 52)
    if "largura_polegadas" in dados:
        site.largura_polegadas = inteiro_positivo(dados.get("largura_polegadas"), "largura do rack", 10, 23)


def aplicar_dados_ativo(ativo, dados):
    campos_texto = [
        "nome", "tipo", "tipo_outro_descricao", "lado", "marca", "modelo",
        "patrimonio", "numero_serie", "ip_gerenciamento", "mac_address",
        "status", "observacoes",
    ]
    for campo in campos_texto:
        if campo in dados:
            valor = dados.get(campo)
            setattr(ativo, campo, (valor or "").strip() if isinstance(valor, str) or valor is None else valor)

    if "posicao_u" in dados:
        ativo.posicao_u = inteiro_positivo(dados.get("posicao_u"), "posição U", 1, 52)
    if "altura_u" in dados:
        ativo.altura_u = inteiro_positivo(dados.get("altura_u"), "altura do ativo", 1, 20)
    if "equipamento_id" in dados:
        ativo.equipamento = obter_equipamento(dados.get("equipamento_id"), ativo_atual=ativo if ativo.pk else None)
    if "switch_rede_id" in dados:
        ativo.switch_rede = obter_switch(dados.get("switch_rede_id"), ativo_atual=ativo if ativo.pk else None)


def sincronizar_portas_patch(patch_panel, quantidade):
    existentes = set(patch_panel.portas.values_list("numero", flat=True))
    criar = [
        PatchPanelPorta(patch_panel=patch_panel, numero=numero)
        for numero in range(1, quantidade + 1)
        if numero not in existentes
    ]
    if criar:
        PatchPanelPorta.objects.bulk_create(criar)
    patch_panel.portas.filter(numero__gt=quantidade).delete()


def aplicar_patch_panel(ativo, dados):
    if ativo.tipo != RackAtivo.TIPO_PATCH_PANEL:
        PatchPanel.objects.filter(ativo=ativo).delete()
        return None

    patch_dados = dados.get("patch_panel") or {}
    try:
        patch = ativo.patch_panel
    except PatchPanel.DoesNotExist:
        patch = PatchPanel(ativo=ativo)

    if "quantidade_portas" in patch_dados:
        patch.quantidade_portas = inteiro_positivo(
            patch_dados.get("quantidade_portas"), "quantidade de portas", 4, 96
        )
    for campo in ["categoria", "tipo_conector", "identificacao", "observacoes"]:
        if campo in patch_dados:
            setattr(patch, campo, (patch_dados.get(campo) or "").strip())

    patch.full_clean()
    patch.save()
    sincronizar_portas_patch(patch, patch.quantidade_portas)
    return patch


@csrf_exempt
@require_http_methods(["GET", "POST"])
def sites(request):
    if request.method == "GET":
        busca = request.GET.get("q", "").strip()
        status = request.GET.get("status", "").strip()
        queryset = SiteRack.objects.select_related("setor").prefetch_related("ativos").all()

        if busca:
            queryset = queryset.filter(
                Q(nome__icontains=busca)
                | Q(codigo__icontains=busca)
                | Q(localizacao__icontains=busca)
                | Q(responsavel__icontains=busca)
                | Q(setor__nome__icontains=busca)
                | Q(ativos__nome__icontains=busca)
            ).distinct()
        if status:
            queryset = queryset.filter(status=status)

        return JsonResponse({
            "ok": True,
            "total": queryset.count(),
            "resumo": {
                "total": SiteRack.objects.count(),
                "ativos": SiteRack.objects.filter(status=SiteRack.STATUS_ATIVO).count(),
                "planejamento": SiteRack.objects.filter(status=SiteRack.STATUS_PLANEJAMENTO).count(),
                "total_ativos": RackAtivo.objects.count(),
                "patch_panels": RackAtivo.objects.filter(tipo=RackAtivo.TIPO_PATCH_PANEL).count(),
                "switches": RackAtivo.objects.filter(tipo=RackAtivo.TIPO_SWITCH).count(),
            },
            "opcoes": opcoes_json(),
            "resultados": [site_para_json(site) for site in queryset],
        })

    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    site = SiteRack()
    try:
        aplicar_dados_site(site, dados)
        site.full_clean()
        site.save()
    except ValueError as erro:
        return resposta_erro(str(erro))
    except ValidationError as erro:
        return resposta_erro(erro.message_dict)
    except IntegrityError:
        return resposta_erro("Já existe um site / rack com esse nome ou código.", status=409)

    return JsonResponse({
        "ok": True,
        "mensagem": "Site / rack cadastrado com sucesso.",
        "site": site_para_json(site, detalhado=True),
    }, status=201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def site_detalhe(request, pk):
    site = get_object_or_404(SiteRack.objects.select_related("setor"), pk=pk)

    if request.method == "GET":
        equipamentos = Equipamento.objects.filter(ativo_rack__isnull=True).select_related("setor")
        equipamentos_portas = Equipamento.objects.select_related("setor").all()
        switches = SwitchRede.objects.filter(ativo_rack__isnull=True).select_related("setor")
        computadores = ComputadorUsuario.objects.select_related("setor").all()
        setores = Setor.objects.all()
        switch_portas = SwitchPorta.objects.select_related("switch").order_by("switch__nome", "numero")

        return JsonResponse({
            "ok": True,
            "site": site_para_json(site, detalhado=True),
            "opcoes": opcoes_json(),
            "relacionamentos": {
                "setores": [{"id": item.id, "nome": item.nome} for item in setores],
                "equipamentos": [equipamento_resumo(item) for item in equipamentos],
                "equipamentos_portas": [equipamento_resumo(item) for item in equipamentos_portas],
                "switches": [switch_resumo(item) for item in switches],
                "computadores": [{
                    "id": item.id,
                    "nome_usuario": item.nome_usuario,
                    "ip_computador": item.ip_computador,
                    "mac_address": item.mac_address,
                } for item in computadores],
                "switch_portas": [{
                    "id": item.id,
                    "numero": item.numero,
                    "switch_id": item.switch_id,
                    "switch_nome": item.switch.nome,
                    "nome": item.nome,
                    "status_display": item.get_status_display(),
                } for item in switch_portas],
            },
        })

    if request.method == "DELETE":
        nome = site.nome
        site.delete()
        return JsonResponse({"ok": True, "mensagem": f"Site / rack {nome} removido com sucesso."})

    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    try:
        aplicar_dados_site(site, dados)
        site.full_clean()
        site.save()
    except ValueError as erro:
        return resposta_erro(str(erro))
    except ValidationError as erro:
        return resposta_erro(erro.message_dict)
    except IntegrityError:
        return resposta_erro("Já existe outro site / rack com esse nome ou código.", status=409)

    return JsonResponse({
        "ok": True,
        "mensagem": "Site / rack atualizado com sucesso.",
        "site": site_para_json(site, detalhado=True),
    })


@csrf_exempt
@require_http_methods(["POST"])
def site_ativos(request, site_pk):
    site = get_object_or_404(SiteRack, pk=site_pk)
    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    ativo = RackAtivo(site=site)
    try:
        with transaction.atomic():
            aplicar_dados_ativo(ativo, dados)
            ativo.full_clean()
            ativo.save()
            aplicar_patch_panel(ativo, dados)
    except ValueError as erro:
        return resposta_erro(str(erro))
    except ValidationError as erro:
        return resposta_erro(erro.message_dict)
    except IntegrityError:
        return resposta_erro("Já existe um ativo com esse patrimônio, série ou vínculo.", status=409)

    ativo.refresh_from_db()
    return JsonResponse({
        "ok": True,
        "mensagem": "Ativo adicionado ao rack com sucesso.",
        "ativo": ativo_para_json(ativo, detalhado=True),
    }, status=201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def rack_ativo_detalhe(request, pk):
    ativo = get_object_or_404(
        RackAtivo.objects.select_related("site", "equipamento", "switch_rede"),
        pk=pk,
    )

    if request.method == "GET":
        return JsonResponse({"ok": True, "ativo": ativo_para_json(ativo, detalhado=True)})

    if request.method == "DELETE":
        nome = ativo.nome
        ativo.delete()
        return JsonResponse({"ok": True, "mensagem": f"Ativo {nome} removido do rack."})

    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    try:
        with transaction.atomic():
            aplicar_dados_ativo(ativo, dados)
            ativo.full_clean()
            ativo.save()
            aplicar_patch_panel(ativo, dados)
    except ValueError as erro:
        return resposta_erro(str(erro))
    except ValidationError as erro:
        return resposta_erro(erro.message_dict)
    except IntegrityError:
        return resposta_erro("Já existe outro ativo com esse patrimônio, série ou vínculo.", status=409)

    ativo.refresh_from_db()
    return JsonResponse({
        "ok": True,
        "mensagem": "Ativo do rack atualizado com sucesso.",
        "ativo": ativo_para_json(ativo, detalhado=True),
    })


@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def patch_porta_detalhe(request, pk):
    porta = get_object_or_404(
        PatchPanelPorta.objects.select_related(
            "patch_panel", "patch_panel__ativo", "setor", "computador",
            "equipamento", "switch_porta", "switch_porta__switch"
        ),
        pk=pk,
    )
    dados = carregar_json(request)
    if dados is None:
        return resposta_erro("JSON inválido.")

    for campo in ["status", "identificacao", "ponto_logico", "local_destino", "observacoes"]:
        if campo in dados:
            setattr(porta, campo, (dados.get(campo) or "").strip())

    try:
        if "setor_id" in dados:
            porta.setor = obter_setor(dados.get("setor_id"))
        if "computador_id" in dados:
            porta.computador = obter_computador(dados.get("computador_id"))
        if "equipamento_id" in dados:
            valor = dados.get("equipamento_id")
            porta.equipamento = None if valor in [None, "", "null", "undefined"] else Equipamento.objects.get(pk=int(valor))
        if "switch_porta_id" in dados:
            porta.switch_porta = obter_switch_porta(dados.get("switch_porta_id"))

        porta.full_clean()
        porta.save()
    except (Equipamento.DoesNotExist, TypeError, ValueError) as erro:
        mensagem = str(erro) if str(erro) else "Equipamento informado não foi encontrado."
        return resposta_erro(mensagem)
    except ValidationError as erro:
        return resposta_erro(erro.message_dict if hasattr(erro, "message_dict") else erro.messages)

    return JsonResponse({
        "ok": True,
        "mensagem": f"Porta {porta.numero} atualizada com sucesso.",
        "porta": porta_patch_para_json(porta),
    })
