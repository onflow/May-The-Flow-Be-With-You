import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:crypto/crypto.dart';
import 'package:web3dart/web3dart.dart';
import 'wallet_service.dart';

class NFTService {
  static const String _contractAddress = '0x1234567890123456789012345678901234567890'; // Replace with actual contract
  static const String _ipfsGateway = 'https://ipfs.io/ipfs/';
  
  final WalletService _walletService = WalletService();

  Future<String> mintNFT(File imageFile, String animalType, String walletAddress) async {
    try {
      // Step 1: Upload image to IPFS (simulated)
      final imageHash = await _uploadToIPFS(imageFile);
      
      // Step 2: Create metadata
      final metadata = {
        'name': '${animalType.toUpperCase()} NFT #${DateTime.now().millisecondsSinceEpoch}',
        'description': 'A verified $animalType image minted as NFT on Flow testnet',
        'image': '$_ipfsGateway$imageHash',
        'attributes': [
          {
            'trait_type': 'Animal Type',
            'value': animalType,
          },
          {
            'trait_type': 'Verification',
            'value': 'AI Verified',
          },
          {
            'trait_type': 'Mint Date',
            'value': DateTime.now().toIso8601String(),
          },
        ],
      };

      // Step 3: Upload metadata to IPFS (simulated)
      final metadataHash = await _uploadMetadataToIPFS(metadata);
      
      // Step 4: Mint NFT on blockchain (simulated)
      final tokenId = await _mintOnBlockchain(walletAddress, metadataHash);
      
      return tokenId;
    } catch (e) {
      throw Exception('Failed to mint NFT: $e');
    }
  }

  Future<String> _uploadToIPFS(File imageFile) async {
    // Simulate IPFS upload by creating a hash of the file
    // In a real implementation, you'd use a service like Pinata or Infura
    final bytes = await imageFile.readAsBytes();
    final digest = sha256.convert(bytes);
    
    // Simulate upload delay
    await Future.delayed(const Duration(seconds: 2));
    
    return 'Qm${digest.toString().substring(0, 44)}'; // Mock IPFS hash
  }

  Future<String> _uploadMetadataToIPFS(Map<String, dynamic> metadata) async {
    // Simulate metadata upload to IPFS
    final jsonString = jsonEncode(metadata);
    final bytes = utf8.encode(jsonString);
    final digest = sha256.convert(bytes);
    
    // Simulate upload delay
    await Future.delayed(const Duration(seconds: 1));
    
    return 'Qm${digest.toString().substring(0, 44)}'; // Mock IPFS hash
  }

  Future<String> _mintOnBlockchain(String walletAddress, String metadataHash) async {
    try {
      // Simulate blockchain transaction
      // In a real implementation, you'd call the smart contract mint function
      
      // Create mock transaction data
      final mintData = {
        'to': walletAddress,
        'tokenURI': '$_ipfsGateway$metadataHash',
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      };

      // Simulate transaction signing and submission
      final txData = jsonEncode(mintData);
      final signedTx = await _walletService.signTransaction(txData);
      
      // Simulate network delay
      await Future.delayed(const Duration(seconds: 3));
      
      // Generate mock token ID
      final tokenId = DateTime.now().millisecondsSinceEpoch.toString();
      
      return tokenId;
    } catch (e) {
      throw Exception('Failed to mint on blockchain: $e');
    }
  }

  Future<Map<String, dynamic>> getNFTMetadata(String tokenId) async {
    // Simulate fetching NFT metadata
    await Future.delayed(const Duration(seconds: 1));
    
    return {
      'tokenId': tokenId,
      'name': 'Animal NFT #$tokenId',
      'description': 'AI-verified animal NFT',
      'image': '${_ipfsGateway}mock_hash',
    };
  }

  Future<List<String>> getUserNFTs(String walletAddress) async {
    // Simulate fetching user's NFTs
    await Future.delayed(const Duration(seconds: 1));
    
    // Return mock token IDs
    return ['1', '2', '3'];
  }
}