from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from .utils import normalizar_mac


class Setor(models.Model):
    nome = models.CharField(
        max_length=120,
        unique=True,
        verbose_name="Nome do setor",
    )

    responsavel = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Responsável",
    )

    observacoes = models.TextField(
        blank=True,
        verbose_name="Observações",
    )

    criado_em = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Criado em",
    )

    atualizado_em = models.DateTimeField(
        auto_now=True,
        verbose_name="Atualizado em",
    )

    class Meta:
        verbose_name = "Setor"
        verbose_name_plural = "Setores"
        ordering = ["nome"]

    def clean(self):
        self.nome = (self.nome or "").strip()

        if not self.nome:
            raise ValidationError({"nome": "Informe o nome do setor."})

    def save(self, *args, **kwargs):
        self.nome = (self.nome or "").strip()
        self.responsavel = (self.responsavel or "").strip()
        self.observacoes = (self.observacoes or "").strip()

        super().save(*args, **kwargs)

    def __str__(self):
        return self.nome


class ComputadorUsuario(models.Model):
    ARMAZENAMENTO_SSD = "ssd"
    ARMAZENAMENTO_HD = "hd"
    ARMAZENAMENTO_SSD_HD = "ssd_hd"
    ARMAZENAMENTO_NVME = "nvme"
    ARMAZENAMENTO_OUTRO = "outro"

    ARMAZENAMENTO_TIPOS = [
        (ARMAZENAMENTO_SSD, "SSD"),
        (ARMAZENAMENTO_HD, "HD"),
        (ARMAZENAMENTO_SSD_HD, "SSD + HD"),
        (ARMAZENAMENTO_NVME, "NVMe"),
        (ARMAZENAMENTO_OUTRO, "Outro"),
    ]

    nome_usuario = models.CharField(
        max_length=150,
        verbose_name="Nome do usuário",
    )

    setor = models.ForeignKey(
        Setor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="computadores",
        verbose_name="Setor",
    )

    ip_computador = models.GenericIPAddressField(
        protocol="IPv4",
        unique=True,
        verbose_name="IP do computador",
    )

    mac_address = models.CharField(
        max_length=17,
        unique=True,
        verbose_name="Endereço MAC",
    )

    mostrar_especificacoes = models.BooleanField(
        default=False,
        verbose_name="Usar especificações",
    )

    processador = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Processador",
    )

    memoria_ram = models.CharField(
        max_length=80,
        blank=True,
        verbose_name="Memória RAM",
    )

    armazenamento_tipo = models.CharField(
        max_length=30,
        choices=ARMAZENAMENTO_TIPOS,
        blank=True,
        verbose_name="Tipo de armazenamento",
    )

    armazenamento_capacidade = models.CharField(
        max_length=80,
        blank=True,
        verbose_name="Capacidade do armazenamento",
    )

    fonte_watts = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Fonte em watts",
    )

    observacoes = models.TextField(
        blank=True,
        verbose_name="Observações",
    )

    criado_em = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Criado em",
    )

    atualizado_em = models.DateTimeField(
        auto_now=True,
        verbose_name="Atualizado em",
    )

    class Meta:
        verbose_name = "Usuário de computador"
        verbose_name_plural = "Usuários de computadores"
        ordering = ["nome_usuario"]

    def clean(self):
        self.nome_usuario = (self.nome_usuario or "").strip()
        self.processador = (self.processador or "").strip()
        self.memoria_ram = (self.memoria_ram or "").strip()
        self.armazenamento_tipo = (self.armazenamento_tipo or "").strip()
        self.armazenamento_capacidade = (self.armazenamento_capacidade or "").strip()
        self.observacoes = (self.observacoes or "").strip()

        if not self.nome_usuario:
            raise ValidationError({"nome_usuario": "Informe o nome do usuário."})

        try:
            self.mac_address = normalizar_mac(self.mac_address)
        except ValueError as erro:
            raise ValidationError({"mac_address": str(erro)})

        if self.fonte_watts is not None and self.fonte_watts <= 0:
            raise ValidationError({"fonte_watts": "Informe uma potência válida para a fonte."})

    def save(self, *args, **kwargs):
        self.nome_usuario = (self.nome_usuario or "").strip()
        self.processador = (self.processador or "").strip()
        self.memoria_ram = (self.memoria_ram or "").strip()
        self.armazenamento_tipo = (self.armazenamento_tipo or "").strip()
        self.armazenamento_capacidade = (self.armazenamento_capacidade or "").strip()
        self.observacoes = (self.observacoes or "").strip()
        self.mac_address = normalizar_mac(self.mac_address)

        if not self.mostrar_especificacoes:
            self.processador = ""
            self.memoria_ram = ""
            self.armazenamento_tipo = ""
            self.armazenamento_capacidade = ""
            self.fonte_watts = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome_usuario} - {self.ip_computador} - {self.mac_address}"


