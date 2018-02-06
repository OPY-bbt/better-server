#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;

const getFiles = (path) => {
  return fs.readdirSync(path);
}

const getLANPath = (path) => {
  return path.replace(__dirname, '');
}

const generateLI = (text, path) => {
  const state = fs.statSync(path)
  const isDir = state.isDirectory();
  return `<li><a href="${getLANPath(path)}" style="color: ${isDir ? 'purple' : 'gray'}">${text}</a></li>`;
}

const generateHTML = (absolutePath) => {
  const files = getFiles(absolutePath).map((p) => path.resolve(absolutePath, p));
  const filesLi = files.reduce((sum, next) => {
    const basename = path.basename(next);
    return sum += generateLI(basename, next);
  }, '')
  const filesHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>掩耳</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    </head>
    <body>
      <ul>${filesLi}</ul>
    </body>
    </html>`;
  return filesHTML;
}

const server = http.createServer((req, res) => {
  const { url } = req;
  if (url === '/favicon.ico') {
    res.statusCode = 204;
    res.end();
    return;
  }
  const absolutePath = path.resolve(`.${url}`);

  if (!fs.existsSync(absolutePath)) {
    res.statusCode = 404;
    res.end();
    return;
  }

  const fileStats = fs.statSync(absolutePath);

  // directory
  if (fileStats.isDirectory()) {
    res.statusCode = 200;
    res.end(generateHTML(absolutePath));
    return;
  }

  // file
  const basename = path.basename(absolutePath);
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename=${encodeURIComponent(basename)}; filename*=utf-8 ${encodeURIComponent(basename)}`
  });
  fs
    .createReadStream(absolutePath)
    .on('end', function() {
      res.end();
    })
    .pipe(res);
})

server.listen(port, hostname, () => {
  console.log(`server running at ${port}`);
})