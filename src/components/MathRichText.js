import React, { useState } from 'react'; // Added useState for the loading indicator
import { View, Dimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview'; // Using the standard WebView here for manual height calculation

const MathRichText = ({ content }) => {
  const [webViewHeight, setWebViewHeight] = useState(150);
  const [loading, setLoading] = useState(true);

  const convertToKaTeXHTML = (input) => {
    const regex = /\${1,2}(.*?)\${1,2}/g;
    let result = '';
    let lastIndex = 0;
    let counter = 0;
    let match;

    while ((match = regex.exec(input)) !== null) {
      const [fullMatch, latex] = match;
      const plainTextBefore = input.slice(lastIndex, match.index);
      
      // Plain text parts - apply word-break for very long words if needed
      result += `<span style="white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word;">${plainTextBefore}</span>`;
      
      // KaTeX parts
      // Ensured inline-block to allow overflow-x and max-width to function
      result += `<span id="math${counter}" class="math-display"></span>`; 
      result += `<script>
        try {
          katex.render(String.raw\`${latex}\`, document.getElementById("math${counter}"), {
            throwOnError: false,
            displayMode: ${fullMatch.startsWith('$$')}
          });
        } catch (e) {
          document.getElementById("math${counter}").innerHTML = '<span style="color: red;">Error: ' + e.message + '</span>';
        }
      </script>`;
      counter++;
      lastIndex = regex.lastIndex;
    }

    // Remaining plain text
    result += `<span style="white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word;">${input.slice(lastIndex)}</span>`;
    return result;
  };

  const htmlBody = convertToKaTeXHTML(content);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.js"></script>
  <style>
    body {
      font-size: 20px; /* Increased base font size */
      font-family: sans-serif;
      line-height: 1.6; /* Slightly increased line height for readability */
      padding: 16px; /* Keep padding */
      color: #1e293b;
      margin: 0; /* Remove default body margin */
      box-sizing: border-box; /* Include padding in element's total width/height */
      word-break: break-word; /* Ensure long words break */
      overflow-wrap: break-word; /* Modern equivalent */
      width: 88vw; /* Ensure body takes full viewport width */
      overflow-x: hidden; /* Prevent horizontal scrolling on the body itself */
      align-items:center
    }

    /* Target KaTeX specific elements for better overflow handling */
    .katex-display { /* For block-level math like $$...$$ */
        overflow-x: auto; /* Allow horizontal scroll within the math block */
        max-width: 100%; /* Ensure it doesn't exceed parent width */
        padding-bottom: 5px; 
        box-sizing: border-box; /* Crucial for handling padding/borders within max-width */
        display: block; /* Ensure it behaves as a block element */
    }
    .katex { /* For inline math like $...$ */
        font-size: 1.1em; /* Slightly larger KaTeX font if default is too small */
        overflow-x: auto; /* Allow horizontal scroll for long inline math */
        max-width: 100%; /* Ensure it respects container width */
        display: inline-block; /* Treat as block to apply width/overflow */
        vertical-align: middle; /* Align inline math better with text */
        white-space: normal; /* Allow internal wrapping */
        box-sizing: border-box;
    }
    
    /* Ensure images or other replaced content don't overflow */
    img, video, canvas {
        max-width: 100%;
        height: auto;
        box-sizing: border-box;
    }
  </style>
</head>
<body onload="window.ReactNativeWebView.postMessage(document.body.scrollHeight)">
  ${htmlBody}
</body>
</html>
`;

  const onMessage = (event) => {
    const contentHeight = parseInt(event.nativeEvent.data);
    if (!isNaN(contentHeight) && contentHeight > 0) {
      setWebViewHeight(contentHeight + 20); // Add a little extra padding
      setLoading(false); 
    }
  };

  return (
    <View style={{ width: Dimensions.get('window').width, minHeight: 150 }}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ flex: 1, height: webViewHeight, backgroundColor: 'transparent' }} 
        scrollEnabled={true} 
        onMessage={onMessage} 
        injectedJavaScript="window.ReactNativeWebView.postMessage(document.body.scrollHeight)"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={() => setLoading(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1,
  },
});

export default MathRichText;