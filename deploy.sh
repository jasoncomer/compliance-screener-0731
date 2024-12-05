#!/bin/bash

set -e  # Exit on error
set -x  # Print commands being executed

# Load NVM and use the correct Node.js version
export NVM_DIR="$HOME/.nvm"
# This loads nvm
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# This loads nvm bash_completion
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Navigate to the application directory
cd /home/ubuntu/blockscout-app || exit 1

# Pull the latest changes (if using Git on the server)
./git-ops.sh pull

# Install dependencies
npm install || exit 1

# Build the project
npm run build || exit 1

# (Re)start your application (if applicable)
# pm2 restart your-application || pm2 start your-application

# Copy the dist folder to the nginx folder
sudo cp -r /home/ubuntu/blockscout-app/dist/* /var/www/html/
