// Original conversion function from https://stackoverflow.com/a/11508164

function hexToRgbNormalized(hex) {
    hex = hex.replace(/^#/, "");
    var bigint = parseInt(hex, 16);
    return [
        ((bigint >> 16) & 255) / 255,
        ((bigint >> 8) & 255) / 255,
        (bigint & 255) / 255
    ];
}

let button = document.getElementById('convert');
let input = document.getElementById('input');
let outputDiv = document.getElementById('output');

button.addEventListener("click", function() {
    let colors = input.value.split('\n');
    let output = `const int colorNum = ${colors.length};\nvec3 colors[colorNum] = vec3[](\n`;
    let index = 0;
    for (color of colors) {
        index++;
        let converted = hexToRgbNormalized(color);
        output += ` vec3(${converted[0]}, ${converted[1]}, ${converted[2]})${index === (colors.length) ? '' : ','}\n`
    }
    output += ');';
    outputDiv.value = output;
});
