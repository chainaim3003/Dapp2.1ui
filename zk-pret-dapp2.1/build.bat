@echo off
echo Building ZK-PRET Web Application...
cd /d "C:\SATHYA\CHAINAIM3003\mcp-servers\21ALT\Dapp2.1ui\zk-pret-dapp2.1"
call npm run build
if %ERRORLEVEL% EQU 0 (
    echo Build completed successfully!
) else (
    echo Build failed with error level %ERRORLEVEL%
)
pause
