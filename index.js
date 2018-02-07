#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const util = require('util');

const hostname = '127.0.0.1';
const port = 3000;

const processCWD = process.cwd();

const getFiles = (path) => {
  return fs.readdirSync(path);
}

const getLANPath = (path) => {
  return path.replace(processCWD, '');
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
      <style>
        html, body {
          color: gray;
        }
      </style>
    </head>
    <body>
      <ul>${filesLi}</ul>
      <br />
      <form method="post" action="" enctype='multipart/form-data'>
        <label for="upload">上传文件</label>
        <input id="upload" type="file" name="file" required/>
        <input type="submit" value="提交" />
      </form>
    </body>
    </html>`;
  return filesHTML;
}

const handleGetFileAndDir = (req, res) => {
  const { url } = req;
  const absolutePath = path.resolve(`.${url}`);

  if (!fs.existsSync(absolutePath)) {
    res.statusCode = 404;
    res.end('file or directory isn\'t exist');
    return;
  }

  // directory
  const fileStats = fs.statSync(absolutePath);  
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
}

const handleUploadFile = (req, res) => {
  const { url } = req;
  const targetDir = path.resolve(processCWD, `.${url}`);

  const form = new formidable.IncomingForm();
  form.encoding = 'utf-8';
  form.uploadDir = targetDir;
  form.keepExtensions = true;

  // form.on('progress', function(bytesReceived, bytesExpected) {
  //   console.log(`uploading... ${bytesReceived / bytesExpected * 100}%`);
  // });

  form.parse(req, function(err, fields, files) {
    res.writeHead(301, {
      Location: url
    });
    res.end();

    const now = Date.now();
    const pathObj = path.parse(files.file.name);
    const filename = `${pathObj.name}_${now}${pathObj.ext}`;

    fs.rename(files.file.path, `${path.resolve(targetDir, filename)}`, function (err) {
      if (err) {
        console.log(err);
      }
    })
  })
}

const server = http.createServer((req, res) => {
  const { url } = req;
  if (url === '/favicon.ico') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const method = req.method;
  
  if (method === 'GET') {
    handleGetFileAndDir(req, res);
  }

  if (method === 'POST') {
    handleUploadFile(req, res);
  }
})

server.listen(port, hostname, () => {
  console.log(`server running at ${port}`);
})