const fs = require('fs');
const { main: pbjs } = require('@constructive-io/protobufjs-cli/pbjs');

async function generate() {
    const branchName = process.argv[2];
    if (!branchName) throw new Error('branchName not provided');

    const response = await fetch(`https://raw.githubusercontent.com/pganalyze/libpg_query/${branchName}/protobuf/pg_query.proto`);
    if (!response.ok) throw new Error(`Failed to download pg_query.proto: HTTP ${response.status}`);

    const inFile = 'libpg_query/protobuf/pg_query.proto';
    fs.writeFileSync(inFile, await response.text());
    pbjs([
        '--keep-case', '-t', 'static-module', '--dependency',
        '@constructive-io/protobufjs/minimal', inFile
    ], (error, output) => {
        if (error) {
            console.error(error.message);
            process.exitCode = 1;
        } else {
            // PostgreSQL's String and Boolean message constructors shadow the built-in casts.
            fs.writeFileSync('proto.js', output.replace(/(\bmessage\.\w+ = )(String|Boolean)\((object\.)/g, '$1globalThis.$2($3'));
            console.log('Generated proto.js from proto file.');
        }
    });
}

generate().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
