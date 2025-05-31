# Frog & Iguana NFT Minter

A Flutter application that uses AI to verify frog and iguana images and mints them as NFTs on the Flow testnet blockchain.

## Features

- AI-powered image classification using TensorFlow Lite
- Image capture from camera or gallery
- Wallet connection and transaction signing
- NFT minting on Flow testnet
- Provider-based state management


## Installation instructions:


- Create a new flutter application by using the commannd in your vscode IDE using command ctrl+shift+p to display options
- Copy the project folders named assets and lib to your project root directory(Android folder might not be necessary due to varying gradle versions).
- Add the foloowing dependencies to your pubspec.yaml folder in this order;
provider: ^6.1.1
  image_picker: ^1.0.4
  tflite_flutter: ^0.10.4
  web3dart: ^2.7.3
  http: ^1.1.0
  image: ^3.1.1
  crypto: ^3.0.3
  convert: ^3.1.2 
- Afterwards save or run fultter pub get to download the packages.
- Once downloaded hit run on either mobile or web versions and enjoy!