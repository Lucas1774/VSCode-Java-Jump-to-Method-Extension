#!/bin/bash

set -e
function cleanup {
    echo "Press any key to exit."
    read -n 1
}
trap cleanup ERR
npx webpack --mode production --devtool hidden-source-map
sed -i.bak 's#"main": "./extension.js"#"main": "./dist/extension.js"#' package.json
vsce package
mv package.json.bak package.json
VSIX_FILE=$(ls *.vsix | head -n 1)
code --install-extension "$VSIX_FILE"
unzip -l "$VSIX_FILE"
rm "$VSIX_FILE"
cleanup
