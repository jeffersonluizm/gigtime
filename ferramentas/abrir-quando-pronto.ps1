# Abre o navegador no endereco do GigTime so depois que o servidor local responder.
# Usado pelo iniciar.bat. Se o servidor nao subir dentro de -Segundos, nao abre nada (codigo 1).
# -SemAbrir apenas informa se o servidor respondeu (usado para testar o script).
# Arquivo mantido em ASCII para o Windows PowerShell 5.1 ler sem problema de codificacao.
param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$Segundos = 20,
    [switch]$SemAbrir
)

$ProgressPreference = 'SilentlyContinue'
$limite = (Get-Date).AddSeconds($Segundos)
while ((Get-Date) -lt $limite) {
    try {
        # Timeout folgado: no Windows, "localhost" tenta ::1 primeiro e leva ~2 s ate cair no 127.0.0.1
        Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 6 | Out-Null
        if ($SemAbrir) { Write-Host "pronto: $Url" } else { Start-Process $Url }
        exit 0
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
Write-Host "O servidor nao respondeu em $Segundos segundos; o navegador nao foi aberto."
exit 1
