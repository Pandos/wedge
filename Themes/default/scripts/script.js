/*!
 * Wedge
 *
 * These are the core JavaScript functions used on most pages generated by Wedge.
 *
 * @package wedge
 * @copyright 2010-2013 Wedgeward, wedge.org
 * @license http://wedge.org/license/
 *
 * @version 0.1
 */

@language index;

var
	oThought,
	weEditors = [],
	_formSubmitted,
	_modalDone = false,

	we_confirm = $txt['generic_confirm_request'],
	we_loading = $txt['ajax_in_progress'],
	we_cancel = $txt['form_cancel'],
	we_delete = $txt['delete'],
	we_submit = $txt['form_submit'],
	we_ok = $txt['ok'],

	// Basic browser detector. Do not trust it blindlessly. Still, it can be helpful.
	ua = function (str) { return navigator.userAgent.toLowerCase().indexOf(str) != -1; },

	// The Webkit ones. Oh my, that's a long list... Right now we're only supporting iOS and generic Android browsers.
	is_webkit = ua('webkit'),
	is_chrome = is_webkit && ua('chrome'),
	is_ios = is_webkit && ua('(ip'),
	is_android = is_webkit && ua('android'),
	is_safari = is_webkit && !is_chrome && !is_android && !is_ios,

	// This should allow us to catch more touch devices like smartphones and tablets...
	is_touch = 'ontouchstart' in document.documentElement,

	is_opera = ua('opera'),

	// IE gets versioned, too. Do you have to ask why..?
	is_ie = ua('msie') || ua('trident'), // ua('trident') seems to be the only way to detect IE 11+.
	is_ie6 = is_ie && ua('msie 6'),
	is_ie7 = is_ie && ua('msie 7'),
	is_ie8 = is_ie && ua('msie 8'),
	is_ie8down = is_ie6 || is_ie7 || is_ie8,

	is_ff = !is_webkit && !is_ie && ua('mozilla');

// Replace the default jQuery easing type for animations.
$.easing.swing2 = $.easing.swing;
$.easing.swing = function (x, t, b, c, d)
{
	return b + c * Math.sqrt(1 - (t = t / d - 1) * t);
};

