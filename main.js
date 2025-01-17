import hljs from 'highlight.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import clipboardy from 'clipboardy';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createCodeImage(codeSnippet, language, outputFile) {
  if (!language) {
    language = hljs.highlightAuto(codeSnippet).language;
  }

  const highlightedCode = hljs.highlight(codeSnippet, { language }).value;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #1e1e1e;
            color: #d4d4d4;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .code-container {
            background: #2b2b2b;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            max-width: 80vw;
            overflow: auto;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            opacity: 0;
            animation: fadeIn 1s forwards;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            transition: transform 0.2s ease-in-out; /* Added transition */
        }
        .code-container:hover {
            transform: scale(1.02); /* Scale effect on hover */
        }
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        .code-info {
            color: #569cd6;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
            margin-top: 0;
        }
        .copy-icon {
            position: absolute;
            top: 10px;
            right: 10px;
            color: #d4d4d4;
            cursor: pointer;
        }
        pre {
            margin: 0;
        }
        code.hljs {
            display: block;
            padding: 1em;
            background: #2b2b2b;
            border-radius: 5px;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 16px;
            line-height: 1.5;
            overflow-x: auto;
        }
        .hljs-keyword {
            color: #569cd6;
            font-weight: bold;
        }
        .hljs-string {
            color: #ce9178;
        }
        .hljs-number {
            color: #b5cea8;
        }
        .hljs-comment {
            color: #608b4e;
            font-style: italic;
        }
        .hljs-function .hljs-title {
            color: #dcdcaa;
        }
        .options-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #569cd6;
            color: #ffffff;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            z-index: 1000;
        }
        .options-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #2b2b2b;
            color: #d4d4d4;
            border: none;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            z-index: 1000;
            cursor: move;
            display: none;
        }
        .options-popup.show {
            display: block;
        }
        .options-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .options-header h2 {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .close-button {
            cursor: pointer;
            color: #ffffff;
            background-color: #ff5c5c;
            border: none;
            padding: 8px;
            border-radius: 50%;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        .close-button:hover {
            background-color: #e84141;
        }
        .options-content {
            margin-top: 10px;
        }
        .gradient-option {
            background: linear-gradient(to right, #f093fb, #f5576c);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 5px;
            cursor: pointer;
        }
        .reset-button {
            background-color: #ff5c5c;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
            margin-top: 10px;
        }
        .reset-button:hover {
            background-color: #e84141;
        }
        .copy-icon:hover {
            color: #ffffff;
        }
    </style>
    <script>
        document.addEventListener('contextmenu', event => event.preventDefault());
        document.onkeydown = function(e) {
            if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && e.keyCode === 73)) {
                return false;
            }
        };
    </script>
</head>
<body>
    <div class="code-container">
        <div class="code-info">${language}</div>
        <i class="fas fa-copy copy-icon" onclick="copyCode()"></i>
        <pre><code class="hljs">${highlightedCode}</code></pre>
    </div>
    <button class="options-button" onclick="toggleOptions()">Options <i class="fas fa-cog"></i></button>
    <div class="options-popup" id="optionsPopup" onmousedown="startDragging(event)">
        <div class="options-header">
            <h2>Options</h2>
            <button class="close-button" onclick="toggleOptions()">X</button>
        </div>
        <div class="options-content">
            <div class="gradient-option" onclick="changeGradient('to right', '#f093fb', '#f5576c')">Pink Gradient</div>
            <div class="gradient-option" onclick="changeGradient('to right', '#ff9966', '#ff5e62')">Orange Gradient</div>
            <div class="gradient-option" onclick="changeGradient('to right', '#4facfe', '#00f2fe')">Blue Gradient</div>
            <button class="reset-button" onclick="resetColors()">Reset</button>
        </div>
    </div>
    <script>
        let offsetX, offsetY;

        function startDragging(e) {
            offsetX = e.clientX;
            offsetY = e.clientY;

            document.addEventListener('mousemove', dragElement);
            document.addEventListener('mouseup', stopDragging);
        }

        function dragElement(e) {
            const popup = document.getElementById('optionsPopup');
            const newX = popup.offsetLeft - (offsetX - e.clientX);
            const newY = popup.offsetTop - (offsetY - e.clientY);

            popup.style.left = newX + 'px';
            popup.style.top = newY + 'px';

            offsetX = e.clientX;
            offsetY = e.clientY;
        }

        function stopDragging() {
            document.removeEventListener('mousemove', dragElement);
            document.removeEventListener('mouseup', stopDragging);
        }

        function toggleOptions() {
            const popup = document.getElementById('optionsPopup');
            popup.classList.toggle('show');
        }

        function changeGradient(direction, color1, color2) {
            document.body.style.background = 'linear-gradient(' + direction + ', ' + color1 + ', ' + color2 + ')';
        }

        function copyCode() {
            const code = document.querySelector('code.hljs').textContent;
            navigator.clipboard.writeText(code).then(() => {
                console.log('Code copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy code: ', err);
            });
        }

        function resetColors() {
            window.location.reload();
        }
    </script>
</body>
</html>
  `;

  const tempFilePath = path.join(__dirname, 'temp.html');
  fs.writeFileSync(tempFilePath, htmlContent);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${tempFilePath}`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: outputFile, fullPage: true });
  await browser.close();

  fs.unlinkSync(tempFilePath);

  clipboardy.writeSync(htmlContent);
  console.log('Successfully created the HTML Code.');
}

const javaCode = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("This is a video of how it works");
    }
}
`;
createCodeImage(javaCode, 'java', 'code_snippet.png').then(() => {
  console.log('The code has been copied to your clipboard.');
});