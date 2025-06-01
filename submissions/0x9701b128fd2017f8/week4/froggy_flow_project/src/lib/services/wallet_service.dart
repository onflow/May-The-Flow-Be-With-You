import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:web3dart/crypto.dart';
import 'package:web3dart/web3dart.dart';
import 'package:http/http.dart' as http;

class WalletService {
  static const String _flowTestnetRpcUrl = 'https://testnet.evm.nodes.onflow.org';
  
  Web3Client? _web3Client;
  EthereumAddress? _userAddress;
  EthPrivateKey? _credentials;

  Future<String> connectWallet() async {
    try {
      // Initialize Web3 client
      _web3Client = Web3Client(_flowTestnetRpcUrl, http.Client());
      
      // For demo purposes, generate a random wallet
      // In a real app, you'd integrate with wallet providers like MetaMask
      _credentials = EthPrivateKey.createRandom(Random.secure());
      _userAddress = _credentials!.address;
      
      // Verify connection by getting chain ID
      final chainId = await _web3Client!.getChainId();
      if (kDebugMode) {
        print('Connected to Flow testnet, Chain ID: $chainId');
      }
      
      return _userAddress!.hex;
    } catch (e) {
      throw Exception('Failed to connect wallet: $e');
    }
  }

  Future<String> signTransaction(String data) async {
    if (_credentials == null) {
      throw Exception('Wallet not connected');
    }

    try {
      // Create a simple transaction for demonstration
      final transaction = Transaction(
        to: _userAddress,
        gasPrice: EtherAmount.inWei(BigInt.from(20000000000)), // 20 gwei
        maxGas: 21000,
        value: EtherAmount.zero(),
        data: hexToBytes(data),
      );

      // Sign the transaction
      final signedTx = await _web3Client!.signTransaction(_credentials!, transaction);
      
      return bytesToHex(signedTx);
    } catch (e) {
      throw Exception('Failed to sign transaction: $e');
    }
  }

  Future<BigInt> getBalance() async {
    if (_web3Client == null || _userAddress == null) {
      throw Exception('Wallet not connected');
    }

    try {
      final balance = await _web3Client!.getBalance(_userAddress!);
      return balance.getInWei;
    } catch (e) {
      throw Exception('Failed to get balance: $e');
    }
  }

  String? get userAddress => _userAddress?.hex;
  bool get isConnected => _userAddress != null;

  void disconnect() {
    _web3Client?.dispose();
    _web3Client = null;
    _userAddress = null;
    _credentials = null;
  }
}