const fs = require('fs');
const filePath = 'backend/src/templates/aqua.hbs';
let content = fs.readFileSync(filePath, 'utf-8');

// remove main event logo
content = content.replace(/\s*\{\{#if report\.frontPage\.logos\.length\}\}\s*<div class="main-event-logo"[\s\S]*?<\/div>\s*\{\{\/if\}\}/, '');

// revert logos loop
content = content.replace(
  /\{\{#each report\.frontPage\.logos\}\}[\s\S]*?\{\{#unless @last\}\}[\s\S]*?<img src="\{\{this\}\}" alt="Logo">[\s\S]*?\{\{\/unless\}\}[\s\S]*?\{\{\/each\}\}/,
  '{{#each report.frontPage.logos}}\n        <img src="{{this}}" alt="Logo">\n      {{/each}}'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Restored aqua.hbs');
