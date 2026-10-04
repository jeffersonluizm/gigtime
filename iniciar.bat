@echo off
setlocal
rem GigTime: serve a pasta codigo-fonte por HTTP local e abre o site no navegador.
rem O site precisa de HTTP: aberto por file:// cada pagina teria um armazenamento separado
rem (login, usuarios e mensagens nao passariam de uma pagina para outra).
rem Opcional: GIGTIME_PORTA muda a porta; GIGTIME_SEM_NAVEGADOR=1 nao abre o navegador.

set "RAIZ=%~dp0codigo-fonte"
if defined GIGTIME_PORTA (set "PORTA=%GIGTIME_PORTA%") else (set "PORTA=8000")
set "URL=http://localhost:%PORTA%/Home/home.html"

echo ============================================
echo  GigTime - servidor local
echo ============================================
echo  Endereco: %URL%
echo  Para encerrar: Ctrl+C (ou feche esta janela)
echo.

rem Abre o navegador depois de 2 segundos, dando tempo para o servidor subir
if not defined GIGTIME_SEM_NAVEGADOR (
    start "" /b powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
)

python --version >nul 2>&1
if not errorlevel 1 (
    python -m http.server %PORTA% --bind 127.0.0.1 --directory "%RAIZ%"
    goto fim
)

py -3 --version >nul 2>&1
if not errorlevel 1 (
    py -3 -m http.server %PORTA% --bind 127.0.0.1 --directory "%RAIZ%"
    goto fim
)

echo Python nao encontrado. Usando o servidor do PowerShell (ferramentas\servidor-local.ps1).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ferramentas\servidor-local.ps1" -Raiz "%RAIZ%" -Porta %PORTA%

:fim
echo.
echo Servidor encerrado.
pause
