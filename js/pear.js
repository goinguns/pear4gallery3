/*jslint browser: true, regexp: true, sub: false, vars: false, white: false, nomen: false, sloppy: true, undef: false, plusplus: true */
/*global jQuery, $, Event, refresh, escape, unescape, slideshowImages, ImageFlow, focusImage, swatchImg  */

var viewMode = "";
var skimimg = 0;
var bgcolor = "black";
var detailViewMode = false;
var savedHeight = 0;
var savedWidth = 0;
var currentImg = 0;
var mosaicView = false;
var slideShowMode = false;
var slideShow = null;
var slideShowId;
var pearCarousel;
var hideHoverV = null;
var hovering = false;
var mosaicEffect = "";
var slideshowTimeout = 5000;

function thumbPadding() {
    var size, width, margin;
    /* Padding on thumbs to make them flow nicer */
    size = Math.ceil((mosaicView) ? $('#imgSlider').slider('value') / 2 : $('#imgSlider').slider('value')) + 10;
    width = $('#mosaicGridContainer').innerWidth() - 16;
    margin = width / Math.floor(width / size) - size;
    $('.gallery-thumb').css({'margin-left': Math.ceil(margin / 2) + 'px', 'margin-right': Math.floor(margin / 2) + 'px'});
}

function toggleReflex(hide) {
    if (hide) {
        //	$$('.Fer').each(function(s) { cvi_reflex.remove(s); });
        $('mosaicGridContainer').select('img[class="Fer"]').each(function (s, index) { Event.observe(s, 'click', function () { if (mosaicView) { swatchImg(index); } else { focusImage(index); } }); });
    } else {
        //	$$('.Fer').each(function(s) { cvi_reflex.add(s, {height: 20, distance: 0 }); });
        $('mosaicGridContainer').select('canvas[class="Fer"]').each(function (s, index) { Event.observe(s, 'click', function () { if (mosaicView) { swatchImg(index); } else { focusImage(index); } }); });
    }
}

function scaleIt(v, sliding) {
    // Remap the 0-1 scale to fit the desired range
    //v=.26+(v*(1.0-.26));
    var size = (mosaicView) ? v / 2 : v;

    toggleReflex(true);
    $(".p-photo").each(function (i) {
        $(this).attr({height: size + 'px', width: size + 'px'});
        $(this).css({height: size + 'px', width: size + 'px'});
    });
    $(".g-photo").css({width: size + 'px'});
    if (!mosaicView && !sliding) {
        toggleReflex(false);
    }
    thumbPadding();
    $('#mosaicGridContainer').trigger('scroll');
}

function thumbLoad(index) {
    //Load non skimming thumbs
    $('.g-thumbnail').each( function() { $(this).attr('src', thumbImages[$(this).attr('id')]); });
    //Load skimming thumbs
    $('.skimm_div').each( function() { $(this).append(thumbImages[$(this).attr('id')]); });

    //Re-initiate all fancyness.
    if (mosaicView) { $('p.giTitle,div.giInfo').hide(); } else { $('p.giTitle,div.giInfo').show(); }
    scaleIt($('#imgSlider').slider('value'));
    $('.p-photo').each(function (index) { $(this).unbind('click'); $(this).click(function () { if (mosaicView) { swatchImg(index); } else {focusImage(index); } }); });
    // Apply jQuery UI icon and hover styles to context menus
    if ($(".g-context-menu").length) {
        $(".g-context-menu li").addClass("ui-state-default");
        $(".g-context-menu a").addClass("g-button ui-icon-left");
        $(".g-context-menu a span.ui-icon").remove();
        $(".g-context-menu a").prepend("<span class=\"ui-icon\"></span>");
        $(".g-context-menu a span").each(function() {
                /*jslint regexp: false*/
                var iconClass = $(this).parent().attr("class").match(/ui-icon-.[^\s]+/).toString();
                /*jslint regexp: true*/
                $(this).addClass(iconClass);
                });
        $("ul.g-context-menu > li a span").addClass("ui-icon-carat-1-s");
    }
    // Initialize thumbnail hover effect
    $(".g-item").hover(
            function() {
            if(mosaicView) { return; }
            // Insert a placeholder to hold the item's position in the grid
            var placeHolder = $(this).clone().attr("id", "g-place-holder");
            $(this).after($(placeHolder));
            // Style and position the hover item
            $(this).addClass("g-hover-item");
            // Initialize the contextual menu
            $(this).gallery_context_menu();
            // Set the hover item's height
            $(this).height("auto");
            },
            function() {
            var sib_height;
            if (mosaicView) { return; }
            // Remove the placeholder and hover class from the item
            $(this).removeClass("g-hover-item");
            $("#g-place-holder").remove();
            }
            );
    thumbPadding();

    //Pre fetch images
    //if ( typeof prefetch === 'undefined') { prefetch = 0; }
    //for ( ; prefetch < slideshowImages.length; prefetch=prefetch+1 ) { $('<img />').attr('src', slideshowImages[prefetch][0]); }
}

