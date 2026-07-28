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
    tipo_outro_descricao = models.CharField(max_length=120, blank=True, verbose_name="Descrição do tipo quando outro")
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
        self.tipo_outro_descricao = (self.tipo_outro_descricao or "").strip()
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

        if self.tipo == self.TIPO_OUTRO and not self.tipo_outro_descricao:
            raise ValidationError({"tipo_outro_descricao": "Informe qual é o tipo do equipamento."})

        if not self.status:
            raise ValidationError({"status": "Informe o status do equipamento."})

        if self.origem and self.origem not in [valor for valor, _ in self.ORIGENS]:
            raise ValidationError({"origem": "Origem inválida."})

    def save(self, *args, **kwargs):
        self.tipo = (self.tipo or "").strip()
        self.tipo_outro_descricao = (self.tipo_outro_descricao or "").strip()
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

        if self.tipo != self.TIPO_OUTRO:
            self.tipo_outro_descricao = ""

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
            self.tipo_outro_descricao if self.tipo == self.TIPO_OUTRO and self.tipo_outro_descricao else self.get_tipo_display(),
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
class SwitchRede(models.Model):
    STATUS_EM_USO = "em_uso"
    STATUS_RESERVA = "reserva"
    STATUS_MANUTENCAO = "manutencao"
    STATUS_INATIVO = "inativo"

    STATUS = [
        (STATUS_EM_USO, "Em uso"),
        (STATUS_RESERVA, "Reserva"),
        (STATUS_MANUTENCAO, "Em manutenção"),
        (STATUS_INATIVO, "Desativado"),
    ]

    nome = models.CharField(max_length=120, unique=True, verbose_name="Nome do switch")
    equipamento = models.OneToOneField(
        Equipamento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="switch_rede",
        verbose_name="Equipamento relacionado",
    )
    marca = models.CharField(max_length=100, blank=True, verbose_name="Marca")
    modelo = models.CharField(max_length=120, blank=True, verbose_name="Modelo")
    patrimonio = models.CharField(max_length=80, unique=True, null=True, blank=True, verbose_name="Patrimônio")
    numero_serie = models.CharField(max_length=120, unique=True, null=True, blank=True, verbose_name="Número de série")
    setor = models.ForeignKey(
        Setor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="switches",
        verbose_name="Setor",
    )
    localizacao = models.CharField(max_length=150, blank=True, verbose_name="Localização")
    rack = models.CharField(max_length=100, blank=True, verbose_name="Rack / armário")
    ip_gerenciamento = models.GenericIPAddressField(
        protocol="IPv4",
        unique=True,
        null=True,
        blank=True,
        verbose_name="IP de gerenciamento",
    )
    quantidade_portas = models.PositiveSmallIntegerField(default=24, verbose_name="Quantidade total de portas")
    quantidade_portas_sfp = models.PositiveSmallIntegerField(default=0, verbose_name="Quantidade de portas SFP")
    status = models.CharField(max_length=30, choices=STATUS, default=STATUS_EM_USO, verbose_name="Status")
    observacoes = models.TextField(blank=True, verbose_name="Observações")
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Switch de rede"
        verbose_name_plural = "Switches de rede"
        ordering = ["nome"]

    def clean(self):
        self.nome = (self.nome or "").strip()
        self.marca = (self.marca or "").strip()
        self.modelo = (self.modelo or "").strip()
        self.patrimonio = (self.patrimonio or "").strip() or None
        self.numero_serie = (self.numero_serie or "").strip() or None
        self.localizacao = (self.localizacao or "").strip()
        self.rack = (self.rack or "").strip()
        self.status = (self.status or "").strip()
        self.observacoes = (self.observacoes or "").strip()

        if not self.nome:
            raise ValidationError({"nome": "Informe o nome do switch."})

        if self.quantidade_portas < 2 or self.quantidade_portas > 128:
            raise ValidationError({"quantidade_portas": "Informe uma quantidade entre 2 e 128 portas."})

        if self.quantidade_portas_sfp < 0 or self.quantidade_portas_sfp > self.quantidade_portas:
            raise ValidationError({"quantidade_portas_sfp": "A quantidade de portas SFP não pode superar o total de portas."})

        if self.equipamento and self.equipamento.tipo != Equipamento.TIPO_SWITCH:
            raise ValidationError({"equipamento": "O equipamento relacionado deve ser do tipo Switch."})

    def save(self, *args, **kwargs):
        self.nome = (self.nome or "").strip()
        self.marca = (self.marca or "").strip()
        self.modelo = (self.modelo or "").strip()
        self.patrimonio = (self.patrimonio or "").strip() or None
        self.numero_serie = (self.numero_serie or "").strip() or None
        self.localizacao = (self.localizacao or "").strip()
        self.rack = (self.rack or "").strip()
        self.status = (self.status or "").strip()
        self.observacoes = (self.observacoes or "").strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nome


