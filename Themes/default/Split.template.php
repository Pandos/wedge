<?php
/**
 * Wedge
 *
 * The interface for splitting topics.
 *
 * @package wedge
 * @copyright 2010-2012 Wedgeward, wedge.org
 * @license http://wedge.org/license/
 *
 * @version 0.1
 */

function template_ask()
{
	global $context, $theme, $options, $txt;

	echo '
	<div id="split_topics">
		<form action="<URL>?action=splittopics;sa=execute;topic=', $context['current_topic'], '.0" method="post" accept-charset="UTF-8">
			<input type="hidden" name="at" value="', $context['message']['id'], '">
			<we:cat>
				', $txt['split'], '
			</we:cat>
			<div class="windowbg wrc">
				<p class="split_topics">
					<label><strong>', $txt['subject_new_topic'], ':</strong>
					<input type="text" name="subname" id="subname" value="', $context['message']['subject'], '" size="25"></label>
				</p>
				<ul class="reset split_topics">
					<li>
						<label><input type="radio" id="onlythis" name="step2" value="onlythis" checked> ', $txt['split_this_post'], '</label>
					</li>
					<li>
						<label><input type="radio" id="afterthis" name="step2" value="afterthis"> ', $txt['split_after_and_this_post'], '</label>
					</li>
					<li>
						<label><input type="radio" id="selective" name="step2" value="selective"> ', $txt['select_split_posts'], '</label>
					</li>
				</ul>
				<div class="right">
					<input type="submit" value="', $txt['split'], '" class="submit">
				</div>
			</div>
			<input type="hidden" name="', $context['session_var'], '" value="', $context['session_id'], '">
		</form>
	</div>';
}

function template_main()
{
	global $context, $theme, $options, $txt;

	echo '
	<div id="split_topics">
		<we:cat>
			', $txt['split'], '
		</we:cat>
		<div class="windowbg wrc">
			<p>', $txt['split_successful'], '</p>
			<ul class="reset">
				<li>
					<a href="<URL>?board=', $context['current_board'], '.0">', $txt['message_index'], '</a>
				</li>
				<li>
					<a href="<URL>?topic=', $context['old_topic'], '.0">', $txt['origin_topic'], '</a>
				</li>
				<li>
					<a href="<URL>?topic=', $context['new_topic'], '.0">', $txt['new_topic'], '</a>
				</li>
			</ul>
		</div>
	</div>';
}

