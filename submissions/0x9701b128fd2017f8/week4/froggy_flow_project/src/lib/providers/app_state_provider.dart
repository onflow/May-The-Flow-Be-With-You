import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'dart:io';
import '../services/ai_classifier_service.dart';
import '../services/wallet_service.dart';
import '../services/nft_service.dart';

enum AppState {
  initial,
  imageSelected,
  classifying,
  animalConfirmed,
  connectingWallet,
  walletConnected,
  minting,
  minted,
  error
}

class AppStateProvider extends ChangeNotifier {
  AppState _currentState = AppState.initial;
  File? _selectedImage;
  String? _classificationResult;
  double _confidence = 0.0;
  String? _walletAddress;
  String? _errorMessage;
  String? _nftTokenId;

  final AIClassifierService _aiService = AIClassifierService();
  final WalletService _walletService = WalletService();
  final NFTService _nftService = NFTService();

  // Getters
  AppState get currentState => _currentState;
  File? get selectedImage => _selectedImage;
  String? get classificationResult => _classificationResult;
  double get confidence => _confidence;
  String? get walletAddress => _walletAddress;
  String? get errorMessage => _errorMessage;
  String? get nftTokenId => _nftTokenId;

  bool get isImageSelected => _selectedImage != null;
  bool get isAnimalConfirmed => _classificationResult != null && _confidence > 0.8;
  bool get isWalletConnected => _walletAddress != null;

  Future<void> selectImage(File image) async {
    _selectedImage = image;
    _classificationResult = null;
    _confidence = 0.0;
    _currentState = AppState.imageSelected;
    _clearError();
    notifyListeners();
  }

  Future<void> classifyImage() async {
    if (_selectedImage == null) return;

    try {
      _currentState = AppState.classifying;
      notifyListeners();

      final result = await _aiService.classifyImage(_selectedImage!);
      _classificationResult = result['label'];
      _confidence = result['confidence'];

      if (_confidence > 0.8 && 
          (_classificationResult == 'frog' || _classificationResult == 'iguana')) {
        _currentState = AppState.animalConfirmed;
      } else {
        _setError('Image must be a frog or iguana with high confidence');
      }
    } catch (e) {
      _setError('Failed to classify image: $e');
    }
    notifyListeners();
  }

  Future<void> connectWallet() async {
    try {
      _currentState = AppState.connectingWallet;
      notifyListeners();

      _walletAddress = await _walletService.connectWallet();
      _currentState = AppState.walletConnected;
    } catch (e) {
      _setError('Failed to connect wallet: $e');
    }
    notifyListeners();
  }

  Future<void> mintNFT() async {
    if (_selectedImage == null || _walletAddress == null || !isAnimalConfirmed) {
      return;
    }

    try {
      _currentState = AppState.minting;
      notifyListeners();

      _nftTokenId = await _nftService.mintNFT(
        _selectedImage!,
        _classificationResult!,
        _walletAddress!,
      );

      _currentState = AppState.minted;
    } catch (e) {
      _setError('Failed to mint NFT: $e');
    }
    notifyListeners();
  }

  void reset() {
    _currentState = AppState.initial;
    _selectedImage = null;
    _classificationResult = null;
    _confidence = 0.0;
    _errorMessage = null;
    _nftTokenId = null;
    notifyListeners();
  }

  void _setError(String message) {
    _errorMessage = message;
    _currentState = AppState.error;
  }

  void _clearError() {
    _errorMessage = null;
  }
}