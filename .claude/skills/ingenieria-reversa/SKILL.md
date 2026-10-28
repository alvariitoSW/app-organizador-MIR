---
name: ingenieria-reversa
description: Reverse engineer shipped software with plain local CLI tools, no MCP needed. Covers Electron/JS bundles, native Mach-O/ELF/PE, Go/Rust/.NET/Flutter/WASM binaries, APKs, SQLite, pcaps, firmware and websites. Use to explain how a feature works, extract versions/deps, compare builds, or rebuild a feature. Úsala cuando el usuario escriba «/ingenieria-reversa», «ingeniería inversa» o pida ver cómo funciona por dentro una app, un binario o una web.
---

# leanrea: fast path

<!-- Copia de https://github.com/aicodeking/leanrea (commit 09ba4aa, licencia MIT: ver LICENSE), instalada el 2026-10-23 con el nombre «ingenieria-reversa». Cambian el nombre, la línea en español de la descripción y la sección «En este contenedor» del final (añadida el 2026-10-25); el resto es el original. -->

You already know these tools. This file only lists the fastest command for each target, and the traps.

## Rules
- Work on a copy (`cp -c` on APFS is instant). Put each extraction in a new dir under `$TMPDIR/re/<name>`. Reuse an extraction if one exists.
- Route by `file -b T` and the magic bytes first. Run the cheapest inventory next. Only then decompile or read code.
- `rg` skips hidden and ignored files, and bundlers hide code (Electron: `.webpack/`, `.vite/`). Always search extracted trees with `rg -uu`.
- Never `cat` a big or minified file. Slice it: `rg -o '.{0,200}NEEDLE.{0,200}' F | head`. Dump a disassembly once to a file, then grep that file.
- Batch independent probes into ONE shell call with `;` and `echo '--- name'` markers (quoted: zsh expands a bare `==x`). Cap every output with `head` or `-m`.
- Answer from evidence. In the answer, mark each claim as **seen** (cite file:offset, or a symbol/string) or **inferred**. A fact you did not find is **unknown**, not "absent". Static reading is not observed execution.
- A missing tool is not a blocker. Use the fallback in the same row, or `brew install <x>` if the user allows it.
- Turns cost more than bytes. Aim for 2–4 tool calls: one batched recon call, one or two targeted slices, then answer. Stop when every item you were asked has evidence. Do not re-verify what you already saw.

## First move: one call each, paste and run
Native (Mach-O):
```sh
T=./bin; D=$TMPDIR/re/$(basename $T); mkdir -p $D; file $T; lipo -info $T; otool -L $T; echo '--- EXPORTS'; nm -gU $T | head -150; echo '--- IMPORTS'; nm -u $T | rg -v '^__Z|napi_' | tr '\n' ' '; echo; echo '--- STRINGS'; strings -a -n 6 $T | rg -v '^[_$.]' | head -400; otool -tV $T > $D/dis.txt; echo '--- FUNCS'; rg '^[_a-zA-Z].*:$' $D/dis.txt | rg -v '^_?_?Z?N?St3' | head -150
```
Then read one function: `awk '/^FUNC_LABEL:$/{p=1;next} p&&/^[_a-zA-Z].*:$/{exit} p' $D/dis.txt | rg 'bl|b\.|cmp|literal|mov\s+w2'`.

Electron:
```sh
A=./app.asar; X=$TMPDIR/re/asar; rm -rf $X; npx -y @electron/asar extract $A $X && jq '{name,version,main}' $X/package.json; find $X -path '*/node_modules' -prune -o -type f \( -name '*.js' -o -name '*.node' \) -print | head -60; ls ${A}.unpacked/node_modules 2>/dev/null; rg -uu -l --glob '!node_modules' 'exposeInMainWorld' $X
```
Then slice the needle across the bundle: `rg -uu -o --glob '!node_modules' '.{0,250}NEEDLE.{0,250}' $X | head -20`.

Go: `go version -m T` alone usually answers the question.

