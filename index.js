const fetchButton = document.getElementById('fetch');
const paletteNameInput = document.getElementById('palette-name');
const colorsInput = document.getElementById('color-input');
const codeInput = document.getElementById('code-output');
const generateButton = document.getElementById('generate');
const customOutline = document.getElementById('custom-outline');
const canvas = document.getElementById('canvas');

const context = canvas.getContext('2d');

const width = canvas.width;
const height = canvas.height;

const tileSize = 10;

// Intial fill
context.fillStyle = '#2b333bff';
context.fillRect(0, 0, width, height);
context.textAlign = 'center';
context.textBaseline = 'middle';
context.font = "15px monospace";
context.fillStyle = "#ffffffff"
context.fillText("Palette Preview", width / 2, height / 2);

function draw() {
    const colors = colorsInput.value;
    const array = colors.split('\n');
    const length = array.length;

    columns = Math.ceil(Math.sqrt(length));
    rows = columns;

    const tileWidth = width / rows;
    const tileHeight = height / columns;

    context.fillStyle = '#0d2b45';
    context.fillRect(0, 0, width, height);

    let index = 0;
    for (let x = 0; x < rows; x++) {
        for (let y = 0; y < columns; y++) {
            context.fillStyle = '#2b333bff';
            if (index <= length - 1) {
                context.fillStyle = array[index];
                // We add one to prevent precision issue outlines
                context.fillRect(x * tileWidth, y * tileHeight, tileWidth + 1, tileHeight + 1);
            }
            index++;
        }
    }
}

// Global storage for palette credit.
let credits = null;

// Original conversion function from https://stackoverflow.com/a/11508164

function hexToRgbNormalized(hex) {
    hex = hex.replace(/^#/, "");

    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }
    
    const bigint = parseInt(hex, 16);
    return [
        ((bigint >> 16) & 255) / 255,
        ((bigint >> 8) & 255) / 255,
        (bigint & 255) / 255
    ];
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, "");

    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }
    
    const bigint = parseInt(hex, 16);
    return [
        ((bigint >> 16) & 255),
        ((bigint >> 8) & 255),
        (bigint & 255)
    ];
}

async function getPalette(identifier) {
    if (identifier.length <= 0) {
        return { status: null, error: 'Palette name is too short (zero characters).' };
    }
    const normalizedName = identifier.replaceAll(' ', '-').toLowerCase();

    try {
        const response = await fetch(`https://lospec.com/palette-list/${normalizedName}.json`);

        if (!response.ok) {
            return { status: null, error: 'Fetch failed, check that you typed your palette name correctly.' };
        }

        const palette = await response.json();

        return palette;
    } catch (error) {
        return { status: null, error: 'Fetch failed, check that you typed your palette name correctly.' };
    }
}

async function handleFetch() {
    const palette = await getPalette(paletteNameInput.value);

    if (!palette.error) {
        // Global information about the palette
        credits = { author: palette.author, name: palette.name, colors: palette.colors };

        const colors = palette.colors;

        const formatted = colors.map(color => `#${color}`).join('\n');

        colorsInput.value = formatted;
        // Redraw the canvas since actually setting the value via a program doesn't fire the input event.
        draw();
    } else {
        colorsInput.value = `Error: ${palette.error}`;
    }
}

function parseColors() {
    const colors = colorsInput.value;

    const array = colors.split('\n');

    return array.map(color => hexToRgbNormalized(color));
}

function lowestColorDistance(target) {
    const colors = colorsInput.value;

    const array = colors.split('\n');

    const convertedColors = array.map(color => hexToRgb(color));

    target = hexToRgb(target);

    let minimumDistance = Infinity;
    let minimumIndex = 0;

    let index = 0;
    for (const color of convertedColors) {
        const distance0 = target[0] - color[0];
        const distance1 = target[1] - color[1];
        const distance2 = target[2] - color[2];
        const distance = Math.sqrt(
            distance0 * distance0 +
            distance1 * distance1 +
            distance2 * distance2
        );
        if (distance < minimumDistance) {
            minimumDistance = distance;
            minimumIndex = index;
        }
        index++;
    }

    return minimumIndex;
}

function vector3(color) {
    return `vec3(${color[0].toFixed(7)}, ${color[1].toFixed(7)}, ${color[2].toFixed(7)})`;
}

function generateCode() {
    let code = '';

    if (credits) {
        const normalizedName = credits.name.replaceAll(' ', '-').toLowerCase();

        // Credit comments at the top of the script.
        code += `// ${credits.name}\n`;
        code += `// Palette by ${credits.author}\n`;
        code += `// https://lospec.com/palette-list/${normalizedName}\n`;
        code += '\n';
    }

    const colors = parseColors();

    code += `const int colorNum = ${colors.length};\n`;

    code += `vec3 colors[colorNum] = vec3[](\n`;

    code += colors.map(color => `   ${vector3(color)}`).join(',\n') + '\n';

    code += ');\n';

    if ((customOutline.value).length > 0) {
        const outline = hexToRgbNormalized(customOutline.value);
        code += `const vec3 darkColor = ${vector3(outline)};`
        code += '\n';
        code += `const vec3 lightColor = ${vector3(outline)};`
    } else {
        const darkOutline = colors[lowestColorDistance('#000000')];
        code += `const vec3 darkColor = ${vector3(darkOutline)};`;
        code += '\n';
        const lightOutline = colors[lowestColorDistance('#ffffff')];
        code += `const vec3 lightColor = ${vector3(lightOutline)};`;
    }

    codeInput.value = code;
}

fetchButton.addEventListener('click', handleFetch);
generateButton.addEventListener('click', generateCode);
colorsInput.addEventListener('input', draw);



