const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.wasm': 'application/wasm',
    '.pck': 'application/octet-stream',
    '.png': 'image/png'
};

const server = http.createServer((req, res) => {
    // ---- DEBUG ENDPOINT ----
    // This will let us see exactly what files made it into the Google Cloud container!
    if (req.url === '/debug') {
        try {
            const files = fs.readdirSync(__dirname);
            const stats = files.map(f => {
                const st = fs.statSync(path.join(__dirname, f));
                return `${f}: ${st.size} bytes`;
            });
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            return res.end("Container Directory Contents:\n" + stats.join('\n'));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            return res.end("Debug Error: " + e.message);
        }
    }

    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);
    
    // Security check
    if (filePath.indexOf(__dirname) !== 0) {
        res.writeHead(403);
        return res.end();
    }

    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error(`404 Not Found: ${filePath}`);
            res.writeHead(404);
            return res.end('File not found');
        }

        const headers = {
            'Content-Type': mimeTypes[ext] || 'application/octet-stream',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Accept-Ranges': 'bytes'
        };

        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            
            if (start >= stats.size) {
                headers['Content-Range'] = `bytes */${stats.size}`;
                res.writeHead(416, headers);
                return res.end();
            }

            const chunksize = (end - start) + 1;
            headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`;
            headers['Content-Length'] = chunksize;
            
            res.writeHead(206, headers);
            const stream = fs.createReadStream(filePath, { start, end });
            stream.on('error', (streamErr) => {
                console.error(`Stream error on ${filePath}:`, streamErr);
                if (!res.headersSent) res.writeHead(500);
                res.end();
            });
            stream.pipe(res);
        } else {
            headers['Content-Length'] = stats.size;
            res.writeHead(200, headers);
            const stream = fs.createReadStream(filePath);
            stream.on('error', (streamErr) => {
                console.error(`Stream error on ${filePath}:`, streamErr);
                if (!res.headersSent) res.writeHead(500);
                res.end();
            });
            stream.pipe(res);
        }
    });
});

server.listen(port, () => {
    console.log(`Debug Server listening on port ${port}`);
});
