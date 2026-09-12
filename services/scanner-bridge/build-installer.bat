@echo off
cd /d C:\Users\User\Downloads\restpoint\services\scanner-bridge
"C:\Users\User\Downloads\restpoint\node_modules\.bin\pkg.cmd" installer.mjs --targets node18-win-x64 --output dist/Setup-Restpoint-Scanner-Bridge.exe --compress GZip > installer-build.log 2>&1
echo BUILD_EXIT_CODE:%ERRORLEVEL% >> installer-build.log