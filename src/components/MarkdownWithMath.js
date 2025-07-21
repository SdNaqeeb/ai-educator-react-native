import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const MarkdownWithMath = ({ content }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.3/dist/katex.min.css">
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.15.3/dist/katex.min.js"></script>
      <script>
        document.addEventListener("DOMContentLoaded", function () {
          const math = \`${content.replace(/`/g, "\\`")}\`;
          const output = document.getElementById("math");
          katex.render(math, output, {
            throwOnError: false
          });
        });
      </script>
    </head>
    <body>
      <div id="math" style="font-size: 20px; padding: 10px;"></div>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ width: width - 40, height: 80 }}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
  },
});

export default MarkdownWithMath;