function template_select()
{
	global $context, $theme, $options, $txt;

	echo '
	<div id="split_topics">
		<form action="<URL>?action=splittopics;sa=splitSelection;board=', $context['current_board'], '.0" method="post" accept-charset="UTF-8">
			<div id="not_selected" class="floatleft">
				<we:cat>
					', $txt['split'], ' - ', $txt['select_split_posts'], '
				</we:cat>
				<div class="information">
					', $txt['please_select_split'], '
				</div>
				<div class="pagesection">
					<nav>', $txt['pages'], ': <span id="pageindex_not_selected">', $context['not_selected']['page_index'], '</span></nav>
				</div>
				<ul id="messages_not_selected" class="split_messages smalltext reset">';

	foreach ($context['not_selected']['messages'] as $message)
		echo '
					<li id="not_selected_', $message['id'], '"><div class="windowbg', $message['alternate'] ? '2' : '', ' wrc">
						<div class="message_header">
							<a class="split_icon floatright" href="<URL>?action=splittopics;sa=selectTopics;subname=', $context['topic']['subject'], ';topic=', $context['topic']['id'], '.', $context['not_selected']['start'], ';start2=', $context['selected']['start'], ';move=down;msg=', $message['id'], '" onclick="return select(\'down\', ', $message['id'], ');"><img src="', $theme['images_url'], '/split_select.gif" alt="-&gt;"></a>
							<strong>', $message['subject'], '</strong> ', $txt['by'], ' <strong>', $message['poster'], '</strong><br>
							<em>', $message['time'], '</em>
						</div>
						<div class="post">', $message['body'], '</div>
					</div></li>';

	echo '
					<li class="dummy"></li>
				</ul>
			</div>
			<div id="selected" class="floatright">
				<we:cat>
					', $txt['split_selected_posts'], ' (<a href="<URL>?action=splittopics;sa=selectTopics;subname=', $context['topic']['subject'], ';topic=', $context['topic']['id'], '.', $context['not_selected']['start'], ';start2=', $context['selected']['start'], ';move=reset;msg=0" onclick="return select(\'reset\', 0);">', $txt['split_reset_selection'], '</a>)
				</we:cat>
				<div class="information">
					', $txt['split_selected_posts_desc'], '
				</div>
				<div class="pagesection">
					<nav>', $txt['pages'], ': <span id="pageindex_selected">', $context['selected']['page_index'], '</span></nav>
				</div>
				<ul id="messages_selected" class="split_messages smalltext reset">';

	if (!empty($context['selected']['messages']))
		foreach ($context['selected']['messages'] as $message)
			echo '
					<li id="selected_', $message['id'], '"><div class="windowbg', $message['alternate'] ? '2' : '', ' wrc">
						<div class="message_header">
							<a class="split_icon floatleft" href="<URL>?action=splittopics;sa=selectTopics;subname=', $context['topic']['subject'], ';topic=', $context['topic']['id'], '.', $context['not_selected']['start'], ';start2=', $context['selected']['start'], ';move=up;msg=', $message['id'], '" onclick="return select(\'up\', ', $message['id'], ');"><img src="', $theme['images_url'], '/split_deselect.gif" alt="&lt;-"></a>
							<strong>', $message['subject'], '</strong> ', $txt['by'], ' <strong>', $message['poster'], '</strong><br>
							<em>', $message['time'], '</em>
						</div>
						<div class="post">', $message['body'], '</div>
					</div></li>';

	echo '
					<li class="dummy"></li>
				</ul>
			</div>
			<br class="clear">
			<p>
				<input type="hidden" name="topic" value="', $context['current_topic'], '">
				<input type="hidden" name="subname" value="', $context['new_subject'], '">
				<input type="submit" value="', $txt['split'], '" class="submit">
				<input type="hidden" name="', $context['session_var'], '" value="', $context['session_id'], '">
			</p>
		</form>
	</div>
	<br class="clear">';

	add_js('
	var start = [', $context['not_selected']['start'], ', ', $context['selected']['start'], '];

	function select(direction, msg_id)
	{
		$.get(weUrl("action=splittopics;sa=selectTopics;subname=', $context['topic']['subject'], ';topic=', $context['topic']['id'], '." + start[0] + ";start2=" + start[1] + ";move=" + direction + ";msg=" + msg_id), onDocReceived);
		return false;
	}
	function onDocReceived(XMLDoc)
	{
		$("pageIndex", XMLDoc).each(function (i) {
			$("#pageindex_" + this.getAttribute("section")).html($(this).text());
			start[i] = this.getAttribute("startFrom");
		});

		$("change", XMLDoc).each(function () {
			var
				curId = this.getAttribute("id"),
				curSection = this.getAttribute("section"),
				curList = $("#messages_" + curSection),
				is_selected = curSection == "selected",
				sInsertBeforeId = "";

			if (this.getAttribute("curAction") === "remove")
				$("#" + curSection + "_" + curId).remove();

			// Insert a message.
			else
			{
				// Loop through the list to try and find an item to insert after.
				curList.find("li > div").each(function () {
					var p = parseInt(this.parentNode.id.substr(curSection.length + 1));
					if (p < curId)
					{
						// This would be a nice place to insert the row.
						sInsertBeforeId = "#" + this.parentNode.id;
						// We\'re done for now. Escape the loop.
						return false;
					}
				});

				// Let\'s create a nice container for the message.
				var newItem = $("<div></div>").html("\
	<div class=\\"message_header\\">\
		<a class=\\"split_icon float" + (is_selected ? "left" : "right") + "\\" href=\\"" + weUrl("action=splittopics;sa=selectTopics;subname=', $context['topic']['subject'], ';topic=', $context['topic']['id'], '.', $context['not_selected']['start'], ';start2=', $context['selected']['start'], ';move=" + (is_selected ? "up" : "down") + ";msg=" + curId) + "\\" onclick=\\"return select(\'" + (is_selected ? "up" : "down") + "\', " + curId + ");\\">\
			<img src=\\"', $theme['images_url'], '/split_" + (is_selected ? "de" : "") + "select.gif\\" alt=\\"" + (is_selected ? "&lt;-" : "-&gt;") + "\\">\
		</a>\
		<strong>" + $("subject", this).text() + "</strong> ', $txt['by'], ' <strong>" + $("poster", this).text() + "</strong>\
		<br><em>" + $("time", this).text() + "</em>\
	</div>\
	<div class=\\"post\\">" + $("body", this).text() + "</div>");

				// So, where do we insert it?
				if (sInsertBeforeId)
					newItem.insertBefore(sInsertBeforeId);
				// By default, insert the element at the end of the list.
				else
					newItem.appendTo(curList);
				newItem.wrap("<li id=\"" + curSection + "_" + curId + "\"></li>");
			}
		});

		// After all changes, make sure the window backgrounds are still correct for both lists.
		var bAlt, fAlt = function () {
			this.className = "wrc windowbg" + (bAlt ? "2" : "");
			bAlt = !bAlt;
		};
		bAlt = false; $("#messages_selected li > div").each(fAlt);
		bAlt = false; $("#messages_not_selected li > div").each(fAlt);
	}');
}

?>