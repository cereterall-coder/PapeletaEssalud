@echo off
title Servidor de Papeletas EsSalud
echo Iniciando Servidor...
cd /d "%~dp0"
node server/index.js
pause
