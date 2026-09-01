@echo off
cd /d "C:\Users\User\Downloads\restpoint\FrontendClient\client"
call npx vite build > "C:\Users\User\Downloads\restpoint\build_check.log" 2>&1
echo EXITCODE=%ERRORLEVEL% >> "C:\Users\User\Downloads\restpoint\build_check.log"
