@echo off
setlocal

echo [1/3] Building React (Vite)
pushd "%~dp0src\V2ex.Maui2.React" || exit /b 1
pnpm build || exit /b 1
popd

echo [2/3] Building MAUI App
pushd "%~dp0" || exit /b 1
dotnet build "%~dp0src\V2ex.Maui2.App\V2ex.Maui2.App.csproj" || exit /b 1
popd

echo [3/3] Done
endlocal