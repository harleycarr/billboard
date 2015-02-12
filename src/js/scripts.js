
$(document).ready(function(){
    var element = document.getElementById('target');

    var options = {
        target: element,
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
