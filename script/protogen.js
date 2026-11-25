const fs = require('fs');
const https = require('https');
const { main: pbjs } = require('@constructive-io/protobufjs-cli/pbjs');

function download(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                response.resume();
                reject(new Error(`Failed to download pg_query.proto: HTTP ${response.statusCode}`));
                return;
            }
            response.setEncoding('utf8');
            let body = '';
            response.on('data', (chunk) => { body += chunk; });
            response.on('end', () => resolve(body));
            response.on('error', reject);
        }).on('error', reject);
    });
}

async function generate() {
    const branchName = process.argv[2];
    if (!branchName) throw new Error('branchName not provided');

    const inFile = 'libpg_query/protobuf/pg_query.proto';
    fs.writeFileSync(inFile, await download(`https://raw.githubusercontent.com/pganalyze/libpg_query/${branchName}/protobuf/pg_query.proto`));
    pbjs([
        '--keep-case', '-t', 'static-module', '--dependency',
        '@constructive-io/protobufjs/minimal', inFile
    ], (error, output) => {
        if (error) {
            console.error(error.message);
            process.exitCode = 1;
        } else {
            // PostgreSQL's String and Boolean message constructors shadow the built-in casts.
            fs.writeFileSync('proto.js', output
                .replace(/^([ \t]*)var \$root = /m, '$1var $pgRecursionLimit = 512;\n$1var $root = ')
                .replace(/\$(?:Reader|util)\.recursionLimit\b/g, '$pgRecursionLimit')
                .replace(/(\bmessage\.\w+ = )(String|Boolean)\((object\.)/g, '$1globalThis.$2($3'));
            console.log('Generated proto.js from proto file.');
        }
    });
}

generate().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
