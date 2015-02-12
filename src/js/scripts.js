var imageCnt = 0;
function changeImage() {
    imageCnt = (imageCnt + 1) % 3;
    options.image = 'images/testImage.jpg';
    refresh();
}

var timer = null;
var t = 0, rx = 0, ry = 0, rz = 0, oldpoints;
function runDemo() {
    oldpoints = [].concat(points);
    $('div.handle').hide();
    timer = setTimeout(demoTick, 20);
    $('#demo-button').html('Stop demo');
}
function demoTick() {
    t += 0.01;
    rx += (Math.sin(t) + Math.sin(t * .332) + 1) * .1;
    ry += (Math.cos(t *.841) + Math.sin(t * .632) + .8) * .031;
    rz += (Math.cos(3 + t *.767) + Math.sin(-t * 1.132) - .8) * .011;

    var cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);

    var pts = [[1, 0, 0], [0, 1, 0], [0, -1, 0], [-1, 0, 0]];
    for (i in pts) {
        var x1 = pts[i][0], y1 = pts[i][1], z1 = pts[i][2];
        var x2 = x1 * cy - z1 * sy,
            y2 = y1,
            z2 = x1 * sy + z1 * cy;

        var x3 = x2,
            y3 = y2 * cx - z2 * sx,
            z3 = y2 * sx + z2 * cx;

        var x4 = y3 * sz + x3 * cz,
            y4 = y3 * cz - x3 * sz,
            z4 = z3;

        points[i] = [x4 / (z4 + 2) * 300 + 300, y4 / (z4 + 2) * 300 + 300];
    }

    update();

    if (timer) {
        timer = setTimeout(demoTick, 20);
    }
    else {
        points = oldpoints;
        update();
    }
}
function stopDemo() {
    $('#demo-button').html('Run demo');
    $('div.handle').show();
    timer = null;
}