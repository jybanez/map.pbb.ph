import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const allChecks=['drawing','selected','layout','launcher-close','save-close','storage','context','object-context','line-path','objects','immediate-guards','shape-boundaries','segment-boundaries','vertex-readiness','shapes'].map(name=>`scripts/verify-personal-ui-${name}.js`).concat('scripts/verify-bundle-only.js');
const requested=process.argv.slice(2),checks=requested.length?requested.map(name=>name==='bundle-only'?'scripts/verify-bundle-only.js':`scripts/verify-personal-ui-${name}.js`):allChecks;
if(checks.some(path=>!allChecks.includes(path)))throw Error('Unknown task220 browser scope');
let source='async page=>{const results={},browser=page.context().browser(),original=browser.newContext.bind(browser);browser.newContext=async options=>{const context=await original(options);context.setDefaultTimeout(30000);return context;};for(const c of browser.contexts())if(c!==page.context())await c.close();\n';
for(const path of checks)source+=`try{results[${JSON.stringify(path)}]={status:'passed',checks:await (${readFileSync(path,'utf8')})(page)};}catch(error){results[${JSON.stringify(path)}]={status:'failed',error:error.message};}finally{for(const c of page.context().browser().contexts())if(c!==page.context())await c.close();}\n`;
source+='browser.newContext=original;return results;\n}';mkdirSync('output/playwright',{recursive:true});writeFileSync('output/playwright/task220-browser-checks.js',source);
console.log('Generated task220 browser checks; run in a uniquely named owned Playwright CLI session.');
