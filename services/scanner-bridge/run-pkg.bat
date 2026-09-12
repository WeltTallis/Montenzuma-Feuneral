@echo off
cd /d C:\Users\User\Downloads\restpoint\services\scanner-bridge
"C:\Users\User\Downloads\restpoint\node_modules\.bin\pkg.cmd" dist/agent.js --targets node18-win-x64 --output dist/agent.exe --compress GZip > pkg-build-result.log 2>&1
echo PKG_EXIT_CODE:%ERRORLEVEL% >> pkg-build-result.log