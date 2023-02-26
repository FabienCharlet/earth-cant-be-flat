function addEvent(elem, event, fn) {
    if (elem.addEventListener) {
        elem.addEventListener(event, fn, false);
    } else {
        elem.attachEvent("on" + event, function() {
            return(fn.call(elem, window.event));
        });
    }
}

var eventSet = false;
var loaded = false;

(function(funcName, baseObj) {

    funcName = funcName || "docReady";
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    function ready() {
        if (!readyFired) {
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                readyList[i].fn.call(window, readyList[i].ctx);
            }

            readyList = [];
        }
    }

    function readyStateChange() {
        if ( document.readyState === "complete" ) {
            ready();
        }
    }

    baseObj[funcName] = function(callback, context) {
        if (typeof callback !== "function") {
            throw new TypeError("callback for docReady(fn) must be a function");
        }

        if (readyFired) {
            setTimeout(function() {callback(context);}, 1);
            return;
        } else {
            readyList.push({fn: callback, ctx: context});
        }
        if (document.readyState === "complete") {
            setTimeout(ready, 1);
        } else if (!readyEventHandlersInstalled) {
            if (document.addEventListener) {
                document.addEventListener("DOMContentLoaded", ready, false);
                window.addEventListener("load", ready, false);
            } else {
                document.attachEvent("onreadystatechange", readyStateChange);
                window.attachEvent("onload", ready);
            }
            readyEventHandlersInstalled = true;
        }
    }
})("docReady", window);


var currentSlide = 0;
var mainDiv;
var navDiv;
var downScrollerDiv;
var nbSlides;
var currentScrollPosition = 0;
var scrollingAskedTime = 0;
var scrollingEndTime = 0;
var currentSlideScrolling = false;
var heights = [0];
var debugConsole = true;

docReady(function() {

	init();
	downScrollerDiv.innerHTML = '<a href="#" onclick="launchScroll(true);"><img src="/app/img/downscroll-light.png" width="50" height="50"></a>';
});

function log(text) {

	if (debugConsole) {

		console.log(text);
	}
}

function init() {

	downScrollerDiv = document.getElementById("downscroller");
	mainDiv = document.getElementById("main");
	navDiv = document.getElementById("navDiv");
	navMenu = document.getElementById("nav-menu");

	let slidesDiv = document.getElementsByClassName("slide");
	nbSlides = slidesDiv.length;
	responsiveMenuOpened = false;

	initMenuLinks();
	computeDivHeights();
	registerScrollEvent();
	registerSwipeEvent();
	registerWindowResizedEvent();
}


function initMenuLinks() {

	for (let i = 0; i < navMenu.getElementsByTagName("li").length; i++) {

	  menuText = navMenu.getElementsByTagName("li")[i].innerHTML;
	  navMenu.getElementsByTagName("li")[i].innerHTML = '<a href="#" onclick="return scrollToSlide(' + i +');">' + menuText + '</a>';
	}

}

function computeDivHeights() {

	let slidesDiv = document.getElementsByClassName("slide");
	heights = [0];

	for (var i = 0; i < slidesDiv.length; i++) {

		heights.push(heights[i] + slidesDiv[i].clientHeight);
		log("Slide " + slidesDiv[i].id + " : " + heights[i] + " -> " + heights[i+1]);
	}

	log("Computed Heights : " + heights);
}

function registerWindowResizedEvent() {

	let eventHandle;
	window.onresize = function(){
	  clearTimeout(eventHandle);
	  eventHandle = setTimeout(handleWindowResized, 100);
	};
}

function handleWindowResized() {

	computeDivHeights();
	scrollToSlide(currentSlide);
}

function registerScrollEvent() {

	document.body.onwheel = handleScroll;
}

function registerSwipeEvent() {

	let minSwipeYDelta = 50;  //min y swipe for vertical swipe
	let startSwipeY = 0;
	let currentSwipeY = 0;

	let down = true;

	document.body.addEventListener('touchstart',function(e){

		startSwipeY = e.touches[0].screenY;
		currentSwipeY = startSwipeY;

		log('Start Swipe = ' + startSwipeY);
	  },false);

	document.body.addEventListener('touchmove',function(e){

		currentSwipeY = e.touches[0].screenY;

		log('Keep Swipe = ' + currentSwipeY);
	  },false);

	document.body.addEventListener('touchend',function(e){

		log('End Swipe = ' + currentSwipeY);

		if ( (currentSwipeY - minSwipeYDelta > startSwipeY) || (currentSwipeY + minSwipeYDelta < startSwipeY) ) {

			down = currentSwipeY < startSwipeY;
			log('Swipe validated ' + (down ? 'down' : 'up'));

			launchScroll(down);
		}

	  },false);
}


function scrollToSlide(nextSlide) {

	mainDiv.style.transform = "translateY(-" + heights[nextSlide] + 'px)';
	navDiv.style.top = "" + heights[nextSlide] + "px";


	if (nextSlide == nbSlides-1) {

		downScrollerDiv.style.visibility = 'hidden';
	}
	else {

		downScrollerDiv.style.visibility = 'visible';
	}

	for (let i = 1; i < navMenu.getElementsByTagName("li").length; i++) {

	  navMenu.getElementsByTagName("li")[i].setAttribute("class", (i == nextSlide ? "selected" : ""));
	}

	if (responsiveMenuOpened) {

		responsiveMenuClick();
	}

	log('Slide changed to ' + nextSlide + ' at height ' + heights[nextSlide]);
	currentSlide = nextSlide;

	currentSlideScrolling = false;

	return false;
}

function changeSlide(down) {

	log('Change slide requested ' + (down ? 'down' : 'up'));

	let nextSlide = down ? currentSlide + 1 : currentSlide - 1;

	if (nextSlide >= nbSlides || nextSlide < 0) {

    	log('Change Slide ignored : '
    		+ (nextSlide >= nbSlides ? ': already at the bottom of the page' : '')
    		+ (nextSlide < 0 ? ': already at the top of the page' : ''));

		currentSlideScrolling = false;
		return;
	}

	scrollToSlide(nextSlide);
}

function handleScroll(event) {

	log('New scroll requested');

	var isScrollingNotTooCloseFromPrevious = (Date.now() - scrollingAskedTime > 500);

    if ( !currentSlideScrolling && isScrollingNotTooCloseFromPrevious) {

    	currentSlideScrolling = true;

    	scrollingAskedTime = Date.now();

		log('Lauching scroll');

    	launchScroll(event.deltaY > 0);
	}
    else {

    	log('Scroll ignored : '
    		+ (currentSlideScrolling ? ': already scrolling' : '')
    		+ (! isScrollingNotTooCloseFromPrevious ? ': scroll too close from previous event' : ''));
    }
}

function launchScroll(down) {

	log('Launch scroll');

	window.requestAnimationFrame(function() {

		changeSlide(down);

    	log('Scrolled synchronously');
    });
}

function responsiveMenuClick() {
  var x = document.getElementById("navDiv");
  if (x.className === "topnav") {
    x.className += " responsive";
	responsiveMenuOpened = true;
  } else {
    x.className = "topnav";
	responsiveMenuOpened = false;
  }
}