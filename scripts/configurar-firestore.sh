#!/bin/bash

# Script para configurar Firestore
# Ejecuta: bash scripts/configurar-firestore.sh

echo "🔥 Configurando Firestore para PlayUp"
echo ""

# Verificar si firebase-tools está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado"
    echo "📦 Instalando firebase-tools..."
    npm install -g firebase-tools
fi

# Verificar si está logueado
echo "🔐 Verificando autenticación..."
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  No estás logueado en Firebase"
    echo "🔑 Iniciando login..."
    firebase login
fi

# Verificar proyecto
echo "📋 Verificando proyecto..."
PROJECT_ID=$(firebase use 2>&1 | grep -o 'playup-3a22d' || echo "")
if [ -z "$PROJECT_ID" ]; then
    echo "🔧 Configurando proyecto..."
    firebase use playup-3a22d
fi

echo ""
echo "✅ Configuración lista"
echo ""
echo "📝 Próximos pasos:"
echo "1. Asegúrate de haber creado Firestore Database en Firebase Console"
echo "2. Despliega las reglas: firebase deploy --only firestore:rules"
echo "3. Despliega los índices: firebase deploy --only firestore:indexes"
echo ""
read -p "¿Quieres desplegar las reglas ahora? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Desplegando reglas..."
    firebase deploy --only firestore:rules
fi

read -p "¿Quieres desplegar los índices ahora? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Desplegando índices..."
    firebase deploy --only firestore:indexes
fi

echo ""
echo "✅ ¡Listo! Ahora puedes cargar los datos de ejemplo desde la app."


