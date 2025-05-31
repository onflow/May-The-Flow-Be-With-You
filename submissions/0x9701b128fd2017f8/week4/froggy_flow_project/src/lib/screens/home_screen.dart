import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../providers/app_state_provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Frog & Iguana NFT Minter'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Consumer<AppStateProvider>(
        builder: (context, appState, child) {
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildStatusCard(appState),
                const SizedBox(height: 20),
                _buildImageSection(context, appState),
                const SizedBox(height: 20),
                _buildClassificationSection(appState),
                const SizedBox(height: 20),
                _buildWalletSection(appState),
                const SizedBox(height: 20),
                _buildMintSection(appState),
                if (appState.errorMessage != null) ...[
                  const SizedBox(height: 20),
                  _buildErrorSection(appState),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusCard(AppStateProvider appState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text(
              'Status: ${_getStatusText(appState.currentState)}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            if (appState.walletAddress != null) ...[
              const SizedBox(height: 8),
              Text('Wallet: ${appState.walletAddress!.substring(0, 10)}...'),
            ],
            if (appState.nftTokenId != null) ...[
              const SizedBox(height: 8),
              Text('NFT Token ID: ${appState.nftTokenId}'),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection(BuildContext context, AppStateProvider appState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text(
              'Upload Frog or Iguana Image',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (appState.selectedImage != null) ...[
              Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    appState.selectedImage!,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _pickImage(context, ImageSource.camera),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Camera'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _pickImage(context, ImageSource.gallery),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('Gallery'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClassificationSection(AppStateProvider appState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text(
              'AI Classification',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (appState.classificationResult != null) ...[
              Text('Animal: ${appState.classificationResult}'),
              Text('Confidence: ${(appState.confidence * 100).toStringAsFixed(1)}%'),
              const SizedBox(height: 16),
            ],
            ElevatedButton(
              onPressed: appState.isImageSelected && 
                         appState.currentState != AppState.classifying
                  ? () => appState.classifyImage()
                  : null,
              child: appState.currentState == AppState.classifying
                  ? const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 8),
                        Text('Classifying...'),
                      ],
                    )
                  : const Text('Confirm Animal'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWalletSection(AppStateProvider appState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text(
              'Wallet Connection',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: !appState.isWalletConnected && 
                         appState.currentState != AppState.connectingWallet
                  ? () => appState.connectWallet()
                  : null,
              child: appState.currentState == AppState.connectingWallet
                  ? const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 8),
                        Text('Connecting...'),
                      ],
                    )
                  : Text(appState.isWalletConnected 
                      ? 'Wallet Connected' 
                      : 'Connect Wallet'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMintSection(AppStateProvider appState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text(
              'Mint NFT',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: appState.isAnimalConfirmed && 
                         appState.isWalletConnected &&
                         appState.currentState != AppState.minting
                  ? () => appState.mintNFT()
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
              child: appState.currentState == AppState.minting
                  ? const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 8),
                        Text('Minting...'),
                      ],
                    )
                  : const Text('Mint NFT'),
            ),
            if (appState.currentState == AppState.minted) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => appState.reset(),
                child: const Text('Mint Another'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildErrorSection(AppStateProvider appState) {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Icon(Icons.error, color: Colors.red),
            const SizedBox(height: 8),
            Text(
              appState.errorMessage!,
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(BuildContext context, ImageSource source) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source);
    
    if (pickedFile != null) {
      final appState = Provider.of<AppStateProvider>(context, listen: false);
      appState.selectImage(File(pickedFile.path));
    }
  }

  String _getStatusText(AppState state) {
    switch (state) {
      case AppState.initial:
        return 'Ready to start';
      case AppState.imageSelected:
        return 'Image selected';
      case AppState.classifying:
        return 'Classifying image...';
      case AppState.animalConfirmed:
        return 'Animal confirmed';
      case AppState.connectingWallet:
        return 'Connecting wallet...';
      case AppState.walletConnected:
        return 'Wallet connected';
      case AppState.minting:
        return 'Minting NFT...';
      case AppState.minted:
        return 'NFT minted successfully!';
      case AppState.error:
        return 'Error occurred';
    }
  }
}