class SwitchPorta(models.Model):
    TIPO_PORTA_RJ45 = "rj45"
    TIPO_PORTA_SFP = "sfp"

    TIPOS_PORTA = [
        (TIPO_PORTA_RJ45, "RJ45"),
        (TIPO_PORTA_SFP, "SFP/SFP+"),
    ]

    STATUS_LIVRE = "livre"
    STATUS_ATIVA = "ativa"
    STATUS_DESCONECTADA = "desconectada"
    STATUS_UPLINK = "uplink"
    STATUS_BLOQUEADA = "bloqueada"
    STATUS_DEFEITUOSA = "defeituosa"

    STATUS = [
        (STATUS_LIVRE, "Livre"),
        (STATUS_ATIVA, "Ativa"),
        (STATUS_DESCONECTADA, "Desconectada"),
        (STATUS_UPLINK, "Uplink"),
        (STATUS_BLOQUEADA, "Bloqueada"),
        (STATUS_DEFEITUOSA, "Defeituosa"),
    ]

    DISPOSITIVO_COMPUTADOR = "computador"
    DISPOSITIVO_IMPRESSORA = "impressora"
    DISPOSITIVO_ACCESS_POINT = "access_point"
    DISPOSITIVO_CAMERA = "camera"
    DISPOSITIVO_TELEFONE_IP = "telefone_ip"
    DISPOSITIVO_SWITCH = "switch"
    DISPOSITIVO_ROTEADOR = "roteador"
    DISPOSITIVO_SERVIDOR = "servidor"
    DISPOSITIVO_NVR_DVR = "nvr_dvr"
    DISPOSITIVO_OUTRO = "outro"

    TIPOS_DISPOSITIVO = [
        (DISPOSITIVO_COMPUTADOR, "Computador"),
        (DISPOSITIVO_IMPRESSORA, "Impressora"),
        (DISPOSITIVO_ACCESS_POINT, "Access Point"),
        (DISPOSITIVO_CAMERA, "Câmera"),
        (DISPOSITIVO_TELEFONE_IP, "Telefone IP"),
        (DISPOSITIVO_SWITCH, "Outro switch"),
        (DISPOSITIVO_ROTEADOR, "Roteador"),
        (DISPOSITIVO_SERVIDOR, "Servidor"),
        (DISPOSITIVO_NVR_DVR, "NVR/DVR"),
        (DISPOSITIVO_OUTRO, "Outro"),
    ]

    VELOCIDADE_AUTO = "auto"
    VELOCIDADE_FE = "100m"
    VELOCIDADE_1G = "1g"
    VELOCIDADE_25G = "2_5g"
    VELOCIDADE_10G = "10g"

    VELOCIDADES = [
        (VELOCIDADE_AUTO, "Automático"),
        (VELOCIDADE_FE, "100 Mb/s"),
        (VELOCIDADE_1G, "1 Gb/s"),
        (VELOCIDADE_25G, "2,5 Gb/s"),
        (VELOCIDADE_10G, "10 Gb/s"),
    ]

    switch = models.ForeignKey(
        SwitchRede,
        on_delete=models.CASCADE,
        related_name="portas",
        verbose_name="Switch",
    )
    numero = models.PositiveSmallIntegerField(verbose_name="Número da porta")
    tipo_porta = models.CharField(max_length=20, choices=TIPOS_PORTA, default=TIPO_PORTA_RJ45, verbose_name="Tipo da porta")
    nome = models.CharField(max_length=120, blank=True, verbose_name="Nome da porta")
    tipo_dispositivo = models.CharField(max_length=30, choices=TIPOS_DISPOSITIVO, blank=True, verbose_name="Tipo de dispositivo")
    status = models.CharField(max_length=30, choices=STATUS, default=STATUS_LIVRE, verbose_name="Status")

    computador = models.ForeignKey(
        ComputadorUsuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portas_switch",
        verbose_name="Computador conectado",
    )
    equipamento = models.ForeignKey(
        Equipamento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portas_switch",
        verbose_name="Equipamento conectado",
    )
    switch_destino = models.ForeignKey(
        SwitchRede,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uplinks_entrada",
        verbose_name="Switch conectado",
    )
    descricao_dispositivo = models.CharField(max_length=180, blank=True, verbose_name="Descrição manual do dispositivo")
    usuario_responsavel = models.CharField(max_length=150, blank=True, verbose_name="Usuário responsável")
    setor = models.ForeignKey(
        Setor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portas_switch",
        verbose_name="Setor atendido",
    )
    ip_conectado = models.GenericIPAddressField(protocol="IPv4", null=True, blank=True, verbose_name="IP conectado")
    mac_conectado = models.CharField(max_length=17, blank=True, verbose_name="MAC conectado")
    vlan = models.CharField(max_length=80, blank=True, verbose_name="VLAN")
    perfil = models.CharField(max_length=100, blank=True, verbose_name="Perfil da porta")
    velocidade = models.CharField(max_length=20, choices=VELOCIDADES, default=VELOCIDADE_AUTO, verbose_name="Velocidade")
    poe = models.BooleanField(default=False, verbose_name="PoE")
    observacoes = models.TextField(blank=True, verbose_name="Observações")
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Porta de switch"
        verbose_name_plural = "Portas de switch"
        ordering = ["switch", "numero"]
        constraints = [
            models.UniqueConstraint(fields=["switch", "numero"], name="switch_porta_numero_unico"),
        ]

    def clean(self):
        self.nome = (self.nome or "").strip()
        self.tipo_dispositivo = (self.tipo_dispositivo or "").strip()
        self.descricao_dispositivo = (self.descricao_dispositivo or "").strip()
        self.usuario_responsavel = (self.usuario_responsavel or "").strip()
        self.mac_conectado = (self.mac_conectado or "").strip()
        self.vlan = (self.vlan or "").strip()
        self.perfil = (self.perfil or "").strip()
        self.observacoes = (self.observacoes or "").strip()

        if self.numero < 1 or self.numero > self.switch.quantidade_portas:
            raise ValidationError({"numero": "O número da porta está fora da quantidade configurada no switch."})

        relacionamentos = [self.computador_id, self.equipamento_id, self.switch_destino_id]
        if sum(1 for valor in relacionamentos if valor) > 1:
            raise ValidationError("Vincule apenas um item do inventário por porta.")

        if self.switch_destino_id and self.switch_destino_id == self.switch_id:
            raise ValidationError({"switch_destino": "Um switch não pode ser ligado a ele mesmo."})

        if self.mac_conectado:
            try:
                self.mac_conectado = normalizar_mac(self.mac_conectado)
            except ValueError as erro:
                raise ValidationError({"mac_conectado": str(erro)})

    def save(self, *args, **kwargs):
        self.nome = (self.nome or "").strip()
        self.tipo_dispositivo = (self.tipo_dispositivo or "").strip()
        self.descricao_dispositivo = (self.descricao_dispositivo or "").strip()
        self.usuario_responsavel = (self.usuario_responsavel or "").strip()
        self.mac_conectado = (self.mac_conectado or "").strip()
        self.vlan = (self.vlan or "").strip()
        self.perfil = (self.perfil or "").strip()
        self.observacoes = (self.observacoes or "").strip()

        if self.mac_conectado:
            self.mac_conectado = normalizar_mac(self.mac_conectado)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.switch.nome} - Porta {self.numero}"