## Router
| Target (detect) | Fastest path |
|---|---|
| Electron app (`*.app/Contents/Resources/app.asar`) | `npx -y @electron/asar extract app.asar X` (also see `app.asar.unpacked/` for `.node` addons). Entry point: `jq .main X/package.json`. Surface: `rg -n -o '.{0,120}(ipcMain\.(handle|handleOnce|on|once)|ipcRenderer\.(invoke|send|sendSync|on)|contextBridge\.exposeIn(Main|Isolated)World|webPreferences|preload:|nodeIntegration|contextIsolation|sandbox|\.node\b).{0,160}' -uu X --glob '!node_modules'`. App-specific IPC wrappers often hide the channels, so also run `rg -uu -o '"[a-z]+:[a-z0-9:-]+"' X/<main> \| sort -u`. Fuses: `npx -y @electron/fuses read --app A.app`. |
| Web bundle / minified JS | Find `sourceMappingURL`. If the map has `sourcesContent`, dump the sources: `jq -r '.sources[]'`. For webpack, grep the module ids, then slice around the hit. For pretty-print: `npx -y prettier --parser babel F > F.pretty.js`, then read with line ranges. |
| Hermes / bytenode / V8 snapshot | Hermes magic is `c6 1f bc 03` (`index.android.bundle`): use `hermes-dec` / `hbc-decompiler`. `.jsc` (bytenode) cannot be decompiled: use strings and runtime hooks. |
| Mach-O (`file`: Mach-O) | `lipo -info` (thin first: `lipo -thin arm64 -o T1 T`). Then: `otool -L` (libs); `xcrun dyld_info -exports -imports`; `nm -gU` (exports) / `nm -u` (imports = the capability map); `strings -a -n 6`; `otool -l \| rg -A3 'LC_(RPATH\|BUILD_VERSION)'`; `codesign -d --entitlements :- T`; `otool -ov` (ObjC classes/methods); `xcrun swift-demangle --compact`. |
| Native code logic | `otool -tV T > $D/dis.txt` (or `llvm-objdump -d --no-show-raw-insn -C`). Find the function: `rg -n '^_?.*Name.*:$'`. Read the call/string trail: `awk '/^FUNC:/{p=1} p&&/^[_a-zA-Z].*:$/&&!/FUNC/{exit} p' dis.txt \| rg 'bl\|call\|literal\|cmp'`. otool labels string literals and stubs inline, which is often enough. Only for real pseudocode: Ghidra `analyzeHeadless $D p -import T -postScript DecompileAll.java -deleteProject` or `r2 -qc 'aaa; pdc @ sym.X' T`. |
| ELF / PE | `readelf -hlSW`, `readelf -dW` (NEEDED), `nm -D --defined-only`, `objdump -d -M intel`. PE: `objdump -x`, `pefile`/`wrestool` for resources. checksec: `pwn checksec`. |
| Go (`__go_buildinfo`, `.go.buildinfo`) | `go version -m T` gives the toolchain, path, mod, deps and build flags in one call. Without Go: `strings -a T \| rg -m1 -A200 'Go buildinf' `. Symbols survive stripping: `go tool nm T \| rg main\.`. |
| Rust | Deps (cargo-auditable): `cargo audit bin T`, or extract `.dep-v0` / `__DATA,.dep-v0` and zlib-inflate it. Compiler: `strings -a T \| rg -o '/rustc/[0-9a-f]{40}' \| sort -u`. Crates from paths: `strings -a T \| rg -o '[a-z0-9_-]+-[0-9]+\.[0-9]+\.[0-9]+/src' \| sort -u`. |
| .NET (`file`: Mono/.Net) | `ilspycmd -p -o X T.dll` (install: `dotnet tool install -g ilspycmd`), then `rg`. P/Invoke: `rg DllImport X`. NativeAOT/IL2CPP are native: use the native rows. |
| Android APK | `jadx -d X --show-bad-code a.apk` then `rg`. Resources/manifest only: `apktool d --no-src -o X a.apk`. Quick look: `unzip -l a.apk`. `lib/*/libflutter.so` means Flutter (Dart AOT: `blutter`); `libhermes.so` means React Native (Hermes row). |
| Flutter snapshot hash | In `libapp.so`, find magic `f5 f5 dc dc`; the 32 hex chars at +20 are the snapshot hash. Map it to a Dart version. |
| WASM | `wasm-objdump -x`, `wasm2wat`, `wasm-decompile` (WABT). |
| SQLite | Copy the db, plus the `-wal` file if present. `sqlite3 'file:C?mode=ro' '.schema'`, then `SELECT * FROM t LIMIT 20`. |
| plist / nib / car | `plutil -p F`. Info.plist holds the bundle id, URL schemes and privacy strings. Asset catalogs: `assetutil --info Assets.car`. |
| pcap / HAR | `tshark -r C -q -z conv,tcp`; `tshark -r C -T fields -e dns.qry.name -e tls.handshake.extensions_server_name -e http.request.full_uri \| sort -u`. HAR: `jq -r '.log.entries[].request \| .method+" "+.url'`. |
| Firmware | `binwalk -e F` or `unblob -e X F`. Then route each extracted binary through this table. |
| Website | `curl -sL URL` for the HTML and script srcs, then fetch the JS and slice it. For runtime behavior, use a headless browser with a network log (Playwright `page.on('request')`) or Chrome `--remote-debugging-port`. |
| Running app / runtime | macOS: `lldb -p PID`, `dtrace`/`fs_usage`/`log stream --predicate 'process=="X"'`. Electron main: `--inspect` (only if the RunAsNode/inspect fuses allow it). Android: `adb logcat`, `frida -U -f pkg -l hook.js`. |

