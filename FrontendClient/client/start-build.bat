@echo off
cd /d "D:\new\restpoint\FrontendClient\client"
node node_modules\vite\bin\vite.js build --outDir dist-check > build_output.txt 2>&1
echo BUILD_EXIT_CODE: %errorlevel% >> build_output.txt