class SwitchPortaHistorico(models.Model):
    porta = models.ForeignKey(
        SwitchPorta,
        on_delete=models.CASCADE,
        related_name="historico",
        verbose_name="Porta",
    )
    acao = models.CharField(max_length=80, default="Atualização", verbose_name="Ação")
    resumo = models.CharField(max_length=220, blank=True, verbose_name="Resumo")
    dados_anteriores = models.JSONField(default=dict, blank=True, verbose_name="Dados anteriores")
    dados_novos = models.JSONField(default=dict, blank=True, verbose_name="Dados novos")
    alterado_por = models.CharField(max_length=150, blank=True, verbose_name="Alterado por")
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")

    class Meta:
        verbose_name = "Histórico de porta"
        verbose_name_plural = "Históricos de portas"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.porta} - {self.criado_em:%d/%m/%Y %H:%M}"


class Starlink(models.Model):
    STATUS_ATIVA = "ativa"
    STATUS_CANCELADA = "cancelada"
    STATUS_ESPERA = "espera"
    STATUS_MANUTENCAO = "manutencao"
    STATUS_RESERVA = "reserva"

    STATUS = [
        (STATUS_ATIVA, "Ativa"),
        (STATUS_CANCELADA, "Cancelada"),
        (STATUS_ESPERA, "Em espera"),
        (STATUS_MANUTENCAO, "Em manutenção"),
        (STATUS_RESERVA, "Reserva"),
    ]

    TIPO_FIXA = "fixa"
    TIPO_VEICULO = "veiculo"
    TIPO_MAQUINA = "maquina"
    TIPO_OBRA = "obra"
    TIPO_RESERVA = "reserva"

    TIPOS_UTILIZACAO = [
        (TIPO_FIXA, "Instalação fixa"),
        (TIPO_VEICULO, "Veículo"),
        (TIPO_MAQUINA, "Máquina / equipamento"),
        (TIPO_OBRA, "Obra / frente de serviço"),
        (TIPO_RESERVA, "Reserva"),
    ]

    SINCRONIZACAO_NAO_CONFIGURADA = "nao_configurada"
    SINCRONIZACAO_PENDENTE = "pendente"
    SINCRONIZACAO_SINCRONIZADA = "sincronizada"
    SINCRONIZACAO_ERRO = "erro"
    SINCRONIZACAO_SEM_DADOS = "sem_dados"

    STATUS_SINCRONIZACAO = [
        (SINCRONIZACAO_NAO_CONFIGURADA, "Não configurada"),
        (SINCRONIZACAO_PENDENTE, "Pendente"),
        (SINCRONIZACAO_SINCRONIZADA, "Sincronizada"),
        (SINCRONIZACAO_ERRO, "Erro"),
        (SINCRONIZACAO_SEM_DADOS, "Sem dados"),
    ]

    nome = models.CharField(max_length=150, unique=True, verbose_name="Nome identificador")
    email_conta = models.EmailField(max_length=180, verbose_name="E-mail da conta")
    telefone = models.CharField(max_length=30, blank=True, verbose_name="Telefone")
    localizacao = models.CharField(max_length=180, blank=True, verbose_name="Localização")
    plano = models.CharField(max_length=120, blank=True, verbose_name="Plano")
    placa = models.CharField(max_length=20, blank=True, verbose_name="Placa")
    numero_serie = models.CharField(max_length=140, unique=True, verbose_name="Número de série")
    modelo = models.CharField(max_length=100, verbose_name="Modelo")
    status = models.CharField(max_length=30, choices=STATUS, default=STATUS_ATIVA, verbose_name="Status")
    tipo_utilizacao = models.CharField(
        max_length=30,
        choices=TIPOS_UTILIZACAO,
        default=TIPO_FIXA,
        verbose_name="Tipo de utilização",
    )
    responsavel = models.CharField(max_length=150, blank=True, verbose_name="Responsável")
    setor = models.ForeignKey(
        Setor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="starlinks",
        verbose_name="Setor",
    )
    equipamento = models.OneToOneField(
        Equipamento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="starlink",
        verbose_name="Equipamento relacionado",
    )
    data_instalacao = models.DateField(null=True, blank=True, verbose_name="Data de instalação")
    data_ativacao = models.DateField(null=True, blank=True, verbose_name="Data de ativação")
    data_cancelamento = models.DateField(null=True, blank=True, verbose_name="Data de cancelamento")
    valor_mensalidade = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Valor da mensalidade",
    )
    centro_custo = models.CharField(max_length=120, blank=True, verbose_name="Centro de custo")
    observacoes = models.TextField(blank=True, verbose_name="Observações")

    integracao_habilitada = models.BooleanField(default=False, verbose_name="Integração com API habilitada")
    account_id = models.CharField(max_length=160, unique=True, null=True, blank=True, verbose_name="Account ID")
    starlink_id = models.CharField(max_length=160, unique=True, null=True, blank=True, verbose_name="Starlink ID")
    user_terminal_id = models.CharField(max_length=160, unique=True, null=True, blank=True, verbose_name="User Terminal ID")
    service_line_id = models.CharField(max_length=160, unique=True, null=True, blank=True, verbose_name="Service Line ID")
    kit_number = models.CharField(max_length=160, unique=True, null=True, blank=True, verbose_name="Kit Number")
    ultima_sincronizacao = models.DateTimeField(null=True, blank=True, verbose_name="Última sincronização")
    status_sincronizacao = models.CharField(
        max_length=30,
        choices=STATUS_SINCRONIZACAO,
        default=SINCRONIZACAO_NAO_CONFIGURADA,
        verbose_name="Status da sincronização",
    )
    mensagem_erro_sincronizacao = models.TextField(blank=True, verbose_name="Erro da sincronização")

    criado_em = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Starlink"
        verbose_name_plural = "Starlinks"
        ordering = ["nome"]

    def clean(self):
        campos_texto = [
            "nome",
            "email_conta",
            "telefone",
            "localizacao",
            "plano",
            "placa",
            "numero_serie",
            "modelo",
            "status",
            "tipo_utilizacao",
            "responsavel",
            "centro_custo",
            "observacoes",
            "status_sincronizacao",
            "mensagem_erro_sincronizacao",
        ]

        for campo in campos_texto:
            setattr(self, campo, (getattr(self, campo) or "").strip())

        for campo in ["account_id", "starlink_id", "user_terminal_id", "service_line_id", "kit_number"]:
            setattr(self, campo, (getattr(self, campo) or "").strip() or None)

        if not self.nome:
            raise ValidationError({"nome": "Informe um nome para identificar a Starlink."})

        if not self.email_conta:
            raise ValidationError({"email_conta": "Informe o e-mail da conta."})

        if not self.numero_serie:
            raise ValidationError({"numero_serie": "Informe o número de série."})

        if not self.modelo:
            raise ValidationError({"modelo": "Informe o modelo da Starlink."})

        if self.status == self.STATUS_CANCELADA and not self.data_cancelamento:
            raise ValidationError({"data_cancelamento": "Informe a data de cancelamento."})

        if self.valor_mensalidade is not None and self.valor_mensalidade < 0:
            raise ValidationError({"valor_mensalidade": "O valor da mensalidade não pode ser negativo."})

    def save(self, *args, **kwargs):
        campos_texto = [
            "nome",
            "email_conta",
            "telefone",
            "localizacao",
            "plano",
            "placa",
            "numero_serie",
            "modelo",
            "status",
            "tipo_utilizacao",
            "responsavel",
            "centro_custo",
            "observacoes",
            "status_sincronizacao",
            "mensagem_erro_sincronizacao",
        ]

        for campo in campos_texto:
            setattr(self, campo, (getattr(self, campo) or "").strip())

        for campo in ["account_id", "starlink_id", "user_terminal_id", "service_line_id", "kit_number"]:
            setattr(self, campo, (getattr(self, campo) or "").strip() or None)

        if not self.integracao_habilitada:
            self.status_sincronizacao = self.SINCRONIZACAO_NAO_CONFIGURADA
            self.mensagem_erro_sincronizacao = ""

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome} - {self.numero_serie}"


