"use client"

import { useState } from "react"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { WebView } from "react-native-webview"

const MathRichText = ({ content, style }) => {
  const [webViewHeight, setWebViewHeight] = useState(100)
  const [loading, setLoading] = useState(true)

  const convertToKaTeXHTML = (input) => {
    if (!input || typeof input !== "string") {
      return ""
    }

    const regex = /\${1,2}(.*?)\${1,2}/g
    let result = ""
    let lastIndex = 0
    let counter = 0
    let match

    while ((match = regex.exec(input)) !== null) {
      const [fullMatch, latex] = match
      const plainTextBefore = input.slice(lastIndex, match.index)

      // Escape HTML in plain text
      const escapedPlainText = plainTextBefore
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")

      // Plain text parts with proper wrapping
      result += `<span class="plain-text">${escapedPlainText}</span>`

      // KaTeX parts
      result += `<span id="math${counter}" class="math-container"></span>`
      result += `<script>
        try {
          katex.render(String.raw\`${latex.replace(/`/g, "\\`")}\`, document.getElementById("math${counter}"), {
            throwOnError: false,
            displayMode: ${fullMatch.startsWith("$$")},
            strict: false,
            trust: false
          });
        } catch (e) {
          document.getElementById("math${counter}").innerHTML = '<span class="math-error">Math Error</span>';
        }
      </script>`

      counter++
      lastIndex = regex.lastIndex
    }

    // Remaining plain text
    const remainingText = input
      .slice(lastIndex)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")

    result += `<span class="plain-text">${remainingText}</span>`
    return result
  }

  const htmlBody = convertToKaTeXHTML(content)

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      overflow-x: hidden;
    }
    
    body {
      font-size: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      padding: 12px;
      color: #374151;
      background: transparent;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
    }
    
    .plain-text {
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
    }
    
    .math-container {
      display: inline-block;
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      vertical-align: middle;
      margin: 2px 0;
    }
    
    /* KaTeX display math (block level) */
    .katex-display {
      display: block !important;
      margin: 8px 0 !important;
      text-align: center;
      overflow-x: auto;
      overflow-y: hidden;
      max-width: 100%;
      padding: 4px 0;
    }
    
    .katex-display > .katex {
      display: inline-block;
      white-space: nowrap;
      max-width: none;
    }
    
    /* KaTeX inline math */
    .katex {
      font-size: 1.5em !important;
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      display: inline-block;
      vertical-align: middle;
    }
    
    /* Handle very long expressions */
    .katex .base {
      display: inline-block;
      max-width: 100%;
    }
    
    /* Error styling */
    .math-error {
      color: #DC2626;
      font-size: 20px;
      font-style: italic;
      background: #FEE2E2;
      padding: 2px 4px;
      border-radius: 4px;
    }
    
    /* Responsive adjustments */
    @media (max-width: 480px) {
      body {
        font-size: 20px;
        padding: 8px;
      }
      
      .katex {
        font-size: 1.5em !important;
      }
    }
    
    @media (max-width: 360px) {
      body {
        font-size: 20px;
        padding: 6px;
      }
      
      .katex {
        font-size: 0.85em !important;
      }
    }
    
    /* Ensure no horizontal scrolling on the entire page */
    html {
      overflow-x: hidden;
    }
    
    /* Handle tables and other block elements */
    table {
      max-width: 100%;
      overflow-x: auto;
      display: block;
      white-space: nowrap;
    }
    
    /* Prevent any element from causing horizontal overflow */
    * {
      max-width: 100%;
    }
  </style>
</head>
<body>
  <div id="content">${htmlBody}</div>
  <script>
    function updateHeight() {
      const content = document.getElementById('content');
      const height = Math.max(content.scrollHeight, content.offsetHeight, 50);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'height',
        height: height
      }));
    }
    
    // Update height after KaTeX rendering
    setTimeout(updateHeight, 100);
    setTimeout(updateHeight, 300);
    setTimeout(updateHeight, 500);
    
    // Also update on window resize (orientation change)
    window.addEventListener('resize', updateHeight);
    
    // Initial height update
    updateHeight();
  </script>
</body>
</html>`

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === "height" && data.height) {
        const newHeight = Math.max(data.height + 20, 50) // Add padding and ensure minimum height
        setWebViewHeight(newHeight)
        setLoading(false)
      }
    } catch (error) {
      // Fallback for non-JSON messages
      const contentHeight = Number.parseInt(event.nativeEvent.data)
      if (!isNaN(contentHeight) && contentHeight > 0) {
        setWebViewHeight(Math.max(contentHeight + 20, 50))
        setLoading(false)
      }
    }
  }

  const onLoadEnd = () => {
    setLoading(false)
    // Inject script to get height after a delay to ensure KaTeX is rendered
    setTimeout(() => {
      // This will trigger the height calculation
    }, 200)
  }

  const onError = () => {
    setLoading(false)
    setWebViewHeight(50) // Minimum height on error
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
      <WebView
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={[
          styles.webView,
          {
            height: webViewHeight,
            opacity: loading ? 0 : 1,
          },
        ]}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={onMessage}
        onLoadEnd={onLoadEnd}
        onError={onError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Prevent zooming
        scalesPageToFit={false}
        // Additional props for better performance
        cacheEnabled={true}
        // Ensure WebView respects container bounds
        bounces={false}
        overScrollMode="never"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 50,
    overflow: "hidden", // Prevent any overflow from the container
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
    width: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1,
  },
})

export default MathRichText
