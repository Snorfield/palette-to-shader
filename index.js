const fetchButton = document.getElementById('fetch');
const paletteNameInput = document.getElementById('palette-name');
const colorsInput = document.getElementById('color-input');
const codeInput = document.getElementById('code-output');
const generateButton = document.getElementById('generate');
const outlineMode = document.getElementById('dropdown');
const customOutline = document.getElementById('custom-outline');

let credits = null;

// Original conversion function from https://stackoverflow.com/a/11508164

function hexToRgbNormalized(hex) {
    hex = hex.replace(/^#/, "");
    const bigint = parseInt(hex, 16);
    return [
        ((bigint >> 16) & 255) / 255,
        ((bigint >> 8) & 255) / 255,
        (bigint & 255) / 255
    ];
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, "");
    const bigint = parseInt(hex, 16);
    return [
        ((bigint >> 16) & 255),
        ((bigint >> 8) & 255),
        (bigint & 255)
    ];
}

async function getPalette(identifier) {
    if (identifier.length <= 0) {
        return {status: null, error: 'Palette name is too short (zero characters).'};
    }
    const normalizedName = identifier.replaceAll(' ', '-').toLowerCase();

    try {
        const response = await fetch(`https://lospec.com/palette-list/${normalizedName}.json`);

        if (!response.ok) {
            return {status: null, error: 'Fetch failed, check that you typed your palette name correctly.'};
        }

        const palette = await response.json();

        return palette;
    } catch (error) {
        return {status: null, error: 'Fetch failed, check that you typed your palette name correctly.'};
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

    if (credits ) {
        const normalizedName = credits.name.replaceAll(' ', '-').toLowerCase();

        // Credit comments at the top of the script.
        code += `// ${credits.name}\n`;
        code += `// Palette by ${credits.author}\n`;
        code += `// https://lospec.com/palette-list/${normalizedName}\n`;
        code += '\n';
    }
    
    const colors = parseColors();

    code += `const colorNumber = ${colors.length};\n`;

    code += `vec3 colors[colorNumber] = vec3[](\n`;

    code += colors.map(color => `   ${vector3(color)}`).join(',\n') + '\n';

    code += ');\n';

    if ((customOutline.value).length > 0) {
        const outline = hexToRgbNormalized(customOutline.value);
        code += `vec3 outlineColor = ${vector3(outline)};`
    } else {
        if (outlineMode.value == 'dark') {
            const outline = colors[lowestColorDistance('#000000')];
            code += `vec3 outlineColor = ${vector3(outline)};`;
        } else {
            const outline = colors[lowestColorDistance('#ffffff')];
            code += `vec3 outlineColor = ${vector3(outline)};`;
        }
    }

    codeInput.value = code;
}


fetchButton.addEventListener('click', handleFetch);
generateButton.addEventListener('click', generateCode);

