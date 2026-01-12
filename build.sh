#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/4] Building React (Vite)"
cd "$root_dir/src/V2ex.Maui2.React"
pnpm build

echo "[2/4] Building REST API"
cd "$root_dir"
dotnet build "$root_dir/src/V2ex.Maui2.Api/V2ex.Maui2.Api.csproj"

echo "[3/4] Building MAUI App"
cd "$root_dir"
dotnet build "$root_dir/src/V2ex.Maui2.App/V2ex.Maui2.App.csproj"

echo "[4/4] Done"