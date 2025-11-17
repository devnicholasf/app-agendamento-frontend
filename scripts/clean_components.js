const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const componentsDir = path.join(repoRoot, 'src', 'components');

const stubs = {
  'Login.js': '// compatibility stub: re-export the page implementation\nexport { default } from "../pages/Login";\n',
  'Register.js': '// compatibility stub: re-export the page implementation\nexport { default } from "../pages/Register";\n',
  'ForgotPassword.js': '// compatibility stub: re-export the page implementation\nexport { default } from "../pages/ForgotPassword";\n',
  'Home.js': '// compatibility stub: re-export the page implementation\nexport { default } from "../pages/Home";\n',
};

for (const [file, content] of Object.entries(stubs)) {
  const filePath = path.join(componentsDir, file);
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Wrote', filePath);
  } catch (err) {
    console.error('Failed to write', filePath, err.message);
  }
}

console.log('Done.');
