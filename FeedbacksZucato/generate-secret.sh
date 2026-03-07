#!/bin/bash

# Script para gerar um ADMIN_SECRET seguro
# Execute: bash generate-secret.sh

echo "Gerando ADMIN_SECRET seguro (64 caracteres aleatórios)..."
ADMIN_SECRET=$(head -c 64 /dev/urandom | base64)

echo ""
echo "====================================="
echo "ADMIN_SECRET gerado com sucesso!"
echo "====================================="
echo ""
echo "Cole isso no seu .env.local:"
echo ""
echo "ADMIN_SECRET=$ADMIN_SECRET"
echo ""
echo "====================================="