function loadMore() {
    if ( navigation.next !== '') {
        var url = navigation.next;
        navigation.next = '';
        $.get(url,{ ajax: '1'},function (data) {
            $('#mosaicGridContainer').append(data);
            thumbLoad();
        });
        return true;
    }
    else { return false; }
}

function setCookie(c_name, value, expiredays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + expiredays);
    document.cookie = c_name + "=" + escape(value) + ((expiredays === null) ? "" : ";expires=" + exdate.toGMTString());
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        var c_start, c_end;
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start !== -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end === -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

function mosaicResize() {
    if ($('#mosaicGridContainer').length === 0) {
        return; //no element found
    }
    var myWidth = 0, myHeight = 0;
    var iRatio = 0, iWidth = 0, iHeight = 0;
    if (slideshowImages.length > currentImg) {
        iWidth = parseFloat(slideshowImages[currentImg][2].replace(/,/gi, "."));
        iHeight = parseFloat(slideshowImages[currentImg][3].replace(/,/gi, "."));
        iRatio = iWidth / iHeight;
        if (isNaN(iRatio)) { iRatio = 1.3333; }
    }
    if (typeof (window.innerWidth) === 'number') {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    if ($('#imageflow').length !== 0) {
        $('#imageflow').css({'height': (myHeight - 53) + 'px', 'width': (((myWidth * 0.5) < (myHeight - 53)) ? myWidth : ((myHeight - 65) * 2)) + 'px'});
    }
    $('#detailImageView').css({'height': myHeight - 165 + "px"});
    if (iRatio > (myWidth / (myHeight - 165))) {
        $('#img_detail').css({'height': myWidth / iRatio + "px", 'width': myWidth + "px"});
    } else {
        $('#img_detail').css({'height': myHeight - 165 + "px", 'width': (myHeight - 165) * iRatio + "px"});
    }
    if (iHeight < (myHeight - 165) && iWidth < myWidth) {
        $('#img_detail').css({'height': iHeight + "px", 'width': iWidth + "px"});
    }
    myWidth = myWidth - 7;
    myHeight = myHeight - $('#g-site-status').outerHeight(true) - $('#paginator').outerHeight(true);
    $('#pearFlowPadd').css({'height': myHeight - 90 - (Math.round(myWidth / 2.4)) + 'px'});
    myHeight -= 138;
    $('#g-header').css('top', $('#gsNavBar').outerHeight(true) + $('#g-site-status').outerHeight(true) - 4);

    if ($('#g-movie').length) {
        myHeight += 18;
    }
    /*Sidebar*/
    if ($('#sidebarContainer').is(':visible')) { myWidth = myWidth - $('#sidebarContainer').width(); }
    $('#sidebarContainer').css('height', (myHeight + 53) + "px");
    if (!mosaicView) {
        $('#mosaicGridContainer').css({'height': (myHeight + 33) + "px", 'width': myWidth + "px"});
    } else {
        $('#mosaicDetail').css('width', Math.floor(myWidth * 0.65) + "px");
        $('#mosaicGridContainer').css({'height': (myHeight + 33) + "px", 'width': Math.floor(myWidth * 0.35) + "px"});

        //Resize the image..
        myWidth = myWidth * 0.65;
        if (iRatio > (myWidth / myHeight)) {
            $('#mosaicImg').attr({height: myWidth / iRatio, width: myWidth});
        } else {
            $('#mosaicImg').attr({height: myHeight, width: myHeight * iRatio});
        }
        if (iHeight < myHeight && iWidth < myWidth) {
            $('#mosaicImg').attr({height: iHeight, width: iWidth});
        }
    }
    thumbPadding();

    if ($('#conf_imageflow').length) {
        refresh();
    }
}

$(window).resize(function () {
    if (window.innerHeight === savedHeight && window.innerWidth === savedWidth) { return; }
    savedHeight = window.innerHeight;
    savedWidth = window.innerWidth;
    mosaicResize();
});

function getViewMode() {
    var vm = detailViewMode ? "detail" : viewMode;
    if (vm !== '') {
        vm = "&viewMode=" + vm;
    }
    return vm;
}

function updateHash() {
    var hash, img = "", val, i;
    if (currentImg !== 0) {
        img = "img=" + currentImg;
    }
    hash = "#" + img + getViewMode() + "&bgcolor=" + bgcolor;
    if($('#paginator')) { $('#paginator a').each(function () { val = $(this).attr("href"); i = val.indexOf("#"); if (i !== -1) { val = val.substr(0, i); } $(this).attr("href", val + hash); }); 
    }
    window.location.hash = hash;
}

function swatchSkin(intSkin) {
    setCookie('swatchSkin', intSkin, 1);
    $('#black').removeClass().addClass("swatch");
    $('#dkgrey').removeClass().addClass("swatch");
    $('#ltgrey').removeClass().addClass("swatch");
    $('#white').removeClass().addClass("swatch");
    switch (intSkin) {
        // dkgrey
    case 'dkgrey':
    case 1:
        $('div.gallery-thumb-round').css('backgroundPosition', "-200px 0px");
        $('#mosaicTable,.pear,.g-paginator').css('backgroundColor', "#262626");
        $('p.giTitle').css("color", "#a9a9a9");
        $("#dkgrey").addClass("dkgrey sel dkgrey-with-sel-with-swatch");
        bgcolor = "dkgrey";
        break;
        // ltgrey
    case 'ltgrey':
    case 2:
        $('div.gallery-thumb-round').css('backgroundPosition', "-400px 0px");
        $('#mosaicTable,.pear,.g-paginator').css('backgroundColor', "#d9d9d9");
        $('p.giTitle').css("color", "#333333");
        $("#ltgrey").addClass("ltgrey sel ltgrey-with-sel-with-swatch");
        bgcolor = "ltgrey";
        break;
        // white
    case 'white':
    case 3:
        $('div.gallery-thumb-round').css('backgroundPosition', "-600px 0px");
        $('#mosaicTable,.pear,.g-paginator').css('backgroundColor', "#ffffff");
        $('p.giTitle').css("color", "#444444");
        $("#white").addClass("white sel white-with-sel-with-swatch");
        bgcolor = "white";
        break;
        // Black is default
    default:
        $('div.gallery-thumb-round').css('backgroundPosition', "0px 0px");
        $('#mosaicTable,.pear,.g-paginator').css('backgroundColor', "#000");
        $('p.giTitle').css("color", "#a3a3a3");
        $("#black").addClass("black sel black-with-sel-with-swatch");
        bgcolor = "black";
        break;
    }
    updateHash();
}

//Set a updating timer so users can't update before the image has appeard..
function swatchImg(imageId) {
    if (imageId < 0 || imageId >= slideshowImages.length) {
        if ( navigation.next !== '') {
            $.get(navigation.next,{ ajax: '1'},function (data) {
                    $('#mosaicGridContainer').append(data);
                    thumbLoad();
                    swatchImg(imageId);
                    });
        }
        return;
    }
    currentImg = imageId;

    if (mosaicView) {
        var options = {};
        if ( mosaicEffect === "scale" ) { options = { percent: 0 }; }
        $('#mosaicDetail').hide(mosaicEffect, options, "fast", function () {
            $('#imageTitle').html("<h2>" + slideshowImages[imageId][4] + "</h2>");
            $('#mosaicImg').attr('src',  slideshowImages[imageId][0]);
            $('#mosaicImg').css('cursor', "pointer");
            $('#mosaicImg').load(
                $('#mosaicDetail').show(mosaicEffect, options, "slow"));
        });
    }

    /* Set controls for hover view. */
    if (currentImg === 0) {
        $('#prev_detail').addClass('prev_detail_disabled');
        $('#prev_detail').removeClass('prev_detail');
    } else {
        $('#prev_detail').removeClass('prev_detail_disabled');
        $('#prev_detail').addClass('prev_detail');
    }
    if (currentImg === slideshowImages.length - 1) {
        $('#next_detail').addClass('next_detail_disabled');
        $('#next_detail').removeClass('next_detail');
    } else {
        $('#next_detail').removeClass('next_detail_disabled');
        $('#next_detail').addClass('next_detail');
    }
    $('#img_detail').hide();
    /* Update image and title in focus view */
    $('#img_detail').attr('src', slideshowImages[currentImg][0]);
    $('#info_detail').attr('href', slideshowImages[currentImg][1]);
    $('#imageTitleLabel').html("<h2>" + slideshowImages[imageId][4] + "</h2>");
    updateHash();
    mosaicResize();
    $('#img_detail').load($('#img_detail').fadeIn());
}

function hideHoverView() {
    if (!hovering) { $('#hoverView').fadeOut(); }
    hideHoverV = null;
}

function showHoverView() {
    if (hideHoverV !== null) { clearTimeout(hideHoverV); }
    $('#hoverView').show();
    hideHoverV = setTimeout(hideHoverView, 3000);
}

function focusImage(id, redirected) {
    if (id < 0 || id >= slideshowImages.length) {
        if ( navigation.next !== '') {
            $.get(navigation.next,{ ajax: '1'},function (data) {
                    $('#mosaicGridContainer').append(data);
                    thumbLoad();
                    focusImage(id);
                    });
        }
        return;
    }
    currentImg = id;
    detailViewMode = true;
    swatchImg(id);
    $('#play_detail').hide();
    $('#pause_detail').hide();
    $('#detailView').fadeIn('slow');
    showHoverView();
    //Image count.
    if (!redirected) { $.get(slideshowImages[currentImg][6]); }
}

function checkCookie() {
    var co = getCookie('slider');
    if (co !== null && co !== "") {
        $('#imgSlider').slider("value", co);
    }
    co = getCookie('swatchSkin');
    if (co !== null && co !== "") {
        swatchSkin(co);
    } else {
        swatchSkin('black');
    }
}

function getAlbumHash(img) {
    return "#img=" + img + getViewMode() +  "&bgcolor=" + bgcolor;
}

function slideShowUpdate() {
    slideShowId = slideShowId + 1;
    if (slideShowId > slideshowImages.length) {
        slideShowId = 0;
    }
    swatchImg(slideShowId);
    slideShow = setTimeout(slideShowUpdate, slideshowTimeout);
}

function togglePlayPause() {
    //We are paused
    if (slideShow === null) {
        $('#play_detail').hide();
        $('#pause_detail').show();
        slideShow = setTimeout(slideShowUpdate, slideshowTimeout);
    } else { //We are playing
        $('#pause_detail').hide();
        $('#play_detail').show();
        clearTimeout(slideShow);
        slideShow = null;
    }
}

function startSlideshow() {
    slideShowMode = true;
    $('#play_detail').hide();
    $('#pause_detail').show();
    $('#detailView').fadeIn('slow');
    showHoverView();
    slideShowId = currentImg;
    swatchImg(slideShowId);
    togglePlayPause();
}

function switchMode(mode) {
    $('#mosaic,#grid,#carousel').removeClass("sel sel-with-viewSwitcher");
    $('#' + mode).addClass("sel sel-with-viewSwitcher");
    updateHash();
}

function switchToGrid(userSet) {
    if (userSet === true) {
        viewMode = "grid";
    }
    toggleReflex(true);
    $('#pearImageFlow,#pearFlowPadd').hide();
    $('#mosaicTable').show();
    if (!$('#mosaicGridContainer').length) { return; }
    mosaicView = false;
    scaleIt($('#imgSlider').slider('value'));
    checkCookie();
    $('#mosaicDetail').hide();
    $('#mosaicGridContainer').show();
    $('p.giTitle,div.giInfo').each(function (s) { $(this).show(); });
    switchMode('grid');
    mosaicResize();
}

function switchToMosaic(userSet) {
    if (userSet === true) {
        viewMode = "mosaic";
    }
    toggleReflex(false);
    $('#pearImageFlow,#pearFlowPadd').hide();
    $('#mosaicTable').show();
    if (!$('#mosaicGridContainer').length) { return; }
    mosaicView = true;
    scaleIt($('#imgSlider').slider('value'));
    checkCookie();
    $('#mosaicDetail').show();
    $('#mosaicGridContainer').show();
    $('p.giTitle,div.giInfo').each(function (s) { $(this).hide(); });
    switchMode('mosaic');
    swatchImg(currentImg);
    mosaicResize();
}

function startImageFlow(userSet) {
    var i, img;
    if (userSet === true) {
        viewMode = "carousel";
    }
    $('#mosaicTable').hide();

    $('#pearImageFlow,#pearFlowPadd').show();

    toggleReflex(true);

    if (!pearCarousel) {
        for (i = 0; i < slideshowImages.length; i++) {
            //var img = '<div class="item"><img class="content" src="' + slideshowImages[i][0] + '"/><div class="caption">' + $('#mosaicGridContainer img').eq(i).attr('alt') + '"</div></div>';
            img = '<img src="' + slideshowImages[i][0] + '" longdesc="' + i + '" width="' + slideshowImages[i][2] + '" height="' + slideshowImages[i][3] + '" alt="' + slideshowImages[i][4] + '" style="display: none;">';
            //		console.log(img);
            $('#pearImageFlow').append(img);
        }
        pearCarousel = new ImageFlow();
        pearCarousel.init({ImageFlowID: 'pearImageFlow', aspectRatio: 2.4, imagesHeight: 0.6, opacity: true, reflections: false, startID: currentImg + 1, onClick: function () { focusImage($(this).attr('longdesc')); }, startAnimation: true, xStep: 200, imageFocusM: 1.7, imageFocusMax: 4, opacityArray: [10, 9, 6, 2], percentOther: 130, captions: false, slider: false});
    }
    switchMode('carousel');
    mosaicResize();
}

function hideDetailView() {
    $('#detailView').hide();
    slideShowMode = detailViewMode = false;
    if (slideShow !== null) { clearTimeout(slideShow); }
    slideShow = null;
    updateHash();
}

function setKeys() {
/* Fixes the back button issue */
/*	window.onunload = function()
{
document = null;
}
*/
    $(document).keydown(function (e) {
        var charCode = e.keyCode || e.which;
        switch (charCode) {
        case 32: /* Space */
            if (slideShowMode) { togglePlayPause(); }
            break;
        case 39: /* Right arrow key */
        case 78: /* N */
            swatchImg(currentImg + 1);
            //	if($('imageflow')) handle(-1);
            break;
        case 80: /* P */
        case 37: /* Left arrow key */
            swatchImg(currentImg - 1);
            //	if($('imageflow')) handle(1);
            break;
        case 27: /* Esc-key */
            hideDetailView();
            break;
        }
    });
}

function bodyLoad(vm, bgcolor) {
    var h, co, view;
    viewMode = vm;
    /* Parse hash */
    h = $.parseQuery(window.location.hash.substring(1));
    if (h.img !== undefined) {
        currentImg = parseInt(h.img, 10);
    }
    if (h.bgcolor !== undefined) {
        swatchSkin(h.bgcolor);
    }
    if (h.viewMode !== undefined) {
        vm = h.viewMode;
    }
    /* end parse hash */

    if (navigator.appVersion.search(/MSIE [0-7]/i) !== -1) {
        $('.track').each(function (s) {$(this).css('top', '-16px'); }); //Fix for IE's poor page rendering. 
    }
    /*	
        58.5 225
        32.5 125
        */
    $('#imgSlider').slider({ min: 75, max: 250, step: 2, value: 125,
        slide: function (event, ui) { scaleIt(ui.value); },
        change: function (event, ui) { scaleIt(ui.value); setCookie('slider', ui.value, '1'); } });

    //Set event for Thumb Click.
    $('.p-photo').each(function (index) { $(this).click(function () { if (mosaicView) { swatchImg(index); } else {focusImage(index); } }); });
    $('#mosaicDetail').click(function () { focusImage(currentImg); });
    $('#prev_detail').click(function () { swatchImg(currentImg - 1); });
    $('#next_detail').click(function () { swatchImg(currentImg + 1); });
    $('#img_detail').click(function () { hideDetailView(); });

    co = getCookie('swatchSkin');
    if (co === null || co === "") {
        swatchSkin(bgcolor);
    }

    if (typeof slideshowImages !== 'undefined' && !slideshowImages.length) {
        viewMode = vm = 'grid';
    }
    if (vm === 'detail') {view = viewMode; focusImage(currentImg, h.redirected);} else {view = viewMode = vm;}
    switch (view) {
    case 'carousel':
        startImageFlow(false);
        break;
    case 'grid':
        switchToGrid(false);
        break;
    case 'mosaic':
        switchToMosaic(false);
        break;
    default:
        mosaicResize();
        checkCookie();
    }

    setKeys();
    thumbLoad();
    $('#mosaicGridContainer').endlessScroll({ fireOnce: true, fireDelay: 500, callback: function(p) { loadMore(); } });
    $('#mosaicGridContainer').trigger('scroll');
    $('#loading').hide();

    if (slideshowImages.length !== 0) {
        $(".viewSwitcher").hover( function() { $(this).addClass("hover-with-viewSwitcher"); }, function() { $(this).removeClass("hover-with-viewSwitcher"); });
        $("#grid").click(function () { switchToGrid(true); });
        $("#mosaic").click(function () { switchToMosaic(true); });
        $("#carousel").click(function () { startImageFlow(true); });
        $('#slideshow').click(function () { startSlideshow(); });
    } else {
        $("#grid, #mosaic, #carousel, #slideshow").addClass("disabled");
    }
}

function sidebarInit(mode) {
    switch (mode) {
        case 'toggle':
            $('#sidebarContainer').width(5);
            $('#sidebarContainer').hover(function () {
                    $('#sidebarContainer').animate( { width: '225' }, 500);
                    //$('#sidebar').show('slide', { direction: 'right'}, 1000);
                    $('#mosaicGridContainer').animate( { width: '-=225' }, 500, function () { mosaicResize(); }); },
                function () {
                    $('#sidebarContainer').animate( { width: '5' }, 500);
                    //$('#sidebar').hide('slide', { direction: 'right'}, 1000);
                    $('#mosaicGridContainer').animate( { width: '+=225' }, 500, function () { mosaicResize(); });
                });
            break;
        case 'static':
            break;
        //case 'hidden':
        default:
            $('#sidebarContainer').hide();
            break;
    }
}