class StarlinkTelemetria(models.Model):
    STATUS_DESCONHECIDO = "desconhecido"
    STATUS_ONLINE = "online"
    STATUS_OFFLINE = "offline"
    STATUS_SEM_DADOS = "sem_dados"

    STATUS_CONEXAO = [
        (STATUS_DESCONHECIDO, "Desconhecido"),
        (STATUS_ONLINE, "Online"),
        (STATUS_OFFLINE, "Offline"),
        (STATUS_SEM_DADOS, "Sem dados"),
    ]

    starlink = models.OneToOneField(
        Starlink,
        on_delete=models.CASCADE,
        related_name="telemetria",
        verbose_name="Starlink",
    )
    status_conexao = models.CharField(
        max_length=30,
        choices=STATUS_CONEXAO,
        default=STATUS_DESCONHECIDO,
        verbose_name="Status da conexão",
    )
    download_mbps = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Download Mbps")
    upload_mbps = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Upload Mbps")
    latencia_ms = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Latência ms")
    perda_pacotes_percentual = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Perda de pacotes %",
    )
    obstrucao_percentual = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Obstrução %",
    )
    uptime_segundos = models.PositiveBigIntegerField(null=True, blank=True, verbose_name="Uptime em segundos")
    ultima_comunicacao = models.DateTimeField(null=True, blank=True, verbose_name="Última comunicação")
    payload_bruto = models.JSONField(default=dict, blank=True, verbose_name="Dados brutos da API")
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Telemetria da Starlink"
        verbose_name_plural = "Telemetrias das Starlinks"
        ordering = ["starlink__nome"]

    def __str__(self):
        return f"Telemetria - {self.starlink.nome}"
