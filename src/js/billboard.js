var billboard = function (options) {
    var $element = $(options.target);
    var $wrapper = $(document.createElement('div'));
    var $background = $(document.createElement('div'));
    var $bgImage = $(document.createElement('img')).attr('src', options.billboardImage);

    $element.append($wrapper);
    $wrapper.append($background);
    $background.append($bgImage);

    $bgImage.css({
        position: 'relative',
        'z-index': 100
    });

    $wrapper.css({
        position: 'relative'
    });

    options.wrapper = $wrapper;
    createBillboard(options);
};

/**
 * Projective texturing using Canvas.
 *
 * (c) Steven Wittens 2008
 * http://www.acko.net/
 */

createBillboard = function (userOptions) {
    var points = userOptions.coordinates;

    var options = {
        image: userOptions.dynamicImage,
        wrapper: userOptions.wrapper,
        subdivisionLimit: 8,
        patchSize: 10
    };

    var refresh, update;
    var canvas = null, ctx = null, transform = null;
    var image = null, iw = 0, ih = 0;

    /**
     * Generic matrix class. Built for readability, not for speed.
     *
     * (c) Steven Wittens 2008
     * http://www.acko.net/
     */
    var Matrix = function (w, h, values) {
        this.w = w;
        this.h = h;
        this.values = values || Matrix.allocate(h);
    };

    Matrix.allocate = function (w, h) {
        var values = [];
        for (var i = 0; i < h; ++i) {
            values[i] = [];
            for (var j = 0; j < w; ++j) {
                values[i][j] = 0;
            }
        }
        return values;
    }

    Matrix.cloneValues = function (values) {
        clone = [];
        for (var i = 0; i < values.length; ++i) {
            clone[i] = [].concat(values[i]);
        }
        return clone;
    }

    Matrix.prototype.transformProjectiveVector = function (operand) {
        var out = [];
        for (var y = 0; y < this.h; ++y) {
            out[y] = 0;
            for (var x = 0; x < this.w; ++x) {
                out[y] += this.values[y][x] * operand[x];
            }
        }
        var iz = 1 / (out[out.length - 1]);
        for (var y = 0; y < this.h; ++y) {
            out[y] *= iz;
        }
        return out;
    }

    Matrix.prototype.rowEchelon = function () {
        if (this.w <= this.h) {
            throw "Matrix rowEchelon size mismatch";
        }

        var temp = Matrix.cloneValues(this.values);

        // Do Gauss-Jordan algorithm.
        for (var yp = 0; yp < this.h; ++yp) {
            // Look up pivot value.
            var pivot = temp[yp][yp];
            while (pivot == 0) {
                // If pivot is zero, find non-zero pivot below.
                for (var ys = yp + 1; ys < this.h; ++ys) {
                    if (temp[ys][yp] != 0) {
                        // Swap rows.
                        var tmpRow = temp[ys];
                        temp[ys] = temp[yp];
                        temp[yp] = tmpRow;
                        break;
                    }
                }
                if (ys == this.h) {
                    // No suitable pivot found. Abort.
                    return new Matrix(this.w, this.h, temp);
                }
                else {
                    pivot = temp[yp][yp];
                }
            };
            // Normalize this row.
            var scale = 1 / pivot;
            for (var x = yp; x < this.w; ++x) {
                temp[yp][x] *= scale;
            }
            // Subtract this row from all other rows (scaled).
            for (var y = 0; y < this.h; ++y) {
                if (y == yp) continue;
                var factor = temp[y][yp];
                temp[y][yp] = 0;
                for (var x = yp + 1; x < this.w; ++x) {
                    temp[y][x] -= factor * temp[yp][x];
                }
            }
        }

        return new Matrix(this.w, this.h, temp);
    }

    /**
     * Refresh image.
     */
    refresh = function () {
        image = new Image();
        image.onload = update;
        image.src = options.image;
    };

    /**
     * Update the display to match a new point configuration.
     */
    update = function () {
        // Get extents.
        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        $.each(points, function () {
            minX = Math.min(minX, Math.floor(this[0]));
            maxX = Math.max(maxX, Math.ceil(this[0]));
            minY = Math.min(minY, Math.floor(this[1]));
            maxY = Math.max(maxY, Math.ceil(this[1]));
        });

        minX--; minY--; maxX++; maxY++;
        var width = maxX - minX;
        var height = maxY - minY;

        // Reshape canvas.
        canvas.style.left = minX +'px';
        canvas.style.top = minY +'px';
        canvas.width = width;
        canvas.height = height;

        // Measure texture.
        iw = image.width;
        ih = image.height;

        // Set up basic drawing context.
        ctx = canvas.getContext("2d");
        ctx.translate(-minX, -minY);
        ctx.clearRect(minX, minY, width, height);
        ctx.strokeStyle = "rgb(220,0,100)";

        transform = getProjectiveTransform(points);

        // Begin subdivision process.
        var ptl = transform.transformProjectiveVector([0, 0, 1]);
        var ptr = transform.transformProjectiveVector([1, 0, 1]);
        var pbl = transform.transformProjectiveVector([0, 1, 1]);
        var pbr = transform.transformProjectiveVector([1, 1, 1]);

        ctx.beginPath();
        ctx.moveTo(ptl[0], ptl[1]);
        ctx.lineTo(ptr[0], ptr[1]);
        ctx.lineTo(pbr[0], pbr[1]);
        ctx.lineTo(pbl[0], pbl[1]);
        ctx.closePath();
        ctx.clip();

        divide(0, 0, 1, 1, ptl, ptr, pbl, pbr, options.subdivisionLimit);
    };

    /**
     * Render a projective patch.
     */
    function divide(u1, v1, u4, v4, p1, p2, p3, p4, limit) {
        // See if we can still divide.
        if (limit) {
            // Measure patch non-affinity.
            var d1 = [p2[0] + p3[0] - 2 * p1[0], p2[1] + p3[1] - 2 * p1[1]];
            var d2 = [p2[0] + p3[0] - 2 * p4[0], p2[1] + p3[1] - 2 * p4[1]];
            var d3 = [d1[0] + d2[0], d1[1] + d2[1]];
            var r = Math.abs((d3[0] * d3[0] + d3[1] * d3[1]) / (d1[0] * d2[0] + d1[1] * d2[1]));

            // Measure patch area.
            d1 = [p2[0] - p1[0] + p4[0] - p3[0], p2[1] - p1[1] + p4[1] - p3[1]];
            d2 = [p3[0] - p1[0] + p4[0] - p2[0], p3[1] - p1[1] + p4[1] - p2[1]];
            var area = Math.abs(d1[0] * d2[1] - d1[1] * d2[0]);

            // Check area > patchSize pixels (note factor 4 due to not averaging d1 and d2)
            // The non-affinity measure is used as a correction factor.
            if ((u1 == 0 && u4 == 1) || ((.25 + r * 5) * area > (options.patchSize * options.patchSize))) {
                // Calculate subdivision points (middle, top, bottom, left, right).
                var umid = (u1 + u4) / 2;
                var vmid = (v1 + v4) / 2;
                var pmid = transform.transformProjectiveVector([umid, vmid, 1]);
                var pt = transform.transformProjectiveVector([umid, v1, 1]);
                var pb = transform.transformProjectiveVector([umid, v4, 1]);
                var pl = transform.transformProjectiveVector([u1, vmid, 1]);
                var pr = transform.transformProjectiveVector([u4, vmid, 1]);

                // Subdivide.
                limit--;
                divide(u1, v1, umid, vmid, p1, pt, pl, pmid, limit);
                divide(umid, v1, u4, vmid, pt, p2, pmid, pr, limit);
                divide(u1, vmid, umid, v4, pl, pmid, p3, pb, limit);
                divide(umid, vmid, u4, v4, pmid, pr, pb, p4, limit);

                return;
            }
        }

        // Render this patch.
        ctx.save();

        // Set clipping path.
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p4[0], p4[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        //ctx.clip();

        // Get patch edge vectors.
        var d12 = [p2[0] - p1[0], p2[1] - p1[1]];
        var d24 = [p4[0] - p2[0], p4[1] - p2[1]];
        var d43 = [p3[0] - p4[0], p3[1] - p4[1]];
        var d31 = [p1[0] - p3[0], p1[1] - p3[1]];

        // Find the corner that encloses the most area
        var a1 = Math.abs(d12[0] * d31[1] - d12[1] * d31[0]);
        var a2 = Math.abs(d24[0] * d12[1] - d24[1] * d12[0]);
        var a4 = Math.abs(d43[0] * d24[1] - d43[1] * d24[0]);
        var a3 = Math.abs(d31[0] * d43[1] - d31[1] * d43[0]);
        var amax = Math.max(Math.max(a1, a2), Math.max(a3, a4));
        var dx = 0, dy = 0, padx = 0, pady = 0;

        // Align the transform along this corner.
        switch (amax) {
            case a1:
                ctx.transform(d12[0], d12[1], -d31[0], -d31[1], p1[0], p1[1]);
                // Calculate 1.05 pixel padding on vector basis.
                if (u4 != 1) padx = 1.05 / Math.sqrt(d12[0] * d12[0] + d12[1] * d12[1]);
                if (v4 != 1) pady = 1.05 / Math.sqrt(d31[0] * d31[0] + d31[1] * d31[1]);
                break;
            case a2:
                ctx.transform(d12[0], d12[1],  d24[0],  d24[1], p2[0], p2[1]);
                // Calculate 1.05 pixel padding on vector basis.
                if (u4 != 1) padx = 1.05 / Math.sqrt(d12[0] * d12[0] + d12[1] * d12[1]);
                if (v4 != 1) pady = 1.05 / Math.sqrt(d24[0] * d24[0] + d24[1] * d24[1]);
                dx = -1;
                break;
            case a4:
                ctx.transform(-d43[0], -d43[1], d24[0], d24[1], p4[0], p4[1]);
                // Calculate 1.05 pixel padding on vector basis.
                if (u4 != 1) padx = 1.05 / Math.sqrt(d43[0] * d43[0] + d43[1] * d43[1]);
                if (v4 != 1) pady = 1.05 / Math.sqrt(d24[0] * d24[0] + d24[1] * d24[1]);
                dx = -1;
                dy = -1;
                break;
            case a3:
                // Calculate 1.05 pixel padding on vector basis.
                ctx.transform(-d43[0], -d43[1], -d31[0], -d31[1], p3[0], p3[1]);
                if (u4 != 1) padx = 1.05 / Math.sqrt(d43[0] * d43[0] + d43[1] * d43[1]);
                if (v4 != 1) pady = 1.05 / Math.sqrt(d31[0] * d31[0] + d31[1] * d31[1]);
                dy = -1;
                break;
        }

        // Calculate image padding to match.
        var du = (u4 - u1);
        var dv = (v4 - v1);
        var padu = padx * du;
        var padv = pady * dv;

        ctx.drawImage(
            image,
            u1 * iw,
            v1 * ih,
            Math.min(u4 - u1 + padu, 1) * iw,
            Math.min(v4 - v1 + padv, 1) * ih,
            dx, dy,
            1 + padx, 1 + pady
        );
        ctx.restore();
    }

    /**
     * Create a canvas at the specified coordinates.
     */
    function bindCanvas(x, y, width, height) {
        // Create <canvas>
        var canvas;
        if (typeof G_vmlCanvasManager != 'undefined') {
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            $(options.target).appendChild(canvas);
            canvas = G_vmlCanvasManager.initElement(canvas);
        }
        else {
            canvas = $('<canvas width="'+ width +'" height="'+ height +'"></canvas>');

            options.wrapper.append(canvas);
            canvas = canvas[0];
        }

        canvas.style.position = "absolute";
        return canvas;
    }

    /**
     * Calculate a projective transform that maps [0,1]x[0,1] onto the given set of points.
     */
    function getProjectiveTransform(points) {
        var eqMatrix = new Matrix(9, 8, [
            [ 1, 1, 1,   0, 0, 0, -points[3][0],-points[3][0],-points[3][0] ],
            [ 0, 1, 1,   0, 0, 0,  0,-points[2][0],-points[2][0] ],
            [ 1, 0, 1,   0, 0, 0, -points[1][0], 0,-points[1][0] ],
            [ 0, 0, 1,   0, 0, 0,  0, 0,-points[0][0] ],

            [ 0, 0, 0,  -1,-1,-1,  points[3][1], points[3][1], points[3][1] ],
            [ 0, 0, 0,   0,-1,-1,  0, points[2][1], points[2][1] ],
            [ 0, 0, 0,  -1, 0,-1,  points[1][1], 0, points[1][1] ],
            [ 0, 0, 0,   0, 0,-1,  0, 0, points[0][1] ]

        ]);

        var kernel = eqMatrix.rowEchelon().values;
        var transform = new Matrix(3, 3, [
            [-kernel[0][8], -kernel[1][8], -kernel[2][8]],
            [-kernel[3][8], -kernel[4][8], -kernel[5][8]],
            [-kernel[6][8], -kernel[7][8],             1]
        ]);
        return transform;
    }

    /**
     * Initialize the handles and canvas.
     */

        // Create canvas and load image.
    canvas = bindCanvas(0, 0, 1, 1);
    refresh();
    update();
};