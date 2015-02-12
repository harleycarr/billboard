var billboard = function (target, bg) {
    var $background = $(document.createElement('div')).addClass('billboard-background');
    var $bgImage = $(document.createElement('img')).attr('src', bg);
    var $element = $(document.getElementById(target));
    $element.prepend($background);
    $background.append($bgImage);

    $background.css({
        position: 'relative',
        'z-index': 100
    });
    $('#canvas').css('z-index', 99);
    console.log($bgImage.width);
};

$(document).ready(function(){
    billboard(
        'target',
        'images/billboard.png'
    );
});
