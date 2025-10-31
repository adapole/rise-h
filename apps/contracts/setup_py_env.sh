#!/bin/bash
echo "🐍 Setting up Python environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r apps/contracts/templates/requirements.txt
echo "✅ Python environment ready."
