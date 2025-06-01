module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        {
          module: /@mediapipe\/tasks-vision/,
          message: /Failed to parse source map/,
        },
      ],
    },
  },
}; 