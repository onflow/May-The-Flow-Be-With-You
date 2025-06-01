#!/bin/bash

# Start Flow emulator in the background
flow emulator &

# Wait for emulator to start
sleep 5

# Create accounts
flow accounts create --key 5112883de06b9576af62b9aafa7ead685fb7fb46c495039b1a83649d61bff97c

# Deploy contracts
flow project deploy

echo "Deployment complete!" 