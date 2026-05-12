@echo off
title CRM Amplifica - Servidor
cd /d "C:\Users\José Tomás Costa\amplifica-crm"
set PATH=%PATH%;C:\Program Files\nodejs
echo Iniciando CRM Amplifica...
echo No cierres esta ventana - el servidor corre aqui
echo Abre tu navegador en: http://localhost:3000
echo.
npm run dev
pause