class Equipamento(models.Model):
    TIPO_DESKTOP = "desktop"
    TIPO_NOTEBOOK = "notebook"
    TIPO_IMPRESSORA = "impressora"
    TIPO_MONITOR = "monitor"
    TIPO_ROTEADOR = "roteador"
    TIPO_SWITCH = "switch"
    TIPO_NOBREAK = "nobreak"
    TIPO_CELULAR = "celular"
    TIPO_TABLET = "tablet"
    TIPO_OUTRO = "outro"

    TIPOS = [
        (TIPO_DESKTOP, "Desktop"),
        (TIPO_NOTEBOOK, "Notebook"),
        (TIPO_IMPRESSORA, "Impressora"),
        (TIPO_MONITOR, "Monitor"),
        (TIPO_ROTEADOR, "Roteador"),
        (TIPO_SWITCH, "Switch"),
        (TIPO_NOBREAK, "Nobreak"),
        (TIPO_CELULAR, "Celular"),
        (TIPO_TABLET, "Tablet"),
        (TIPO_OUTRO, "Outro"),
    ]

    STATUS_EM_USO = "em_uso"
    STATUS_ESTOQUE = "estoque"
    STATUS_MANUTENCAO = "manutencao"
    STATUS_INATIVO = "inativo"

    STATUS = [
        (STATUS_EM_USO, "Em uso"),
        (STATUS_ESTOQUE, "Em estoque"),
        (STATUS_MANUTENCAO, "Em manutenção"),
        (STATUS_INATIVO, "Baixado/Inativo"),
    ]

    ORIGEM_COMPRA = "compra"
    ORIGEM_DOACAO = "doacao"
    ORIGEM_TRANSFERENCIA = "transferencia"
    ORIGEM_REAPROVEITAMENTO = "reaproveitamento"

    ORIGENS = [
        (ORIGEM_COMPRA, "Compra"),
        (ORIGEM_DOACAO, "Doação"),
        (ORIGEM_TRANSFERENCIA, "Transferência"),
        (ORIGEM_REAPROVEITAMENTO, "Reaproveitamento"),
    ]

    tipo = models.CharField(max_length=30, choices=TIPOS, verbose_name="Tipo do equipamento")
    patrimonio = models.CharField(max_length=80, unique=True, null=True, blank=True, verbose_name="Patrimônio")
    marca = models.CharField(max_length=100, blank=True, verbose_name="Marca")
    modelo = models.CharField(max_length=120, blank=True, verbose_name="Modelo")
    numero_serie = models.CharField(max_length=120, unique=True, null=True, blank=True, verbose_name="Número de série")

    setor = models.ForeignKey(
        Setor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="equipamentos",
        verbose_name="Setor",
    )

    usuario_responsavel = models.CharField(max_length=150, blank=True, verbose_name="Usuário responsável")
    status = models.CharField(max_length=30, choices=STATUS, default=STATUS_EM_USO, verbose_name="Status")

    produto_novo = models.BooleanField(default=False, verbose_name="Produto novo")
    data_compra = models.DateField(null=True, blank=True, verbose_name="Data de compra")
    fornecedor = models.CharField(max_length=150, blank=True, verbose_name="Fornecedor")
    numero_nota_fiscal = models.CharField(max_length=80, blank=True, verbose_name="Número da nota fiscal")
    valor_compra = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Valor de compra")
    garantia_ate = models.DateField(null=True, blank=True, verbose_name="Garantia até")
    origem = models.CharField(max_length=30, choices=ORIGENS, blank=True, verbose_name="Origem")

    observacoes = models.TextField(blank=True, verbose_name="Observações")
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Equipamento"
        verbose_name_plural = "Equipamentos"
        ordering = ["tipo", "marca", "modelo"]

    def clean(self):
        self.tipo = (self.tipo or "").strip()
        self.patrimonio = (self.patrimonio or "").strip() or None
        self.marca = (self.marca or "").strip()
        self.modelo = (self.modelo or "").strip()
        self.numero_serie = (self.numero_serie or "").strip() or None
        self.usuario_responsavel = (self.usuario_responsavel or "").strip()
        self.status = (self.status or "").strip()
        self.fornecedor = (self.fornecedor or "").strip()
        self.numero_nota_fiscal = (self.numero_nota_fiscal or "").strip()
        self.origem = (self.origem or "").strip()
        self.observacoes = (self.observacoes or "").strip()

        if not self.tipo:
            raise ValidationError({"tipo": "Informe o tipo do equipamento."})

        if not self.status:
            raise ValidationError({"status": "Informe o status do equipamento."})

        if self.origem and self.origem not in [valor for valor, _ in self.ORIGENS]:
            raise ValidationError({"origem": "Origem inválida."})

    def save(self, *args, **kwargs):
        self.tipo = (self.tipo or "").strip()
        self.patrimonio = (self.patrimonio or "").strip() or None
        self.marca = (self.marca or "").strip()
        self.modelo = (self.modelo or "").strip()
        self.numero_serie = (self.numero_serie or "").strip() or None
        self.usuario_responsavel = (self.usuario_responsavel or "").strip()
        self.status = (self.status or "").strip()
        self.fornecedor = (self.fornecedor or "").strip()
        self.numero_nota_fiscal = (self.numero_nota_fiscal or "").strip()
        self.origem = (self.origem or "").strip()
        self.observacoes = (self.observacoes or "").strip()

        if not self.produto_novo:
            self.data_compra = None
            self.fornecedor = ""
            self.numero_nota_fiscal = ""
            self.valor_compra = None
            self.garantia_ate = None
            self.origem = ""

        super().save(*args, **kwargs)

    def __str__(self):
        partes = [
            self.get_tipo_display(),
            self.marca,
            self.modelo,
            self.patrimonio or self.numero_serie or "",
        ]

        return " - ".join([parte for parte in partes if parte])


