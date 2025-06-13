@echo off
echo ==========================================
echo Testing TypeScript Build
echo ==========================================

echo.
echo Building TypeScript files...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build completed successfully
    echo.
    echo Checking output files...
    if exist "dist\async-server.js" (
        echo ✅ async-server.js compiled
    ) else (
        echo ❌ async-server.js not found
    )
    
    if exist "dist\server.js" (
        echo ✅ server.js compiled  
    ) else (
        echo ❌ server.js not found
    )
) else (
    echo ❌ Build failed
)

echo.
echo ==========================================
echo Build Test Complete
echo ==========================================
pause