import React from 'react';
import { View, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const MathRichText = ({ content }) => {
  // Escape characters for JavaScript injection
  const escapeForJS = (str) => str.replace(/\\/g, '\\\\')
//   .replace(//g, '\\').replace(/\$/g, '\\$');

  // Convert content to HTML with KaTeX-rendered spans
  const convertToKaTeXHTML = (input) => {
    const regex = /\${1,2}(.*?)\${1,2}/g;
    let result = '';
    let lastIndex = 0;
    let match;
    let counter = 0;
  
    while ((match = regex.exec(input)) !== null) {
      const [fullMatch, latex] = match;
      const plainTextBefore = input.slice(lastIndex, match.index);
      result += `<span style="white-space: pre-wrap;">${plainTextBefore}</span>`;
      result += `<span id="math${counter}"></span>`;
      result += `<script>
        katex.render(String.raw\`${latex}\`, document.getElementById("math${counter}"), {
          throwOnError: false,
          displayMode: ${fullMatch.startsWith('$$')}
        });
      </script>`;
      counter++;
      lastIndex = regex.lastIndex;
    }
  
    result += `<span style="white-space: pre-wrap;">${input.slice(lastIndex)}</span>`;
    return result;
  };
  

  const htmlBody = convertToKaTeXHTML(content);

  const htmlContent = `
  <html>
    <head>
      <meta charset="utf-8">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css">
      <script src="https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.js"></script>
    </head>
    <body style="font-size: 18px; font-family: sans-serif; line-height: 1.5; padding: 16px; color: #1e293b;">
      ${htmlBody}
    </body>
  </html>
`;


  return (
    <View style={{ width: Dimensions.get('window').width, height: 150 }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
      />
    </View>
  );
};

export default MathRichText;