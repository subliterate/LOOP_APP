const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'cli-dist');

const packageJson = {
  bin: 'cli.js',
  type: 'commonjs',
  pkg: {
    scripts: ['cli.js', 'services/geminiService.node.js', 'services/geminiServiceCore.js']
  },
};

fs.writeFileSync(
  path.join(outputDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);
