import fs from 'fs';
import path from 'path';
import typedocConfig from '../typedoc.json' assert {type: 'json'};
import packageJson from '../package.json' assert {type: 'json'};

type HtmlDoc = {
    title: string;
    description: string;
    mdFileName: string;
}

function generateAPIIntroMarkdown(lines: string[]): string {
    let intro = `# Intro

This file is intended as a reference for the important and public classes of this API.
We recommend looking at the [examples](../examples/index.md) as they will help you the most to start with MapLibre.

Most of the classes wirtten here have an "Options" object for initialization, it is recommended to check which options exist.

It is recommended to import what you need and the use it. Some examples for classes assume you did that.
For example, import the \`Map\` class like this:
\`\`\`ts
import {Map} from 'maplibre-gl';
const map = new Map(...)
\`\`\`

Import declarations are omitted from the examples for brevity.

`;
    intro += lines.map(l => l.replace('../', './')).join('\n');
    return intro;
}

function generateMarkdownForExample(title: string, description: string, file: string, htmlContent: string): string {
    return `
# ${title}

${description}

<iframe src="../${file}" width="100%" style="border:none; height:400px"></iframe>

\`\`\`html
${htmlContent}
\`\`\`
`;
}

function generateMarkdownIndexFileOfAllExamples(indexArray: HtmlDoc[]): string {
    let indexMarkdown = '# Overview \n\n';
    for (const indexArrayItem of indexArray) {
        indexMarkdown += `
## [${indexArrayItem.title}](./${indexArrayItem.mdFileName})

![${indexArrayItem.description}](../assets/examples/${indexArrayItem.mdFileName!.replace('.md', '.png')})

${indexArrayItem.description}
`;
    }
    return indexMarkdown;
}

/**
 * Builds the README.md file by parsing the modules.md file generated by typedoc.
 */
function generateReadme() {
    const modulesFile = path.join(typedocConfig.out, 'modules.md');
    const content = fs.readFileSync(modulesFile, 'utf-8');
    let lines = content.split('\n');
    const classesLineIndex = lines.indexOf(lines.find(l => l.endsWith('Classes')) as string);
    lines = lines.splice(2, classesLineIndex - 2);
    const contentString = generateAPIIntroMarkdown(lines);
    fs.writeFileSync(path.join(typedocConfig.out, 'README.md'), contentString);
    fs.rmSync(modulesFile);
}

/**
 * This takes the examples folder with all the html files and generates a markdown file for each of them.
 * It also create an index file with all the examples and their images.
 */
function generateExamplesFolder() {
    const examplesDocsFolder = path.join('docs', 'examples');
    if (fs.existsSync(examplesDocsFolder)) {
        fs.rmSync(examplesDocsFolder, {recursive: true, force: true});
    }
    fs.mkdirSync(examplesDocsFolder);
    const examplesFolder = path.join('test', 'examples');
    const files = fs.readdirSync(examplesFolder).filter(f => f.endsWith('html'));
    const maplibreUnpgk = `https://unpkg.com/maplibre-gl@${packageJson.version}/`;
    const indexArray = [] as HtmlDoc[];
    for (const file of files) {
        const htmlFile = path.join(examplesFolder, file);
        let htmlContent = fs.readFileSync(htmlFile, 'utf-8');
        htmlContent = htmlContent.replace(/\.\.\/\.\.\//g, maplibreUnpgk);
        htmlContent = htmlContent.replace(/-dev.js/g, '.js');
        const htmlContentLines = htmlContent.split('\n');
        const title = htmlContentLines.find(l => l.includes('<title'))?.replace('<title>', '').replace('</title>', '').trim()!;
        const description = htmlContentLines.find(l => l.includes('og:description'))?.replace(/.*content=\"(.*)\".*/, '$1')!;
        fs.writeFileSync(path.join(examplesDocsFolder, file), htmlContent);
        const mdFileName = file.replace('.html', '.md');
        indexArray.push({
            title,
            description,
            mdFileName
        });
        const exampleMarkdown = generateMarkdownForExample(title, description, file, htmlContent);
        fs.writeFileSync(path.join(examplesDocsFolder, mdFileName), exampleMarkdown);
    }

    const indexMarkdown = generateMarkdownIndexFileOfAllExamples(indexArray);
    fs.writeFileSync(path.join(examplesDocsFolder, 'index.md'), indexMarkdown);
}

// !!Main flow start here!!
if (!fs.existsSync(typedocConfig.out)) {
    throw new Error('Please run typedoc generation first!');
}
fs.rmSync(path.join(typedocConfig.out, 'README.md'));
generateReadme();
generateExamplesFolder();
console.log('Docs generation completed, to see it in action run\n npm run start-docs');
