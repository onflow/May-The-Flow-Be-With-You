import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;

class AIClassifierService {
  Interpreter? _interpreter;
  List<String>? _labels;
  bool _isModelLoaded = false;

  static const String _modelPath = 'assets/models/animal_classifier_model.tflite';
  static const String _labelsPath = 'assets/models/labels.txt';

  Future<void> _loadModel() async {
    if (_isModelLoaded) return;

    try {
      // Load the TFLite model
      _interpreter = await Interpreter.fromAsset(_modelPath);
      
      // Load labels
      final labelsData = await rootBundle.loadString(_labelsPath);
      _labels = labelsData.split('\n').where((label) => label.isNotEmpty).toList();
      
      _isModelLoaded = true;
    } catch (e) {
      throw Exception('Failed to load AI model: $e');
    }
  }

  Future<Map<String, dynamic>> classifyImage(File imageFile) async {
    await _loadModel();

    if (_interpreter == null || _labels == null) {
      throw Exception('Model not loaded properly');
    }

    try {
      // Read and preprocess the image
      final imageBytes = await imageFile.readAsBytes();
      final image = img.decodeImage(imageBytes);
      
      if (image == null) {
        throw Exception('Failed to decode image');
      }

      // Resize image to model input size (assuming 224x224)
      final resizedImage = img.copyResize(image, width: 224, height: 224);
      
      // Convert to input tensor
      final input = _imageToByteListFloat32(resizedImage);
      
      // Prepare output tensor
      final output = List.filled(1 * _labels!.length, 0.0).reshape([1, _labels!.length]);
      
      // Run inference
      _interpreter!.run(input, output);
      
      // Process results
      final probabilities = output[0] as List<double>;
      final maxIndex = probabilities.indexOf(probabilities.reduce((a, b) => a > b ? a : b));
      
      return {
        'label': _labels![maxIndex],
        'confidence': probabilities[maxIndex],
        'probabilities': Map.fromIterables(_labels!, probabilities),
      };
    } catch (e) {
      throw Exception('Failed to classify image: $e');
    }
  }

  Uint8List _imageToByteListFloat32(img.Image image) {
    final convertedBytes = Float32List(1 * 224 * 224 * 3);
    final buffer = Float32List.view(convertedBytes.buffer);
    int pixelIndex = 0;

    for (int i = 0; i < 224; i++) {
      for (int j = 0; j < 224; j++) {
        final pixel = image.getPixel(j, i);
        int r = (pixel >> 24) & 0xFF;
        int g = (pixel >> 16) & 0xFF;
        int b = (pixel >> 8) & 0xFF;
        buffer[pixelIndex++] = (r - 127.5) / 127.5;
        buffer[pixelIndex++] = (g - 127.5) / 127.5;
        buffer[pixelIndex++] = (b - 127.5) / 127.5;
      }
    }
    return convertedBytes.buffer.asUint8List();
  }

  void dispose() {
    _interpreter?.close();
    _interpreter = null;
    _isModelLoaded = false;
  }
}