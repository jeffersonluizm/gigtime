# Servidor HTTP estatico minimo para o GigTime, usado pelo iniciar.bat quando nao ha Python.
# Atende somente em http://localhost:<Porta>/ (nao exige administrador) e serve a pasta -Raiz.
# Arquivo mantido em ASCII para o Windows PowerShell 5.1 ler sem problema de codificacao.
param(
    [string]$Raiz = (Join-Path $PSScriptRoot '..\codigo-fonte'),
    [int]$Porta = 8000
)

$Raiz = (Resolve-Path -LiteralPath $Raiz).Path.TrimEnd('\') + '\'
$tipos = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.md'   = 'text/plain; charset=utf-8'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.png'  = 'image/png'
    '.gif'  = 'image/gif'
    '.webp' = 'image/webp'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
}

$servidor = New-Object System.Net.HttpListener
$servidor.Prefixes.Add("http://localhost:$Porta/")
try {
    $servidor.Start()
} catch {
    Write-Host "Nao foi possivel abrir a porta $Porta. Ela pode estar em uso. Detalhe: $($_.Exception.Message)"
    exit 1
}
Write-Host "Servindo $Raiz em http://localhost:$Porta/ (Ctrl+C para parar)"

try {
    while ($servidor.IsListening) {
        # Espera em fatias curtas para o Ctrl+C conseguir interromper
        $tarefa = $servidor.GetContextAsync()
        while (-not $tarefa.Wait(500)) { }
        $contexto = $tarefa.Result
        $resposta = $contexto.Response
        try {
            $caminho = [Uri]::UnescapeDataString($contexto.Request.Url.AbsolutePath)
            if ($caminho -eq '/') {
                $resposta.Redirect('/Home/home.html')
            } else {
                $relativo = $caminho.TrimStart('/').Replace('/', '\').Normalize([Text.NormalizationForm]::FormC)
                $arquivo = [IO.Path]::GetFullPath((Join-Path $Raiz $relativo))
                if (-not $arquivo.StartsWith($Raiz, [StringComparison]::OrdinalIgnoreCase)) {
                    $resposta.StatusCode = 403
                } elseif (Test-Path -LiteralPath $arquivo -PathType Leaf) {
                    $bytes = [IO.File]::ReadAllBytes($arquivo)
                    $extensao = [IO.Path]::GetExtension($arquivo).ToLowerInvariant()
                    if ($tipos.ContainsKey($extensao)) { $resposta.ContentType = $tipos[$extensao] }
                    else { $resposta.ContentType = 'application/octet-stream' }
                    $resposta.ContentLength64 = $bytes.Length
                    $resposta.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $resposta.StatusCode = 404
                }
            }
            Write-Host "$($resposta.StatusCode) $caminho"
        } catch {
            $resposta.StatusCode = 500
            Write-Host "500 $($_.Exception.Message)"
        } finally {
            $resposta.Close()
        }
    }
} finally {
    $servidor.Stop()
    $servidor.Close()
}
