function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}
canvas.height = canvas.width * 1.3
context.fillStyle = "#" + Math.floor(Math.random() * 16777215).toString(16);
context.fillRect(0, 0, canvas.width, canvas.height)
context.font = '16pt Calibri';
context.textAlign = "left"
context.fillStyle = '#333';

wrapText(context, text, x, y, maxWidth, lineHeight);