## Speed patterns
- Strings and imports first. On a small binary, `nm -u` + `strings` + the export list usually answer "what does it do" with no disassembly.
- To find who uses a string: get its address from `otool -tV` "literal pool for" comments, or `rg -n 'literal pool for: "X'`. Then find the enclosing function label above that line.
- A C++ name in a `bl` target already tells you the protocol (for example `getpeereid`, `write`, `std::hash`). Read the call sequence, not every instruction.
- For JS, go from the native/JS boundary inward: find the native call, then its caller class, then the IPC registration, then the renderer/preload.
- Comparing versions: diff the inventories (`nm`, the module list, `go version -m`) before you diff any code.
- Rebuilding: write the minimal reimplementation, then test it against the original (same inputs, same outputs).

## Install (only on request)
`brew install jadx apktool radare2 binwalk wabt wireshark ghidra` · `npm i -g @electron/asar` · `dotnet tool install -g ilspycmd` · `cargo install cargo-audit`.

## En este contenedor (Linux en la nube) · añadido
La guía de arriba es de Mac. Aquí (Ubuntu, sin `brew`) se ha comprobado esto:
- **Hay:** `file`, `rg`, `jq`, `strings`, `od`, `readelf`, `objdump`, `nm`, LLVM 18 (`llvm-objdump`, `llvm-nm`, `llvm-readobj`, `llvm-strings`, `llvm-cxxfilt`), `node`/`npx` (`npx -y @electron/asar` funciona), `go`, `python3` (con `sqlite3`) y Chromium en `/opt/pw-browsers/chromium` con Playwright en `node_modules/` del proyecto.
- **No hay:** `otool`, `lipo`, `codesign`, `plutil`, `xcrun`, `sqlite3` (la orden), `tshark`, `binwalk`, `jadx`, `apktool`, `r2`, WABT ni Ghidra. Instalar (`apt-get`, `pip3`) solo si el usuario lo permite.
- **`$TMPDIR` está vacío:** extrae en la carpeta temporal de la sesión (scratchpad) o en `/tmp/re/<nombre>`.
- **Equivalencias:**
  - Bytes mágicos: `head -c 16 T | od -An -tx1`.
  - Mach-O (de un `.app` que te pasen): `llvm-objdump --macho --universal-headers T` (en vez de `lipo -info`); `llvm-objdump --macho --dylibs-used T` (`otool -L`); `llvm-objdump --macho --exports-trie --bind T` (`dyld_info -exports -imports`); `llvm-nm -gU T` / `llvm-nm -u T`; `llvm-objdump --macho -d --no-show-raw-insn T > $D/dis.txt` (`otool -tV`); `llvm-objdump --macho --private-headers T | rg -A3 'LC_(RPATH|BUILD_VERSION)'`; `llvm-objdump --macho --objc-meta-data T`. Las firmas y permisos (`codesign`) no se pueden leer aquí: márcalo como **desconocido**.
  - ELF: la fila «ELF / PE» funciona tal cual (`readelf -dW`, `nm -D --defined-only`, `objdump -d --no-show-raw-insn -C`).
  - SQLite sin la orden: `python3 -c "import sqlite3,sys;c=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True);print(c.execute('select name,sql from sqlite_master').fetchall())" C`; luego `select * from t limit 20` igual.
  - plist: `python3 -c "import plistlib,sys,pprint;pprint.pprint(plistlib.load(open(sys.argv[1],'rb')))" Info.plist`.
- **La red solo deja salir a algunos sitios** (npm y GitHub sí; webs normales no). Si `curl` dice `CONNECT tunnel failed, response 403` o Chromium `ERR_TUNNEL_CONNECTION_FAILED`, no es la web: es la red del entorno. No insistas: pide al usuario el archivo (la app, el `.apk`, el HAR guardado desde su navegador) o que permita ese dominio en la red del entorno.
- **REA (morluto/rea), por terminal:** su skill `reverse-engineer-anything` está copiada, pero el servidor MCP ya no se carga en cada sesión (sus ~250 herramientas gastaban contexto en todas; 2026-10-27). Úsalo por terminal cuando haga falta su análisis con evidencias: `npx -y rea-agents@6.8.0 analyze-javascript-application /ruta --json`. Si una sesión entera va de ingeniería inversa y lo quieres como servidor, copia `tools/rea.mcp.json` a `.mcp.json` en esa rama y abre sesión nueva; para mirar rápido, lo de arriba basta.
- **Responde en español:** cada afirmación, **visto** (archivo:posición, símbolo o texto), **deducido** o **desconocido**.
- **Lo que se extrae se queda en la carpeta temporal:** nunca al repositorio. Nada de datos personales del usuario (ver `CLAUDE.md`).
