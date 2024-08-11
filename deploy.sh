#!/bin/bash

# Navigate to the application directory
cd /home/ubuntu/blockscout-app

# Pull the latest changes (if using Git on the server)
./git-ops.sh pull

# Install dependencies (if needed)
npm install

# Build the project (if necessary)
npm run build

# (Re)start your application (if applicable)
# pm2 restart your-application || pm2 start your-application

# copy the dist folder to the nginx folder
sudo cp -r /home/ubuntu/blockscout-app/dist/* /var/www/html/
