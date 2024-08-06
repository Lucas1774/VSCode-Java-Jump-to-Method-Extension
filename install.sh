#!/bin/bash

set -e
vsce package
VSIX_FILE=$(ls *.vsix | head -n 1)
code --install-extension "$VSIX_FILE"
rm "$VSIX_FILE"
echo "Press any key to exit."
read -n 1
