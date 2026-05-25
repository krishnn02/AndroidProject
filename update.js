const fs = require('fs');
const path = require('path');
const templatesDir = 'backend/src/templates';
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.hbs'));

for (const file of files) {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  content = content.replace(
    /\{\{#each report\.frontPage\.logos\}\}\s*<img src="\{\{this\}\}" alt="Logo">\s*\{\{\/each\}\}/g,
    `{{#each report.frontPage.logos}}
        {{#unless @last}}
          <img src="{{this}}" alt="Logo">
        {{/unless}}
      {{/each}}`
  );

  const logoHtml = `
      {{#if report.frontPage.logos.length}}
      <div class="main-event-logo" style="text-align: center; margin-bottom: 30px;">
        <img src="{{lastLogo report.frontPage.logos}}" alt="Main Logo" style="max-width: 250px; max-height: 180px; object-fit: contain;">
      </div>
      {{/if}}
      
      <div class="event-title">`;
  
  content = content.replace(/\s*<div class="event-title">/g, logoHtml);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated ' + file);
}