String.prototype.php_htmlspecialchars = function ()
{
	return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

String.prototype.php_unhtmlspecialchars = function ()
{
	return this.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
};

String.prototype.wereplace = function (oReplacements)
{
	var sSearch, sResult = this;
	// .replace() uses $ as a meta-character in replacement strings, so we need to convert it to $$ first.
	for (sSearch in oReplacements)
		sResult = sResult.replace(new RegExp('%' + sSearch + '%', 'g'), (oReplacements[sSearch] + '').split('$').join('$$'));

	return sResult;
};

/*
	A stylable alert() alternative.
	@string string: HTML content to show.
	[optional] @object e: the current event object, if any. Must be specified if the alert is called before moving to another page (e.g. submit).
	[optional] @function callback: a function to call after the user clicked OK.
*/
function say(string, e, callback)
{
	return _modalDone || reqWin('', 350, string, 2, callback || (e && !e.target ? e : 0), e && e.target ? e : 0);
}

/*
	A stylable confirm() alternative.
	@string string: HTML content to show.
	[optional] @object e: the current event object, if any. Must be specified if the event handler uses ask() to cancel or proceed.
	[optional] @function callback: a function to call after the user made their choice. function (answer) { if (answer) { They agreed. } }
*/
function ask(string, e, callback)
{
	return _modalDone || reqWin('', 350, string, 1, callback || (e && !e.target ? e : 0), e && e.target ? e : 0);
}

/*
	Open a new popup window. The first two params are for generic pop-ups, while the rest is for confirm/alert boxes.

	@string from: specifies the URL to open. Use 'this' on a link to automatically use its href value.
	@mixed desired_width: use custom width. Omit or set to 0 for default (480px). Height is always auto.

	@string string: if provided, this is the contents. Otherwise, it will be retrieved through Ajax.
	@int modal_type: is this a modal pop-up? (i.e. requires attention) 0 = no, 1 = confirm, 2 = alert
	@function callback: if this is a modal pop-up (confirm, alert...), you can set a function to call with a boolean
						param (true = OK, false = Cancel). You can force cancelling the event by returning false from it.
	@object e: again, if this is a modal pop-up, we may need to re-call the original event.
*/
function reqWin(from, desired_width, string, modal_type, callback, e)
{
	var
		help_page = from && from.href ? from.href : from,
		title = from && from.href ? $(from).text() : 0,
		// window.innerHeight doesn't work in oldIE, and $(window).height() sometimes returns the body height in Chrome...
		viewport_width = $(window).width(),
		viewport_height = window.innerHeight || $(window).height(),
		previous_target = $('#helf').data('src'),
		close_window = function ()
		{
			$('#popup,#helf').removeClass('show');
			setTimeout(function () { $('#popup').remove(); }, 300);
		},
		animate_popup = function ()
		{
			var $section = $('section', this);

			// Ensure that the popup never goes past the viewport boundaries.
			$section
				.width(Math.min(desired_width || 480, viewport_width - 20))
				.css({
					maxWidth: viewport_width - 20 - $(this).width() + $section.width(),
					maxHeight: viewport_height - 20 - $(this).height() + $section.height()
				});

			$(this).css({ left: (viewport_width - $(this).width()) / 2, top: (viewport_height - $(this).height()) / 2 }).ds();
			$('#popup,#helf').addClass('show');
		};

	// Try and get the title for the current link.
	if (!title)
	{
		var nextSib = from.nextSibling;
		// Newlines are seen as stand-alone text nodes, so skip these...
		while (nextSib && nextSib.nodeType == 3 && $.trim($(nextSib).text()) === '')
			nextSib = nextSib.nextSibling;
		// Get the final text, remove any dfn (description) tags, and trim the rest.
		title = $.trim($(nextSib).clone().find('dfn').remove().end().text());
	}

	// Clicking the help icon twice should close the popup.
	if ($('#popup').remove().length && previous_target && previous_target == help_page)
		return false;

	// We create the popup inside a dummy div to fix positioning in freakin' IE6.
	$('body').append(
		$('<div>')
		.attr('id', 'popup')
		.width(viewport_width)
		.height(viewport_height)
		.css('top', is_ie6 || is_ios ? $(window).scrollTop() : 0)
		.append(
			$('<div>')
			.attr('id', 'helf')
			.data('src', help_page)
		)
	);

	if (modal_type)
		$('#helf')
			.html('<section class="nodrag confirm">' + string + '</section><footer><input type="button" class="submit'
				+ (modal_type == 1 ? ' floatleft" /><input type="button" class="delete floatright" />' : '" />') + '</footer>')
			.each(animate_popup)
			.find('input')
			.val(we_cancel)
			.click(function () {
				close_window();
				if (callback && callback.call(e ? e.target : this, $(this).hasClass('submit')) === false)
					return;
				if (e && $(this).hasClass('submit'))
				{
					_modalDone = true;
					// The location trick is required by non-HTML5 browsers.
					// To save 4 bytes here, <a> tags only accept ask() through onclick.
					if (e.target.href)
						location = e.target.href;
					else
						$(e.target).trigger(e.type);
					_modalDone = false;
				}
			})
			.filter('.submit')
			.val(we_ok);
	else
		$('#helf')
			.load(help_page, { t: title }, animate_popup)
			// Clicking anywhere on the page should close the popup.
			.parent() // #popup
			.click(function (e) {
				// If we clicked somewhere in the popup, don't close it, because we may want to select text.
				if (!$(e.target).closest('#helf').length)
					close_window();
			});

	// Return false so the click won't follow the link ;)
	return false;
}

// Only allow form submission ONCE.
function submitonce()
{
	_formSubmitted = true;

	// If there are any editors warn them submit is coming!
	$.each(weEditors, function () { this.doSubmit(); });
}

function submitThisOnce(oControl)
{
	$('textarea', oControl.form || oControl).attr('readOnly', true);
	return !_formSubmitted;
}

// Checks for variable in an array.
function in_array(variable, theArray)
{
	return $.inArray(variable, theArray) != -1;
}

// Invert all checkboxes at once by clicking a single checkbox.
function invertAll(oInvertCheckbox, oForm, sMask)
{
	$.each(oForm, function () {
		if (this.name && !this.disabled && (!sMask || this.name.indexOf(sMask) === 0|| this.id.indexOf(sMask) === 0))
			this.checked = oInvertCheckbox.checked;
	});
}

// Shorten all raw URLs in user content. The spans allow for the actual link to be retained when copying/pasting the page content.
function breakLinks()
{
	$('.bbc_link').each(function () {
		var link = $(this).text();
		if (link == this.href && link.length > 50)
			$(this).html(link.slice(0, 25) + '<span class="cut"><span>' + link.slice(25, -25) + '</span></span><wbr>' + link.slice(-25));
	});
}

// Shows the page numbers by clicking the dots.
function expandPages(spanNode, firstPage, lastPage, perPage)
{
	var i = firstPage, pageLimit = 50, baseURL = $(spanNode).data('href');

	// Prevent too many pages from being loaded at once.
	if ((lastPage - firstPage) / perPage > pageLimit)
	{
		var oldLastPage = lastPage;
		lastPage = firstPage + perPage * pageLimit;
	}

	// Calculate the new pages.
	for (; i < lastPage; i += perPage)
		$(spanNode).before('<a href="' + baseURL.replace(/%1\$d/, i).replace(/%%/g, '%') + '">' + (1 + i / perPage) + '</a> ');

	if (oldLastPage)
		$(spanNode).before($(spanNode).clone().click(function () { expandPages(this, lastPage, oldLastPage, perPage); }));

	$(spanNode).remove();
}

// Create the Ajax loading icon, and add a link to turn it off.
// 'where' should be empty to center on screen, or a DOM element to serve as the center point.
// 'exact' is an optional array of two numbers, indicating a top/left offset to be applied on top of where's.
// e.g., show_ajax('#notifs', [0, 20]) will show the Ajax popup 20 pixels below the center of the #notifs text.
function show_ajax(where, exact)
{
	// We're delaying the creation a bit, to account for super-fast AJAX (e.g. local server, etc.)
	window.ajax = setTimeout(function ()
	{
		var offs = $(where).offset();
		$('<div id="ajax">')
			.html('<a title="' + (we_cancel || '') + '"></a>' + we_loading)
			.click(hide_ajax)
			.appendTo('body');
			$('#ajax').offset({
				left: (offs && offs.left || 0) + (exact && exact[0] || 0) + $(where || window).width() / 2 - $('#ajax').width() / 2,
				top: (offs && offs.top || 0) + (exact && exact[1] || 0) + $(where || window).height() / 2 - $('#ajax').height() / 2 + (where ? 0 : $(window).scrollTop())
			});
		$('body').addClass('waiting');
	}, 200);
}

function hide_ajax()
{
	clearTimeout(window.ajax);
	$('body').removeClass('waiting');
	setTimeout(function () { $('#ajax').remove(); }, 200);
}

// Rating boxes in Media area.
function ajaxRating()
{
	show_ajax();
	$.post(
		$('#ratingF').attr('action'),
		{ rating: $('#rating').val() },
		function (new_contents) {
			$('#ratingF').parent().html(new_contents);
			$('#rating').sb();
			hide_ajax();
		}
	);
}

// This function takes the script URL, and adds a question mark (or semicolon) so we can
// append a query string (url) to it. It also replaces the host name with the current one,
// which is sometimes required for security reasons.
function weUrl(url)
{
	return we_script.replace(/:\/\/[^\/]+/g, '://' + location.host) + (we_script.indexOf('?') == -1 ? '?' : (we_script.search(/[?&;]$/) == -1 ? ';' : '')) + url;
}

// Get the text in a code tag.
function weSelectText(oCurElement)
{
	// The place we're looking for is one div up, and next door - if it's auto detect.
	var oCodeArea = oCurElement.parentNode.nextSibling, oCurRange;

	if (!!oCodeArea)
	{
		// Start off with IE
		if ('createTextRange' in document.body)
		{
			oCurRange = document.body.createTextRange();
			oCurRange.moveToElementText(oCodeArea);
			oCurRange.select();
		}
		// Firefox et al.
		else if (window.getSelection)
		{
			var oCurSelection = window.getSelection();
			// Safari is special!
			if (oCurSelection.setBaseAndExtent)
			{
				var oLastChild = oCodeArea.lastChild;
				oCurSelection.setBaseAndExtent(oCodeArea, 0, oLastChild, (oLastChild.innerText || oLastChild.textContent).length);
			}
			else
			{
				oCurRange = document.createRange();
				oCurRange.selectNodeContents(oCodeArea);

				oCurSelection.removeAllRanges();
				oCurSelection.addRange(oCurRange);
			}
		}
	}

	return false;
}


/**
 * Drag & slide plugin.
 * You may set an area as non-draggable by adding the nodrag class to it.
 * This way, you can drag the element, but still access UI elements within it.
 */

$.fn.ds = function ()
{
	var origMouse, currentPos, currentDrag = 0;

	// Updates the position during the dragging process
	$(document)
		.mousemove(function (e) {
			if (currentDrag)
			{
				$(currentDrag).css({
					left: currentPos.x + e.pageX - origMouse.x,
					top: currentPos.y + e.pageY - origMouse.y
				});
				return false;
			}
		})
		.mouseup(function () {
			if (currentDrag)
				return !!(currentDrag = 0);
		});

	this // 'return this' to make it chainable... Costs extra space.
		.css('cursor', 'move')
		// Start the dragging process
		.mousedown(function (e) {
			if ($(e.target).closest('.nodrag').length)
				return true;

			$(this).css('zIndex', 999);

			origMouse = { x: e.pageX, y: e.pageY };
			currentPos = { x: parseInt(this.offsetLeft, 10), y: parseInt(this.offsetTop, 10) };
			currentDrag = this;

			return false;
		})
		.find('.nodrag')
		.css('cursor', 'default');
};


/**
 * Dropdown menu in JS with CSS fallback, Nao style.
 * May not show, but it took years to refine it.
 */

$.fn.mm = function ()
{
	var menu_baseId = 0, menu_delay = [],

	// Entering a menu entry?
	menu_show_me = function ()
	{
		var
			is_top = $(this).parent().hasClass('menu'),
			is_visible = $('>ul', this).css('visibility') == 'visible';

		$('>ul', this).css({
			visibility: 'visible',
			opacity: 1,
			margin: is_top ? '0 ' + $('span', this).width() + 'px' : 0
		});

		if (!is_top || !$('>h4', this).addClass('hove').length)
			$(this).addClass('hove').parentsUntil('.menu>li').filter('li').addClass('hove');

		if (!is_visible)
			$('>ul', this)
				.css(is_top ? { marginTop: 5 } : { marginLeft: 0 })
				.animate(is_top ? { marginTop: 0 } : { marginLeft: -5 });

		clearTimeout(menu_delay[this.id.slice(2)]);

		$(this).siblings('li').each(function () { menu_hide_children(this.id); });
	},

	// Leaving a menu entry?
	menu_hide_me = function (e)
	{
		// The deepest level should hide the hover class immediately.
		if (!$(this).children('ul').length)
			$(this).children().andSelf().removeClass('hove');

		// Are we leaving the menu entirely, and thus triggering the time
		// threshold, or are we just switching to another menu item?
		var id = this.id;
		$(e.relatedTarget).closest('.menu').length ?
			menu_hide_children(id) :
			menu_delay[id.slice(2)] = setTimeout(function () { menu_hide_children(id); }, 250);
	},

	// Hide all children menus.
	menu_hide_children = function (id)
	{
		$('#' + id).children().andSelf().removeClass('hove').find('ul').css({ visibility: 'hidden' }).css(is_ie8down ? '' : 'opacity', 0);
	};

	this.each(function () {
		var $elem = $(this);
		$elem.find('li').each(function () {
			$(this).attr('id', 'li' + menu_baseId++)
				.on('mouseenter focus', menu_show_me)
				.on('mouseleave blur', menu_hide_me)
				// Disable double clicks...
				.mousedown(false)
				// Clicking a link will immediately close the menu -- giving a feeling of responsiveness.
				.has('>a,>h4>a')
				.click(function () {
					$('.hove').removeClass('hove');
					$elem.find('ul').css({ visibility: 'hidden' }).css(is_ie8down ? '' : 'opacity', 0);
				});
		});
	});
};


/**
 * Mini-menu (mime) plugin. Yay.
 * Supposed to be generic, but good luck using it in plugins...
 */

$.fn.mime = function (oList, oStrings)
{
	this.each(function ()
	{
		if ($(this).parent().hasClass('mime'))
			return;

		var
			$mime = $(this),
			id = $mime.data('id') || ($mime.closest('.msg').attr('id') || '').slice(3), // Extract the context id from the parent message
			$men = $('<div class="mimenu"><ul class="actions"></ul></div>').hide(),
			pms;

		$.each(oList ? oList[id] : [], function ()
		{
			pms = oStrings[this.slice(0, 2)];

			$('<a>')
				.html(pms[0].wereplace({ 1: id, 2: this.slice(3) }))
				.attr('title', pms[1])
				.attr('class', pms[3])
				.attr('href', pms[2] ? (pms[2][0] == '?' ? $mime.attr('href') || '' : '') + pms[2].wereplace({ 1: id, 2: this.slice(3) }) : $mime.attr('href') || '')
				.click(new Function('e', pms[4] ? pms[4].wereplace({ 1: id, 2: this.slice(3) }) : '')) // eval, bad! No user input, good!
				.click(function () { $men.stop(true).animate(hiddenPosition, 200, function () { $men.hide(); }); }) // Close menu if clicked.
				.wrap('<li>').parent()
				.appendTo($men.find('ul'));
		});

		$mime.wrap('<span class="mime"></span>').after($men).parent().hover(
			function () { $men.stop(true).show().animate(visiblePosition, 300, function () { $men.css('overflow', 'visible'); }); },
			function () { $men.stop(true).animate(hiddenPosition, 200, function () { $men.hide(); }); }
		);

		var
			wi = $men.width(),
			he = $men.height(),

			// If we start from halfway into it, the animation looks nicer.
			hiddenPosition = {
				opacity: 0,
				width:  wi / 2,
				height: he / 2,
				paddingTop: 0
			},
			visiblePosition = {
				opacity: 1,
				width: wi,
				height: he,
				paddingTop: $men.css('paddingTop')
			};

		$men.css(hiddenPosition).toggleClass('right', $mime.offset().left > $(window).width() / 2);
	});
};


/**
 * ready()
 * This function is important. It loads as soon as the DOM is built, i.e. after everything's loaded.
 */

$(function ()
{
	breakLinks();

	// Transform existing select boxes into our super boxes.
	$('select').sb();

	// Save a copy of our untreated menu, for responsiveness.
	$('#main_menu').clone().removeClass('css menu').attr('id', 'sidemenu').prependTo('#sidebar>div');

	// Now replace our pure CSS menus with JS-powered versions.
	$('.menu').removeClass('css').mm();

	// Bind all delayed inline events to their respective DOM elements.
	$('*[data-eve]').each(function ()
	{
		var that = $(this);
		$.each(that.attr('data-eve').split(' '), function () {
			that.on(eves[this][0], eves[this][1]);
		});
	});

	if (is_touch)
	{
		// Disable parent links on hover-impaired browsers.
		$('.umme,.subsection>a,.menu>li:not(.nodrop)>h4>a').click(false);

		// Disable zooming when focusing an input box or textarea.
		var meta = $('meta[name=viewport]'), initial_meta = meta.attr('content');

		$('input,textarea')
			.focus(function () { meta.attr('content', initial_meta + ',maximum-scale=1,user-scalable=0'); })
			.blur(function () { meta.attr('content', initial_meta); });
	}

	var
		orig_sid,
		orig_wid,
		sidebar_on_right,
		old_y = 0,
		sidebar_shown = false,
		do_hardware,

		// $main is the first child of the sidebar container that isn't the sidebar.
		// Usually, it should be #main or #offside.
		$edge = $('#edge'),
		$main = $edge.children().not('#sidebar').first(),

		show_sidebar = function ()
		{
			// Don't show the sidebar if it's already visible.
			if (sidebar_shown || $('#sideshow').is(':hidden'))
				return true;

			orig_wid = $main.width();
			orig_sid = parseInt($edge.css('left')) || 0;
			sidebar_shown = true;

			$main.width(orig_wid);
			$('#sidebar').css('display', $main.css('display'));
			$('#sidebar>div').css('margin-top', $(window).scrollTop() > $('#sidebar').offset().top ? Math.min(
				$('#sidebar').height() - $('#sidebar>div').height(),
				$(window).scrollTop() - $('#sidebar').offset().top
			) : 0);

			$(document).on('mousedown.sw', function (e) {
				// HTML implies user clicked on a scrollbar, or at least outside the HTML contents.
				if (!$(e.target).closest('#sidebar').length && e.target.tagName != 'HTML')
					hide_sidebar();
			});

			sidebar_on_right = $('#sidebar').offset().left > $main.offset().left;
			$edge.css({ left: orig_sid - (sidebar_on_right ? 0 : $('#sidebar').width()) });

			// Can't hard-scroll on skins that have the HTML for the side button inside the sidebar container.
			if (!$('#sideshow').closest('#edge').length)
				$edge.css({ transform: 'translate3d(' + (sidebar_on_right ? '-' : '') + $('#sidebar').width() + 'px,0,0)' });

			// And can't hard-scroll on some browsers, like IE < 10.
			do_hardware = $edge.css('transform') != 'none';
			if (!do_hardware)
				$edge.stop(true).animate({ left: orig_sid - (sidebar_on_right ? $('#sidebar').width() : 0) }, 500);

			$(window).on('resize.sw', function () {
				// Fix the sidebar position if the window has just been enlarged.
				if (sidebar_shown && $('#sideshow').is(':hidden'))
					hide_sidebar_for_real();
			});
		},
		hide_sidebar_for_real = function ()
		{
			sidebar_shown = false;
			// Remove the style attributes, reset everything and disable hardware acceleration.
			$('#sidebar>div').attr('style', '');
			$('#sidebar').attr('style', '');
			$edge.attr('style', '');
			$main.width('');
			$(window).off('.sw');
			$(document).off('.sw');
		},
		hide_sidebar = function ()
		{
			if (do_hardware)
			{
				// Two alternatives, for completeness: (1) $edge.one('transitionend', hide_sidebar_for_real) is clean, but reportedly not supported by webOS.
				// (2) the following is bad-ass, as it allows changing the value from within CSS, but it's also a bit overkill... Innit?
				// setTimeout(hide_sidebar_for_real, (parseFloat($edge.css('transition-duration')) || .5) * ($edge.css('transition-duration').indexOf('m') == -1 ? 1000 : 1));
				setTimeout(hide_sidebar_for_real, 500);
				$edge.css({ transform: 'none' });
			}
			else
				$edge.stop(true).animate({ left: orig_sid - (sidebar_on_right ? 0 : $('#sidebar').width())}, 500, hide_sidebar_for_real);
		};

	$(document).on(is_ff ? 'mouseup' : 'mousedown', function (e) {
		// Catch the wheel button (or middle-click), and if it's not attempting to open a link, toggle the sidebar.
		if (e.which == 2 && e.target.tagName !== 'A' && !$('#sideshow').is(':hidden'))
		{
			sidebar_shown ? hide_sidebar() : show_sidebar();
			return false;
		}
	});

	$('<div/>')
		.attr('id', 'sideshow')
		.attr('title', $txt['sideshow'])
		.click(function () { sidebar_shown ? hide_sidebar() : show_sidebar(); })
		.append('<div/><div/><div/>')
		.prependTo('#top_section>div');
});

/**
 * load()
 * This is the list of non-critical functions that should be executed once the DOM is fully loaded, including images.
 */

$(window).load(function ()
{
	$('#upshrink').attr('title', $txt['upshrink_description']);

	// You may change the ID names for the elements in the index template,
	// but you'll have to add_js() the code below, with the new IDs in place.
	new weToggle({
		isCollapsed: !!window.we_colhead,
		aSwapContainers: ['upper_section'],
		aSwapImages: ['upshrink'],
		sOption: 'collapse_header'
	});

	// Show a pop-up with more options when focusing the quick search box.
	var opened, $pop = $('<div class="mimenu right">').appendTo($('#search_form').addClass('mime'));
	$('#search_form .search').focus(function ()
	{
		if (opened)
			return;
		$pop.load(weUrl('action=search' + (window.we_topic ? ';topic=' + we_topic : '') + (window.we_board ? ';board=' + we_board : '')), function () {
			$pop.hide().css('top', 0).animate({
				opacity: 'toggle',
				top: '100%'
			}).find('select').sb();
		});
		opened = true;
		$(document).on('click.sf', function (e) {
			if ($(e.target).closest('#search_form').length)
				return;
			opened = false;
			$(document).off('.sf');
			$pop.css('top', '100%').animate({
				opacity: 'toggle',
				top: '0%'
			});
		}).on('keyup.sf', function (e) {
			// keydown target holds previous element, keyup holds next one. Found this by myself, eheh.
			if (e.altKey || e.ctrlKey || e.keyCode != 9 || $(e.target).closest('#search_form').length)
				return;
			opened = false;
			$(document).off('.sf');
			$pop.css('top', '100%').animate({
				opacity: 'toggle',
				top: '0%'
			});
		});
	});
});


/**
 * UI for notifications.
 * Thanks to Dragooon for the initial implementation!
 */

@if member
	$(function ()
	{
		var
			is_up_to_date = false,
			is_pm_up_to_date = false,
			is_opened = false,
			is_pm_opened = false,
			original_title = document.title,
			$shade = $('<div/>').addClass('mimenu').appendTo('#notifs'),
			$pmshade = $('<div/>').addClass('mimenu').appendTo('#pms'),

			toggle_me = function ()
			{
				is_opened = !is_opened;
				$shade.toggleClass('open'); // should work, otherwise use $shade[is_opened ? 'show' : 'hide']('fast');
				$('#notifs').toggleClass('hover');

				// Hide popup when clicking elsewhere.
				$(document).off('click.no');
				if (!is_opened) // skipping the 'return' compresses badly. sigh.
					return;
				$(document).on('click.no', function (e)
				{
					if ($(e.target).closest('#notifs').length)
						return;
					is_opened = !is_opened;
					$shade.toggleClass('open');
					$('#notifs').toggleClass('hover');
					$(document).off('click.no');
				});
			},

			toggle_me_pm = function ()
			{
				is_pm_opened = !is_pm_opened;
				$pmshade.toggleClass('open');
				$('#pms').toggleClass('hover');
				$(document).off('click.no');
				if (!is_pm_opened)
					return;
				$(document).on('click.no', function (e)
				{
					if ($(e.target).closest('#pms').length)
						return;
					is_pm_opened = !is_pm_opened;
					$pmshade.toggleClass('open');
					$('#pms').toggleClass('hover');
					$(document).off('click.no');
				});
			},

			pmload = function (url, toggle)
			{
				show_ajax('#pms', [0, 30]);
				$pmshade.load(url, function (data)
				{
					hide_ajax();
					$('#pm_container')
						.css('max-height', ($(window).height() - $('#pm_container').offset().top) * .9)
						.closest('ul')
						.css('max-width', $(window).width() * .95);

					$(this).find('.n_item').each(function ()
					{
						var that = $(this), id = that.attr('id').slice(2);

						$(this)
							.hover(function () { $(this).toggleClass('windowbg3').find('.n_read').toggle(); })
							.click(function ()
							{
								// Try to toggle the preview. If it doesn't exist, create it.
								if (!that.next('.n_prev').stop(true, true).slideToggle(600).length)
								{
									show_ajax(this);
									$.post(weUrl('action=pm;sa=ajax;preview=' + id), function (doc) {
										hide_ajax();
										$('<div/>').addClass('n_prev').html(doc).insertAfter(that).hide().slideToggle(600);

										if (that.hasClass('n_new'))
										{
											that.removeClass('n_new');
											we_pms--;
											$pmshade.prev().attr('class', we_pms > 0 ? 'note' : 'notevoid').text(we_pms);
										}
									});
								}
							})

							.find('.n_read')
							.hover(function () { $(this).toggleClass('windowbg'); })
							.click(function (e)
							{
								var was_new = that.hasClass('n_new');

								that.removeClass('n_new').next('.n_prev').andSelf().hide(300, function () { $(this).remove(); });
								if (was_new)
								{
									we_pms--;
									$pmshade.prev().attr('class', we_pms > 0 ? 'note' : 'notevoid').text(we_pms);
								}

								// Cancel the implied click on the parent.
								e.stopImmediatePropagation();
								return false;
							});
					});

					if (toggle)
						toggle_me_pm();
				});
			};

		notload = function (url, toggle)
		{
			show_ajax('#notifs', [0, 30]);
			$shade.load(url, function (data)
			{
				hide_ajax();
				$('#n_container')
					.css('max-height', ($(window).height() - $('#n_container').offset().top) * .9)
					.closest('ul')
					.css('max-width', $(window).width() * .95);

				$(this).find('.n_item').each(function ()
				{
					var that = $(this), id = that.attr('id').slice(3);

					$(this)
						.hover(function () { $(this).toggleClass('windowbg3').find('.n_read').toggle(); })
						.click(function ()
						{
							// Try to toggle the preview. If it doesn't exist, create it.
							if (!that.next('.n_prev').stop(true, true).slideToggle(600).length)
							{
								show_ajax(this);
								$.post(weUrl('action=notification;sa=preview;in=' + id), function (doc) {
									hide_ajax();
									$('<div/>').addClass('n_prev').html(doc).insertAfter(that).hide().slideToggle(600);

									if (that.hasClass('n_new'))
									{
										that.removeClass('n_new');
										we_notifs--;
										$shade.prev().attr('class', we_notifs > 0 ? 'note' : 'notevoid').text(we_notifs);
										document.title = (we_notifs > 0 ? '(' + we_notifs + ') ' : '') + original_title;

										$.post(weUrl('action=notification;sa=markread;in=' + id));
									}
								});
							}
						})

						.find('.n_read')
						.hover(function () { $(this).toggleClass('windowbg'); })
						.click(function (e)
						{
							var was_new = that.hasClass('n_new');

							that.removeClass('n_new').next('.n_prev').andSelf().hide(300, function () { $(this).remove(); });
							if (was_new)
							{
								we_notifs--;
								$shade.prev().attr('class', we_notifs > 0 ? 'note' : 'notevoid').text(we_notifs);
								document.title = (we_notifs > 0 ? '(' + we_notifs + ') ' : '') + original_title;

								$.post(weUrl('action=notification;sa=markread;in=' + id));
							}

							// Cancel the implied click on the parent.
							e.stopImmediatePropagation();
							return false;
						});
				});

				if (toggle)
					toggle_me();
			});
		};

		$('#notifs').click(function (e)
		{
			if (e.target != this)
				return true;

			if (is_pm_opened)
				toggle_me_pm();

			if (!is_up_to_date)
			{
				notload(weUrl('action=notification'), true);
				is_up_to_date = true;
			}
			else
				toggle_me();
		});

		$('#pms').click(function (e)
		{
			if (e.target != this)
				return true;

			if (is_opened)
				toggle_me();

			if (!is_pm_up_to_date)
			{
				// Multiple things go back to PMs via AJAX. We want to be explicit to keep the PM code simpler...
				pmload(weUrl('action=pm;sa=ajax'), true);
				is_pm_up_to_date = true;
			}
			else
				toggle_me_pm();
		});

		// Update the notification count...
		var auto_update = function ()
		{
			$.post(weUrl('action=notification;sa=unread'), function (count)
			{
				// The response is x;y where x = notifications, y = unread PMs
				count = count.split(';');
				if (count[0] !== '' && count[0] != window.we_notifs)
				{
					we_notifs = count[0];
					is_up_to_date = false;
					$shade.prev().attr('class', we_notifs > 0 ? 'note' : 'notevoid').text(we_notifs);
					document.title = (we_notifs > 0 ? '(' + we_notifs + ') ' : '') + original_title;
				}
				if (count[1] !== '-1' && count[1] != window.we_pms)
				{
					we_pms = items[1];
					is_pm_up_to_date = false;
					$pmshade.prev().attr('class', we_pms > 0 ? 'note' : 'notevoid').text(we_pms);
				}
			});

			setTimeout(auto_update, document.hidden || document.webkitHidden || document.mozHidden || document.msHidden || is_ie8down ? 600000 : 60000);
		};

		// Call this every minute or 10 minutes, depending on page visibility. Note that old browsers will call every minute on every tab... Not good :-/
		setTimeout(auto_update, document.hidden || document.webkitHidden || document.mozHidden || document.msHidden || is_ie8down ? 600000 : 60000);
	});
@endif


// *** weToggle class.
function weToggle(opt)
{
	var
		that = this,
		collapsed = false,
		toggle_me = function () {
			$(this).data('that').toggle();
			this.blur();
			return false;
		};

	// Change State - collapse or expand the section.
	this.cs = function (bCollapse, bInit)
	{
		// Handle custom function hook before collapse.
		if (!bInit && bCollapse && opt.onCollapse)
			opt.onCollapse.call(this);

		// Handle custom function hook before expand.
		else if (!bInit && !bCollapse && opt.onExpand)
			opt.onExpand.call(this);

		// Loop through all the images that need to be toggled.
		$.each(opt.aSwapImages || [], function () {
			$('#' + this).toggleClass('fold', !bCollapse).attr('title', opt.title || $txt['upshrink_description']);
		});

		// Now go through all the sections to be collapsed.
		$.each(opt.aSwapContainers || [], function () {
			$('#' + this)[bCollapse ? 'slideUp' : 'slideDown'](bInit ? 0 : 250);
		});

		// Update the new state.
		collapsed = +bCollapse;

		@if guest
			// Update the cookie, if desired.
			if (opt.sOption)
				document.cookie = opt.sOption + '=' + collapsed;
		@else
			// Set a theme option through javascript.
			if (!bInit && opt.sOption)
				$.post(weUrl('action=jsoption;' + we_sessvar + '=' + we_sessid + (opt.sExtra || '')), { v: opt.sOption, val: collapsed });
		@endif
	};

	// Reverse the current state.
	this.toggle = function ()
	{
		this.cs(!collapsed);
	};

	// Note that this is only used in stats.js...
	this.opt = opt;

	// If the init state is set to be collapsed, collapse it.
	// If cookies are enabled and our toggler cookie is set to '1', override the initial state.
	// Note: the cookie retrieval code is below, you can turn it into a function by replacing opt.sCookie with a param.
	// It's not used anywhere else in Wedge, which is why we won't bother with a weCookie object.
	if (@if (member) opt.isCollapsed @else opt.sCookie && document.cookie.search('\\b' + opt.sCookie + '\\s*=\\s*1\\b') != -1 @endif)
		this.cs(true, true);

	// Initialize the images to be clickable.
	$.each(opt.aSwapImages || [], function () {
		$('#' + this).show().data('that', that).click(toggle_me).css({ visibility: 'visible' }).css('cursor', 'pointer').mousedown(false);
	});

	// Initialize links.
	$.each(opt.aSwapLinks || [], function () {
		$('#' + this).show().data('that', that).click(toggle_me);
	});
}


// *** JumpTo class.
function JumpTo(control)
{
	$('#' + control)
		.html('<select><option data-hide>=> ' + $('#' + control).text() + '</option></select>')
		.css({ visibility: 'visible' })
		.find('select').sb().focus(function ()
		{
			var sList = '', $val;

			show_ajax();

			// Fill the select box with entries loaded through Ajax.
			$.post(
				weUrl('action=ajax;sa=jumpto' + (window.we_board ? ';board=' + we_board : '')),
				function (board_list)
				{
					$.each(board_list, function ()
					{
						// Just for the record, we don't NEED to close the optgroup at the end
						// of the list, even if it doesn't feel right. Saves us a few bytes...
						if (this.id) // Show the board option, with special treatment for the current one.
							sList += '<option value="' + this.id + '"'
									+ (this.id == 'skip' ? ' disabled>=> ' + this.name + ' &lt;=' :
										'>' + new Array(+this.level + 1).join('&nbsp;&nbsp;&nbsp;&nbsp;') + this.name)
									+ '</option>';
						else // Category?
							sList += '<optgroup label="' + this.name + '">';
					});

					// Add the remaining items after the currently selected item.
					$('#' + control).find('select').off('focus').append(sList).sb().change(function () {
						location = parseInt($val = $(this).val()) ? weUrl('board=' + $val + '.0') : $val;
					});
					hide_ajax();
				}
			);
		});
}


// *** Thought class.
@if member
	function Thought(privacies)
	{
		var
			oid,

			// Make that personal text editable (again)!
			cancel = function () {
				$('#thought_form').siblings().show().end().remove();
			};

		// Show the input after the user has clicked the text.
		this.edit = function (tid, mid, is_new)
		{
			cancel();

			var
				thought = $('#thought' + tid), edited_thought = thought.find('span').first().html(),
				pr = '', privacy = (thought.data('prv') + '').split(','),

				cur_text = is_new ? '' : (edited_thought.indexOf('<') == -1 ?
					edited_thought.php_unhtmlspecialchars() : $.ajax(weUrl('action=ajax;sa=thought') + ';in=' + tid, { async: false }).responseText), p;

			oid = is_new ? 0 : thought.data('oid') || 0;

			for (p in privacies)
				pr += '<option value="' + privacies[p][0] + '"' + (in_array(privacies[p][0] + '', privacy) ? ' selected' : '') + '>&lt;div class="privacy_' + privacies[p][1] + '"&gt;&lt;/div&gt;' + privacies[p][2] + '</option>';

			// Hide current thought, and add tools to write new thought.
			thought.toggle(is_new && is_new !== 1).after('<form id="thought_form"><input type="text" maxlength="255" id="ntho"><select id="npriv">'
				+ pr + '</select><input type="submit" class="save"><input type="button" class="cancel"></form>');
			$('#npriv')
				.next().val(we_submit).click(function () { return oThought.submit(tid, mid || tid); })	// Save button
				.next().val(we_cancel).click(cancel);													// Cancel button
			$('#ntho').focus().val(cur_text);
			$('#npriv').sb();

			return false;
		};

		// Event handler for personal text requests.
		this.personal = function (tid)
		{
			$.post(
				weUrl('action=ajax;sa=thought') + ';in=' + tid + ';personal'
			);

			return false;
		};

		this.like = function (tid)
		{
			var $thoughts = $('#thought' + tid).closest('.thoughts');
			show_ajax();

			$.post(
				weUrl('action=ajax;sa=thought') + ';like;' + we_sessvar + '=' + we_sessid,
				{
					cx: $thoughts.data('cx'),
					oid: tid
				},
				function (response)
				{
					$thoughts.html(response);
					hide_ajax();
				}
			);

			return false;
		};

		// Event handler for removal requests.
		this.remove = function (tid)
		{
			var $thoughts = $('#thought' + tid).closest('.thoughts');
			show_ajax();

			$.post(
				weUrl('action=ajax;sa=thought'),
				{
					cx: $thoughts.data('cx'),
					oid: $('#thought' + tid).data('oid')
				},
				function (response)
				{
					$thoughts.html(response);
					hide_ajax();
				}
			);

			return false;
		};

		// Event handler for clicking submit.
		this.submit = function (tid, mid)
		{
			var $thoughts = $('#thought' + tid).closest('.thoughts');
			show_ajax();

			$.post(
				weUrl('action=ajax;sa=thought'),
				{
					// Context array: thought table type (latest, thread, profile),
					// type-related context variable, and page number.
					cx: $thoughts.data('cx'),
					oid: oid,
					parent: tid,
					master: mid,
					privacy: $('#npriv').val(),
					text: $('#ntho').val()
				},
				function (response)
				{
					$thoughts.html(response);
					hide_ajax();
					cancel();
				}
			);

			return false;
		};

		$('#thought0')
			.click(function () { oThought.edit(0, 0, 1); })
			.find('span').html($txt['add_thought']);
	}
@endif

/* Optimize:
_formSubmitted = _f
_modalDone = _c
*/
