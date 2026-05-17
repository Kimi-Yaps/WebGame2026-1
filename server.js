const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// Add specific headers required by Godot web exports
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
});

// Serve static files from the current directory
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        // Ensure proper MIME type for WebAssembly
        if (filePath.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
        }
    }
}));

// Fallback to index.html for any other requests (useful if you have client-side routing, though Godot usually doesn't need it)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
