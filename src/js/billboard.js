var billboard = function (options) {
    var $element = options.target;
    var $canvasContainer = $(document.createElement('div')).attr('id', 'canvas');
    var $background = $(document.createElement('div')).addClass('billboard-background');
    var $bgImage = $(document.createElement('img')).attr('src', options.billboardImage);

    $element.append($background);
    $element.append($canvasContainer);
    $background.append($bgImage);

    $background.css({
        position: 'relative',
        'z-index': 100
    });

    $('#canvas').css({
        'position': 'absolute',
        'z-index': 99

    });
};

$(document).ready(function(){
    var $element = $(document.getElementById('target'));

    var options = {
        target: $element,
        billboardImage: 'images/billboard.png',
        dynamicImage: 'images/testImage.jpg',
        coordinates: [
            [337, 40],
            [633, 114],
            [335, 480],
            [651, 529]
        ]
    };

    billboard(options);
});