class EquipamentoFoto(models.Model):
    equipamento = models.ForeignKey(
        Equipamento,
        on_delete=models.CASCADE,
        related_name="fotos",
        verbose_name="Equipamento",
    )

    arquivo = models.FileField(upload_to="equipamentos/fotos/%Y/%m/", verbose_name="Foto")
    descricao = models.CharField(max_length=150, blank=True, verbose_name="Descrição")
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")

    class Meta:
        verbose_name = "Foto do equipamento"
        verbose_name_plural = "Fotos dos equipamentos"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Foto - {self.equipamento}"


class ManutencaoEquipamento(models.Model):
    TIPO_MANUTENCAO = "manutencao"
    TIPO_TROCA_PECA = "troca_peca"
    TIPO_FORMATACAO = "formatacao"
    TIPO_LIMPEZA = "limpeza"
    TIPO_INSTALACAO_SOFTWARE = "instalacao_software"
    TIPO_BAIXA = "baixa"
    TIPO_MOVIMENTACAO = "movimentacao"
    TIPO_OBSERVACAO = "observacao"

    TIPOS = [
        (TIPO_MANUTENCAO, "Manutenção"),
        (TIPO_TROCA_PECA, "Troca de peça"),
        (TIPO_FORMATACAO, "Formatação"),
        (TIPO_LIMPEZA, "Limpeza"),
        (TIPO_INSTALACAO_SOFTWARE, "Instalação de software"),
        (TIPO_BAIXA, "Baixa"),
        (TIPO_MOVIMENTACAO, "Movimentação de setor"),
        (TIPO_OBSERVACAO, "Observação geral"),
    ]

    STATUS_ABERTO = "aberto"
    STATUS_ANDAMENTO = "andamento"
    STATUS_CONCLUIDO = "concluido"
    STATUS_CANCELADO = "cancelado"

    STATUS = [
        (STATUS_ABERTO, "Aberto"),
        (STATUS_ANDAMENTO, "Em andamento"),
        (STATUS_CONCLUIDO, "Concluído"),
        (STATUS_CANCELADO, "Cancelado"),
    ]

    equipamento = models.ForeignKey(
        Equipamento,
        on_delete=models.CASCADE,
        related_name="manutencoes",
        verbose_name="Equipamento",
    )

    tipo_ocorrencia = models.CharField(max_length=40, choices=TIPOS, default=TIPO_MANUTENCAO, verbose_name="Tipo de ocorrência")
    data_ocorrencia = models.DateTimeField(default=timezone.now, verbose_name="Data da ocorrência")
    responsavel_atendimento = models.CharField(max_length=150, blank=True, verbose_name="Responsável pelo atendimento")
    descricao = models.TextField(verbose_name="Descrição do serviço")
    custo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Custo")
    status = models.CharField(max_length=30, choices=STATUS, default=STATUS_ABERTO, verbose_name="Status")
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Histórico/Manutenção"
        verbose_name_plural = "Históricos/Manutenções"
        ordering = ["-data_ocorrencia", "-criado_em"]

    def clean(self):
        self.tipo_ocorrencia = (self.tipo_ocorrencia or "").strip()
        self.responsavel_atendimento = (self.responsavel_atendimento or "").strip()
        self.descricao = (self.descricao or "").strip()
        self.status = (self.status or "").strip()

        if not self.equipamento_id:
            raise ValidationError({"equipamento": "Informe o equipamento."})

        if not self.tipo_ocorrencia:
            raise ValidationError({"tipo_ocorrencia": "Informe o tipo da ocorrência."})

        if not self.descricao:
            raise ValidationError({"descricao": "Informe a descrição do serviço."})

        if not self.status:
            raise ValidationError({"status": "Informe o status da ocorrência."})

    def save(self, *args, **kwargs):
        self.tipo_ocorrencia = (self.tipo_ocorrencia or "").strip()
        self.responsavel_atendimento = (self.responsavel_atendimento or "").strip()
        self.descricao = (self.descricao or "").strip()
        self.status = (self.status or "").strip()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_tipo_ocorrencia_display()} - {self.equipamento}"