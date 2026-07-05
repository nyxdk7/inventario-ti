import re


def normalizar_mac(valor):
    """
    Aceita formatos como:
    AA:BB:CC:DD:EE:FF
    AA-BB-CC-DD-EE-FF
    AABBCCDDEEFF

    Salva sempre como:
    AA:BB:CC:DD:EE:FF
    """

    valor = valor or ""
    limpo = re.sub(r"[^0-9a-fA-F]", "", valor)

    if len(limpo) != 12:
        raise ValueError("Endereço MAC inválido. Use o formato AA:BB:CC:DD:EE:FF.")

    if not re.fullmatch(r"[0-9a-fA-F]{12}", limpo):
        raise ValueError("Endereço MAC possui caracteres inválidos.")

    limpo = limpo.upper()

    return ":".join(limpo[i:i + 2] for i in range(0, 12, 2))