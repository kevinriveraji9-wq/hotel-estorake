#!/usr/bin/env bash
set -e
rm -rf public && mkdir -p public
cp index.html favicon.ico apple-touch-icon.png public/
cp -r img public/
echo "built:"; ls public
