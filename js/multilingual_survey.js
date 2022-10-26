var Multilingual = (function(){
	//load languages
	var pdf_url = 'REDCAP_PDF_URL';
	var ajax_url = 'REDCAP_AJAX_URL';
	var langVar = 'REDCAP_LANGUAGE_VARIABLE';
	var instrument_name = 'REDCAP_INSTRUMENT_NAME';
	var record_id = 'MULTILINGUAL_RECORD_ID';
	var event_id = 'MULTILINGUAL_SURVEY_EVENT';
	
	//get language choice from url
	getURLLanguage();
	
	var project_id = getVariable('pid');
	//var languages = {1: 'en', 2: 'es', 3: 'fr'};
	var languages = {1: 'en', 2: 'es'};
	var totalLanguages = 2;
	var settings = {};
	settings['empty'] = true;
	loadSettings();
	var lang = 'en';
	var langReady = 0;
	var interval = null;
	var translations = {};
	var errorChecking = 0;
	var anyTranslated = false;
	var matrixProcessed = {};
	var settingsRetrieved = false;
	var languagesRetrieved = false;
	
	if (typeof form_settings == "undefined")
		var form_settings;
	
	var debugging = false;
	function log(arg1, arg2) {
		if (!debugging)
			return;
		console.log(arg1, arg2);
	}
	
	//document ready change language
	$( document ).ready(function(){
		setNormalCookie('p1000pid', pid, .04);
		
		// listen for translations
		translateReady();
		
		//change out text for symbols
		symbols();

		//link to change
		$('#surveytitle').parent().append(' <div id="changeLang" style="display:none;">' + lang + '</div>');
		
		//click function
		$('body').on('click', '.setLangButtons', function(){
			var tmp = $(this).attr('name');
			onLanguageSelect(tmp);
			getLanguage(tmp);
		});

		$('body').on('click', '#changeLang', function(){
			if(langReady == 2){
				$('#changeLang').css('background','#505050');
				$('#changeLang').css('color','#CCCCCC');
				$('#changeLang').css('opacity','0.5');
				
				//if show start screen is checked, show all languages when changing language
				if(settings['show-start-screen'] == true){
					$('#p1000Overlay').show();
					$('#p1000ChooseLang').show();
					
					if($('#p1000ChooseLang').html() == ''){
						addLanguageButtons();
						if(settings['start-screen-width'] && settings['start-screen-width']){
							$('#p1000ChooseLang').css('width', settings['start-screen-width']);
						}
					}
				}
				else{
					langReady = 0;
					var id;
					for(id in languages){
						if(languages[id] == lang){
							break;
						}
					}
					id++;
					if(id == (totalLanguages + 1)){
						id = 1;
					}
					getLanguage(languages[id]);
				}
			}
		});

		//signature and file upload dialogs
		$('body').on('click', '.fileuploadlink', function(){
			
			if (form_settings) {
				
			} else {
				var id = $(this).parent().parent().parent().attr('id').replace('-tr','');

				setTimeout(function(){
					log('doc ready timeout 500 firing')
					$('#field_name_popup').html('<b>' + translations['questions'][id]['text'] + '</b>');
					$('#signature-div-actions').children('button').html('&#x2714;');
					$('#f1_upload_form').children().first().html('');
					$('#f1_upload_form').children('input').val("✔");
					$('.ui-dialog-title').each(function(){
						if($(this).is(':visible')){
							$(this).html('<span style="font-size:25px;font-weight:bold;">+</span>');
						}
					});

					if(translations['answers'][id]['type'] == 'signature'){
						//signature error messages
						$('body').on('click', 'button', function a1(){
							$('body').off('click', 'button', a1);
							setTimeout(function(){
								log('doc ready timeout 10 firing')
								$('.ui-dialog-title').each(function(){
									if($(this).is(':visible') && $(this).html() == 'ERROR'){
										$(this).html('<span style="font-size:20px;font-weight:bold;">&#x26a0;</span>');
										if(translations['errors'][id]['text']){
											$(this).parent().next().html(translations['errors'][id]['text']);
										}
										$(this).parent().next().next().children().children().html("✔");
										return;
									}
								});
							}, 10);
						});
					}
					else{
						//file upload error messages
						$('body').on('click', 'input[type="submit"]', function a2(){
							$('body').off('click', 'input[type="submit"]', a2);
							setTimeout(function(){
								log('doc ready timeout 10 firing')
								$('.ui-dialog-title').each(function(){
									if($(this).is(':visible') && $(this).html() == 'ERROR'){
										$(this).html('<span style="font-size:20px;font-weight:bold;">&#x26a0;</span>');
										if(translations['errors'][id]['text']){
											$(this).parent().next().html(translations['errors'][id]['text']);
										}
										$(this).parent().next().next().children().children().html("✔");
										return;
									}
								});
							}, 10);
						});
					}
				}, 500);
			}
		});

		//error messages (invalid input in text boxes)
		$('body').on('blur', 'input', function(){
			if(!$('#file_upload').is(':visible') && $(this).attr('name') != 'submit-btn-saveprevpage' && errorChecking != 1){
				errorChecking = 1;
				var id = $(this).parents('tr[sq_id]').attr('id');
				if(id != undefined){
					id = id.replace('-tr','');

					$('#redcapValidationErrorPopup').html('');
					setTimeout(function(){
						log('doc ready timeout 200 firing')
						if(translations && translations['errors'] && translations['errors'][id] && translations['errors'][id]['text'] != ''){
							$('#redcapValidationErrorPopup').html(translations['errors'][id]['text']);
						}
						else{
							$('#redcapValidationErrorPopup').html('<center><span style="color:red;font-size:50px;">&#x26D4;</span></center>');
						}
						//make sure stop action has not been called
						if(!$('#stopActionPrompt').is(':visible')){
							$('#redcapValidationErrorPopup').next().children().children().children().html('&#x2714;');
						}

						$('.ui-dialog-title').each(function(){
							if($(this).is(':visible')){
								$(this).children().html('<img alt="Page" src="APP_PATH_IMAGESexclamation_frame.png">');
							}
						});
						errorChecking = 0;
					}, 200);
				}
			}
		});

		//startUp
		$('body').append('<div id="p1000Overlay" style="text-align:center;vertical-align:middle;display:none;z-index:10000;position:fixed;top:0px;bottom:0px;right:0px;left:0px;background-color:rgba(0, 0, 0, 0.7);"><div id="closeOverlay" onclick="$(\'#p1000Overlay\').hide();">✖</div></div>');
		$('#p1000Overlay').append('<div id="p1000ChooseLang" style="display:none;position:fixed;top:50%;left:50%;transform: translate(-50%, -50%);width:;"></div>');
		
		// translate modals (form-specific)
		$('body').on('dialogopen', '.simpleDialog', function() {
			if (form_settings) {
				var modal = $("div.simpleDialog").parent();
				
				// translate erase signatures modal
				if ($(modal).find("div#resetSignatureValuesDialog").length) {
					// title
					$(modal).find('span.ui-dialog-title').html(form_settings.econsent.erase_title);
					// modal text
					$(modal).find(".ui-dialog-content").html(form_settings.econsent.erase_text);
					// erase button
					$(modal).find("div.ui-dialog-buttonset button").eq(1).html(form_settings.econsent.cancel_button);
					// cancel button
					$(modal).find("div.ui-dialog-buttonset button").eq(0).html(form_settings.econsent.erase_button);
				}
				
				if ($(modal).find("#signature-div:visible").length) {
					// title
					$(modal).find('span.ui-dialog-title').html(form_settings.field_level.add_signature);
					// modal text
					$(modal).find("div#field_name_popup").html(form_settings.field_level.signature_prompt);
					// cancel button
					$(modal).find("#signature-div-actions button").html(form_settings.field_level.save_signature);
					// reset link
					$(modal).find("#signature-div-actions a").html(form_settings.field_level.reset);
				}
				
				if ($(modal).find("#f1_upload_form:visible").length) {
					// title
					$(modal).find('span.ui-dialog-title').html(form_settings.field_level.upload_file);
					// modal text
					$(modal).find("div#field_name_popup").html(form_settings.field_level.upload_prompt1);
					// modal text 2
					$(modal).find("div#f1_upload_form div").eq(0).html(form_settings.field_level.upload_prompt2);
					// choose file button
					// $(modal).find("div#f1_upload_form input").eq(0).val(form_settings.field_level.choose_file);
					// no file chosen note
					
					// Upload file button text
					$(modal).find("#f1_upload_form button i")[0].nextSibling.textContent = " " + form_settings.field_level.upload_button;
					// max file size note
					$(modal).find("#f1_upload_form span").html(form_settings.field_level.max_size);
				}
			}
		});
	});
	
	function econsent_pdf(){
		var id = 0;
		for(id in languages){
			if(languages[id] == lang){
				break;
			}
		}
		
		//change iframe source
		$('iframe').each(function(){
			if($(this).attr('src').indexOf('compact=1') > -1){
				//log(pdf_url + '&langIndex=' + id + '&display=1');
				//$(this).attr('src', pdf_url + '&langIndex=' + id + '&display=1');
				$(this).src = pdf_url + '&langIndex=' + id + '&display=1';
				$(this).parent().attr('data', pdf_url + '&langIndex=' + id + '&display=1');
			}
		});
		
		//change econsent checkbox text
		if($('#econsent_confirm_checkbox_label').is(':visible')){
			for(id in settings['encoding-language']){
				if(settings['encoding-language'][id] == lang){
					break;
				}
			}
			
			if(settings['econsent-checkbox-text'][id]){
				$('#econsent_confirm_checkbox_label').html('<input type="checkbox" id="econsent_confirm_checkbox"> ' + settings['econsent-checkbox-text'][id]);
			}
		}
	}
	
	function getURLLanguage(){
		//use url
		if(getVariable(langVar)){
			setNormalCookie('p1000Lang', getVariable(langVar), .04);
			return;
		}
	}

	function loadSettings(){
		// Get Settings JSON
		var data = {};
		data['todo'] = 3;
		data['project_id'] = pid;
		var json = encodeURIComponent(JSON.stringify(data));

		// Get Languages JSON
		var data2 = {};
		data2['todo'] = 2;
		data2['project_id'] = pid;
		data2['field_name'] = langVar;
		var json2 = encodeURIComponent(JSON.stringify(data2));
		
		$.when(
			// Get Settings
			$.ajax({
				url: ajax_url,
				type: 'POST',
				data: 'data=' + json,
				success: function (r) {
					settings = r;
					if (settings['show-all-lang-buttons']) {
						addAllLangButtons();
					}
					settingsRetrieved = true;
					loadFormSettings();
				},
				error: function(jqXHR, textStatus, errorThrown) {
				   log(textStatus, errorThrown);
				}
			}),
			// Get Languages
			$.ajax({
				url: ajax_url,
				type: 'POST',
				data: 'data=' + json2,
				success: function (r) {
					languages = r;
					if (settings['show-all-lang-buttons']) {
						addAllLangButtons();
					}
					languagesRetrieved = true;
					totalLanguages = Object.keys(languages).length;
					getLanguage();
				},
				error: function(jqXHR, textStatus, errorThrown) {
				   log(textStatus, errorThrown);
				}
			})
		).then(function() {
			// Now that settings and language calls are complete process survey control text
			// log('settings', settings);
			
			// if only one language unhidden, translate using it
			var vis_langs = [];
			Object.values(languages).forEach(function(language, i) {
				if (langIsHidden(language) === false)
					vis_langs.push(language);
			});
			// log('vis_langs', vis_langs);
			if (vis_langs.length == 1) {
				getLanguage(vis_langs.pop());
				$(".setLangButtons").remove();
			}
			
			stopText();
			controlText();
			form_translate();
		});
	}

	function translatePopup(){
		log('translatePopup')
		if (form_settings) {
			if (!$('#reqPopup').length)
				return;
			var modal = $("#reqPopup").parent();
			
			// translate title
			$(modal).find('.ui-dialog-title').html(form_settings.field_level.modal_title);
			
			// translate modal text
			var modal_text = $(modal).find('.ui-dialog-content').html();
			var div_portion = modal_text.match(/(<div.*>)/gm);
				// replace bolded field labels
			for(var id in translations['defaults']) {
				if(div_portion.indexOf(translations['defaults'][id]) > -1){
					if(translations['questions'][id] != undefined){
						div_portion = div_portion.replace(translations['defaults'][id], translations['questions'][id]['text']);
					}
				}
			}
			$(modal).find('.ui-dialog-content').html(form_settings.field_level.instructions + div_portion);
			
			// translate Okay button
			$(modal).find("div.ui-dialog-buttonset button").eq(0).html(form_settings.field_level.modal_close);
			
		} else {
			var tmp = $('#reqPopup').html();
			if(tmp != undefined){
				tmp = tmp.replace('Your data was successfully saved, but you did not provide a value for some fields that require a value.', '');
				tmp = tmp.replace('Please enter a value for the fields on this page that are listed below.<br><br>','');
				tmp = tmp.replace('Provide a value for...<br>', '');

				//replace text
				var id;
				for(id in translations['defaults']){
					if(tmp.indexOf(translations['defaults'][id]) > -1){
						if(translations['questions'][id] != undefined){
							tmp = tmp.replace(translations['defaults'][id], translations['questions'][id]['text']);
						}
					}
				}

				$('#reqPopup').html(tmp);

				setTimeout(function(){
					log('translatePopup timeout 300 firing')
					$('#ui-id-1').html('<span style="font-size:20px;font-weight:bold;">&#x26a0;</span>');
					$('#ui-id-2').html('<span style="font-size:20px;font-weight:bold;">&#x26a0;</span>');
					$('.ui-dialog-title').each(function(){
						if($(this).is(':visible')){
							$(this).html('<span style="font-size:20px;font-weight:bold;">&#x26a0;</span>');
						}
					});
					$('#reqPopup').next().children().children().html('&#x2714;');
				}, 300);
			}
		}
	}

	//specific functions
	function symbols(){
		log('symbols()');
		//popup
		$('#redcapValidationErrorPopup').html('<center><span style="color:red;font-size:50px;">&#x26D4;</span></center>');

		//previous page
		$('.ui-button-text').each(function(){
			if($(this).html() == '&lt;&lt; Previous Page' && !form_settings){
				$(this).css('font-size','20px');
				$(this).html('&lt;&lt;');
			}
		});

		// slider instruction text
		$('.sldrmsg').each(function(){
			var horiz = $(this).parents('table.sldrparent').find('span[role="slider"]').attr('aria-orientation') == 'horizontal';
			$(this).html((horiz?'&#x2190;':'&#x2195;') + '<img alt="' + $(this).html() + '" src="APP_PATH_IMAGESpointer.png">' + (horiz?'&#x2192;':''));
		});
	}
	
	function stopText(){
		log('stopText()');
		var id;
		var langKey = -1;
		if(settings['stop-text-lang']){
			for(id in settings['stop-text-lang']){
				if(lang == settings['stop-text-lang'][id]){
					langKey = id;
					break;
				}
			}
		}
		
		if(langKey > -1){
			//title
			$('#stopActionPrompt').attr('title', '<img alt="Page" src="APP_PATH_IMAGESexclamation_frame.png">');
			
			//body
			$('#stopActionPrompt').html(settings['stop-text-body'][langKey]);
			
			//stop button
			stopAction1 = settings['stop-text-stop-button'][langKey];
			
			//continue buttons
			stopAction2 = settings['stop-text-continue-button'][langKey];
			stopAction3 = settings['stop-text-continue-button'][langKey];
			
			//return
			$('#stopActionReturn').attr('title', '<img alt="Page" src="APP_PATH_IMAGESexclamation_frame.png">');
			$('#stopActionReturn').html(settings['stop-text-return-body'][langKey]);
		}
		
		//save and return
		langKey = -1;
		if(settings['save-return-later-lang']){
			for(id in settings['save-return-later-lang']){
				if(lang == settings['save-return-later-lang'][id]){
					langKey = id;
					break;
				}
			}
		}
		
		if(langKey > -1 && typeof settings['save-return-later-corner'][langKey] == 'string'){
			//save and return button
			$('[name="submit-btn-savereturnlater"]').html(settings['save-return-later-button'][langKey]);

			//save and return corner
			$('#return_corner').html(settings['save-return-later-corner'][langKey]);

			//save and return continue button^M
			var b = '';
			var t = '';
			try{
				t = $('#dpop').children().children().children(1).children().children().children().children().find('button')[0].innerHTML;
				b = $('#dpop').children().children().children(1).children().children().children().children().find('button')[0].outerHTML.replace(t, settings['save-return-later-continue-button'][langKey]);
			}
			catch(e){
				//log(e.message);
			}
			//save and return popup text
			$('#dpop').children().children().children(1).children().children().children().children().html(settings['save-return-later-text'][langKey] + '<br>' + b);
		}
	}

	function controlText(){
		log('controlText()');
		// Define symbols
		var prevArrow = "<<";
		var nextArrow = ">>";
		var submitCheck = "&#x2714;";
		var resetSymbol = "&#x21ba;";
		var fontSizeSymbol = '<span style="font-size:150%;">A</span> <span style="font-size:125%;">A</span> <span style="font-size:100%;">A</span>';
		var pageSymbol = '<img alt="Page" src="APP_PATH_IMAGESblog_pencil.png">';

		// Survey Controls
		langKey = -1;
		if(settings['survey-control-lang']){
			for(id in settings['survey-control-lang']){
				if(lang == settings['survey-control-lang'][id]){
					langKey = id;
					break;
				}
			}
		}
		
		if (settings['prevent-check-mark-submit']) {
			submitCheck = "Submit";
		}
		
		if($('[name="submit-btn-saverecord"]').text() == "Submit") {
			$('[name="submit-btn-saverecord"]').addClass('multilingual-final-submit');
		}

		if(langKey > -1){
			// Prev/Next/Submit buttons
			var showArrows = true;
			if($('[name="submit-btn-saverecord"]').hasClass('multilingual-final-submit')) {
				// Submit Button
				$('[name="submit-btn-saverecord"]').html((settings['survey-control-submit'][langKey] ? settings['survey-control-submit'][langKey] : submitCheck ));
			} else {
				// Next Button
				$('[name="submit-btn-saverecord"]').html((settings['survey-control-next'][langKey] ? settings['survey-control-next'][langKey]+(showArrows ? " "+nextArrow : "") : nextArrow ));
			}
			
			// Prev Button
			$('[name="submit-btn-saveprevpage"]').html((settings['survey-control-prev'][langKey] ? (showArrows ? prevArrow+" " : "")+settings['survey-control-prev'][langKey] : prevArrow ));


			var showSymbols = true;
			// Reset
			$('.smalllink').each(function(){
				$(this).html((showArrows ? "&#x21ba; " : "")+settings['survey-control-reset'][langKey]);
			});

			//resize font
			$('#changeFont').children().eq(0).html((settings['survey-control-font-size'][langKey] ? settings['survey-control-font-size'][langKey] : fontSizeSymbol ));

			//page number
			if($('#surveypagenum').is(':visible')){
				if($('#surveypagenum').hasClass('multilingual-translated')) {
					var curPage = $('#surveypagenum .multilingual-cur-page').text();
					var maxPage = $('#surveypagenum .multilingual-max-page').text();
				} else {
					var tmp = $('#surveypagenum').html().split(' ');
					var curPage = tmp[1];
					var maxPage = tmp[3];
					$('#surveypagenum').addClass('multilingual-translated');
				}
				var surveyControlPageNumber = settings['survey-control-page-number'][langKey];
				if (surveyControlPageNumber) {
					if(surveyControlPageNumber.includes("CURRENTPAGE") && surveyControlPageNumber.includes("MAXPAGE")) {
						surveyControlPageNumber = surveyControlPageNumber.replace("CURRENTPAGE", '<span class="multilingual-cur-page">'+curPage+'</span>').replace("MAXPAGE", '<span class="multilingual-max-page">'+maxPage+'</span>');
					} else if(surveyControlPageNumber.includes("CURRENTPAGE") ) {
						surveyControlPageNumber = surveyControlPageNumber.replace("CURRENTPAGE", '<span class="multilingual-cur-page">'+curPage+'</span>');
						surveyControlPageNumber += '<span class="multilingual-max-page" style="display: none;">'+maxPage+'</span>';
					} else {
						surveyControlPageNumber = pageSymbol+' <span class="multilingual-cur-page">' + curPage + '</span> / <span class="multilingual-max-page">' + maxPage + '</span>';
					}
					$('#surveypagenum').html(surveyControlPageNumber);
				}
			}
		} else {
			// If there is no data for this language then use symbols

			//submit
			$('[name="submit-btn-saverecord"]').html(submitCheck);
			$('[name="submit-btn-saverecord"]').css('font-size','20px');
			
			//previous button
			$('[name="submit-btn-saveprevpage"]').html(prevArrow);
			$('[name="submit-btn-saveprevpage"]').css('font-size','20px');

			//reset
			$('.smalllink').each(function(){
				$(this).html(resetSymbol);
			});

			//resize font
			$('#changeFont').children().eq(0).html(fontSizeSymbol);

			//page number
			if($('#surveypagenum').is(':visible')){
				if($('#surveypagenum').hasClass('multilingual-translated')) {
					var curPage = $('#surveypagenum .multilingual-cur-page').text();
					var maxPage = $('#surveypagenum .multilingual-max-page').text();
				} else {
					var tmp = $('#surveypagenum').html().split(' ');
					var curPage = tmp[1];
					var maxPage = tmp[3];
					$('#surveypagenum').addClass('multilingual-translated');
				}
				$('#surveypagenum').html(pageSymbol+' <span class="multilingual-cur-page">' + curPage + '</span> / <span class="multilingual-max-page">' + maxPage + '</span>');
			}
		}
	}
	
	function addLanguageButtons(){
		var i;
		for(i in languages){
			//id="changeLang1"
			if (langIsHidden(languages[i]) === true)
				continue;
			$('#p1000ChooseLang').append('<p><div class="setLangButtons" name="' + languages[i] + '" style="display:none;float:left;width:' + (settings['button-width'] ? settings['button-width'] : '100px') + ';color:' + (settings['font-color'] ? settings['font-color'] : '') + ';background:' + (settings['background-color'] ? settings['background-color'] : '') + ';margin-top:20px;" onclick="$(\'#p1000Overlay\').fadeOut();$(\'#p1000ChooseLang\').fadeOut();">' + languages[i] + '</div></p>');
		}
		
		var timing = 300;
		$('.setLangButtons').each(function(){
			$(this).fadeIn(timing);
			timing += 150;
		});
	}
	
	function addAllLangButtons() {
		$(".setLangButtons").remove();
		// if ($('#p1000Overlay').length)
			$("#p1000Overlay").remove();
		// if ($('#changeLang').length)
			$("#changeLang").remove();
		Object.values(languages).forEach(function(language, i) {
			if (langIsHidden(language) === true)
				return;
			$('#surveytitle').parent().append("<div class='setLangButtons' name='" + language + "'>" + language + "</div>");
		});
	}
	
	// from stackoverflow
	// https://stackoverflow.com/questions/298750/how-do-i-select-text-nodes-with-jquery
	function getTextNodesIn(node, includeWhitespaceNodes = false) {
		// return $(el).find(":not(iframe)").addBack().contents().filter(function() {
			// return this.nodeType == 3;
		// });
		
		 var textNodes = [], nonWhitespaceMatcher = /\S/;

		function getTextNodes(node) {
			if (!node || !node.nodeType)
				return;
			if (node.nodeType == 3) {
				if (includeWhitespaceNodes || nonWhitespaceMatcher.test(node.nodeValue)) {
					textNodes.push(node);
				}
			} else {
				for (var i = 0, len = node.childNodes.length; i < len; ++i) {
					getTextNodes(node.childNodes[i]);
				}
			}
		}

		getTextNodes(node);
		return textNodes;
	}
	
	function translate(){
		log('translate()');
		if(langReady == 1 && !settings['empty']){
			clearInterval(interval);
			if ($('#changeLang').length)
				$('#changeLang').show();

			//add buttons to startUp
			if($('#p1000Overlay').is(':visible') && $('#p1000ChooseLang').html() == ''){
				//set width of start up screen (expand when using many languages)
				if(settings['start-screen-width']){
					$('#p1000ChooseLang').css('width', settings['start-screen-width']);
				}
				
				addLanguageButtons();
				/* var i;
				for(i in languages){
					$('#p1000ChooseLang').append('<p><div class="setLangButtons" id="changeLang1" name="' + languages[i] + '" style="display:none;float:left;width:' + (settings['button-width'] && settings['button-width']['value'] ? settings['button-width']['value'] : '100px') + ';color:' + (settings['font-color'] && settings['font-color']['value'] ? settings['font-color']['value'] : '') + ';background:' + (settings['background-color'] && settings['background-color']['value'] ? settings['background-color']['value'] : '') + ';margin-top:20px;" onclick="$(\'#p1000Overlay\').fadeOut();$(\'#p1000ChooseLang\').fadeOut();">' + languages[i] + '</div></p>');
				}

				var timing = 300;
				$('.setLangButtons').each(function(){
					$(this).fadeIn(timing);
					timing += 150;
				}); */
			}

			//required fields popup
			translatePopup();
			
			if ($('#changeLang').length) {
				$('#changeLang').html(lang);
				if(lang.length > 2){
					$('#changeLang').css('width', (settings['button-width'] ? settings['button-width'] : '100px'));
					$('#changeLang').css('padding-left','8px');
					$('#changeLang').css('padding-right','8px');
				}
				else{
					$('#changeLang').css('width', (settings['button-width'] ? settings['button-width'] : '30px'));
					$('#changeLang').css('padding-left','');
					$('#changeLang').css('padding-right','');
				}
				$('#changeLang').css('background', (settings['background-color'] ? settings['background-color'] : ''));
				$('#changeLang').css('color', (settings['font-color'] ? settings['font-color'] : ''));
				$('#changeLang').css('opacity','1');
			}
			
			//remove required english label
			if (!form_settings)
				$('.requiredlabel').remove();
			$('.multilingual').remove();

			//questions
			var id;
			for(id in translations['questions']){
				if(translations['questions'][id]['matrix'] != null){
					if(!(translations['questions'][id]['matrix'] in matrixProcessed) && settings['hide-matrix-questions-without-translation-survey']) {
						$('tr[mtxgrp="'+translations['questions'][id]['matrix']+'"].mtxfld').each(function(){
							var curMtxQuestionId = $(this).attr('id');
							curMtxQuestionId = curMtxQuestionId.replace('-tr', '');
							if(typeof translations['questions'][curMtxQuestionId] == 'undefined') {
								$(this).hide();
							} else {
								$(this).show();
							}
						});
						matrixProcessed[translations['questions'][id]['matrix']] = true;
					}
					//$('#' + id + '-tr').children('td').eq(1).children('table').children().children().children('td:first').html(translations['questions'][id]['text']);
					$('#label-' + id).html(translations['questions'][id]['text']);
				} else if(translations['questions'][id]['type'] == 'descriptive'){
					var tmp = $('#' + id + '-tr').children('td').eq(1).html();
					if(tmp != undefined){
						$('#' + id + '-tr').children('td').eq(1).html(translations['questions'][id]['text']);
						//tmp = tmp.split(/<(.+)/);
						//$('#' + id + '-tr').children('td').eq(1).html(translations['questions'][id]['text'] + ' <' + tmp[1]);
					}
				} else {
					var translation = null;
					var translate_mode = 'html';
					try {
						translation = $(translations['questions'][id]['text']).filter(function(i, element) {
							// filter out whitespace only nodes
							if (element.nodeType && element.nodeType == 3 && /^\s+$/.test(element.nodeValue)) {
								return false;
							}
							return true;
						});
						
						if (!translation[0]) {
							throw "no valid HTML elements";
						}
					} catch(err) {
						translation = translations['questions'][id]['text'];
						translate_mode = 'text';
					}
					
					if (translate_mode == 'text') {
						var nodes = $('#label-' + id).contents();
						if(nodes.length == 1 && nodes[0].nodeType == 1 && nodes[0].nodeName == 'DIV') {
							nodes = $('#label-' + id + ' [data-mlm-field="'+id+'"]').contents();
						}
						for (var i = 0; i < nodes.length; i++) {
							// replace textContent of first text type node
							if (!nodes[i] || !nodes[i].nodeType)
								continue;
							if (nodes[i].nodeType === 3) {
								nodes[i].textContent = translation;
								break;
							}
						};
					} else {
						// replace text node content sequentially
						var tnodes1 = [];
						var tnodes2 = [];
						
						translation.each(function(inc, text) {
							tnodes1 = getTextNodesIn($('#label-' + id + ' [data-mlm-field="'+id+'"]')[0].children[inc]);
							tnodes2 = getTextNodesIn(translation[inc]);

							tnodes2.forEach(function(el, i) {
								if(tnodes1[i].length > 0 && typeof tnodes1[i] !== 'undefined') {
									tnodes1[i].textContent = el.textContent;
								}
							});
						});
					}
				}
			}

			//answers
			for(id in translations['answers']){
				if(translations['answers'][id]['type'] == 'select'){
					var id2;
					for(id2 in translations['answers'][id]['text']){
						$('[name="' + id + '"] option').each(function(){
							$(this).show();
							if($(this).val() == id2){
								$(this).text(translations['answers'][id]['text'][id2]);
								$(this).data('lang', lang);
							} else if(settings['hide-answers-without-translation-survey'] && $(this).val() !== '' && $(this).data('lang') !== lang) {
								$(this).hide();
							}
						});
					}
				}
				else if(translations['answers'][id]['type'] == 'date' || translations['answers'][id]['type'] == 'time'){
					//$('#' + id + '-tr').children().last().children().eq(2).children().html(translations['answers'][id]['text'][0]);
					//$('#' + id + '-tr').children().last().children().eq(1).children().html(translations['answers'][id]['text'][0]);
					$('#' + id + '-tr').find('button').html(translations['answers'][id]['text'][0]);
				}
				else if(translations['answers'][id]['type'] == 'signature'){
					$('#' + id + '-tr').find('.fileuploadlink').html(translations['answers'][id]['text'][0]);
				}
				else if(translations['answers'][id]['type'] == 'file'){
					$('#' + id + '-tr').find('.fileuploadlink').html(translations['answers'][id]['text'][0]);
				}
				else if(translations['answers'][id]['type'] == 'slider'){
					if (translations['answers'][id]['text'][0] != null) $('#sldrlaba-' + id).html(translations['answers'][id]['text'][0]);
					if (translations['answers'][id]['text'][50] != null) $('#sldrlabb-' + id).html(translations['answers'][id]['text'][50]);
					if (translations['answers'][id]['text'][100] != null) $('#sldrlabc-' + id).html(translations['answers'][id]['text'][100]);
				}
				else if(translations['answers'][id]['matrix'] != null){
					var id2;
					var counter = 1;
					for(id2 in translations['answers'][id]['text']){
						$('#matrixheader-' + translations['answers'][id]['matrix'] + '-' + id2).html(translations['answers'][id]['text'][id2]);
						$('.floatMtxHdr').find('#matrixheader-' + translations['answers'][id]['matrix'] + '-' + id2).html(translations['answers'][id]['text'][id2]);
						counter++;
					}
				}
				else if(translations['answers'][id]['type'] == 'radio' || translations['answers'][id]['type'] == 'yesno' || translations['answers'][id]['type'] == 'truefalse'){
					var id2;
					for(id2 in translations['answers'][id]['text']){
						$('[name="' + id + '___radio"]').each(function(){
							$(this).parent().contents().last().show();
							$(this).show();
							if($(this).val() == id2){
								$(this).parent().contents().last().html(' ' + translations['answers'][id]['text'][id2]);
								$(this).data('lang', lang);
							} else if(settings['hide-answers-without-translation-survey'] && $(this).data('lang') !== lang) {
								$(this).parent().contents().last().hide();
								$(this).hide();
							}
						});
					}
					//enhanced radio buttons
					for(id2 in translations['answers'][id]['text']){
						$('.ec').each(function(){
							var tmp = $(this).parent().attr('comps').split(',');
							if($(this).parent().parent().hasClass('enhancedchoice')) {
								$(this).parent().show();
							}
							if(tmp[0] == id && tmp[2] == id2) {
								$(this).html(' ' + translations['answers'][id]['text'][id2]);
								$(this).data('lang', lang);
							} else if(settings['hide-answers-without-translation-survey'] && $(this).data('lang') !== lang) {
								if($(this).parent().parent().hasClass('enhancedchoice')) {
									$(this).parent().hide();
								}
							}
						});
					}
				}
				else if(translations['answers'][id]['type'] == 'checkbox'){
					var id2;
					for(id2 in translations['answers'][id]['text']){
						$('#'+id+'-tr .choicevert').each(function(){
							if(!$(this).hasClass('hidden')) {
								$(this).show();
							}

							if($(this).find('[name="__chk__' + id + '_RC_' + id2 + '"]').length) {
								$(this).contents().last().html(' ' + translations['answers'][id]['text'][id2]);
								$(this).data('lang', lang);
							} else if(settings['hide-answers-without-translation-survey'] && $(this).data('lang') !== lang) {
								$(this).hide();
							}
						});
					}
					//enhanced checkboxes
					for(id2 in translations['answers'][id]['text']){
						$('.ec').each(function(){
							var tmp = $(this).parent().attr('comps').split(',');

							if($(this).parent().parent().hasClass('enhancedchoice')) {
								$(this).parent().show();
							}

							if(tmp[0] == id && tmp[2] == id2) {
								$(this).html(translations['answers'][id]['text'][id2]);
								$(this).data('lang', lang);
							} else if(settings['hide-answers-without-translation-survey'] && $(this).data('lang') !== lang) {
								if($(this).parent().parent().hasClass('enhancedchoice')) {
									$(this).parent().hide();
								}
							}
						});
					}
				}
				else{

				}
			}

			// field notes
			for(id in translations['notes']){
				$('#note-' + id).html(translations['notes'][id]['text']);
			}

			//survey text (title, instructions, message)
			for(id in translations['surveytext']){
				if(translations['surveytext'] != undefined){
					if(translations['surveytext'][id] != null){
						$('#' + id).html(translations['surveytext'][id]);
					}
				}
			}

			//layout
			$('body').css('direction', translations['layout']);
			if(translations['layout'] == 'rtl'){
				$('td').each(function(){
					$(this).attr('align', 'right');
				});

				$('p').each(function(){
					$(this).css('text-align','right');
				});

				$('#surveytitle').css('text-align','right');
				$('#surveyinstructions').css('text-align','right');
			}
			else{
				$('td').each(function(){
					$(this).removeAttr('align');
				});

				$('p').each(function(){
					$(this).css('text-align','');
				});

				$('#surveytitle').css('text-align','');
				$('#surveyinstructions').css('text-align','');
			}
			
			langReady = 2;

			piping();
			stopText();
			controlText();
		
			if(settings['languages_variable']){
				if($('#' + settings['languages_variable'] + '-tr').length){
					doBranching(settings['languages_variable']);
				}
			}
			else{
				if($('#languages-tr').length){
					doBranching('languages');
				}
			}
			
			//econsent pdf
			if(pdf_url.substring(0, 5) != 'false'){
				econsent_pdf();
			}
			
			form_translate();
		}
	}
	
	function form_translate() {
		log('form_translate(), form_settings:', form_settings);
		// form specific translation from Survey Settings
		if (form_settings) {
			log('form_translate(), form_settings exists');
			// // basic survey text translations
			if ($("#surveytitle").length)	// survey title
				$("#surveytitle").html(form_settings.survey_settings.title);
			if ($("#surveyinstructions").length) {	// survey title
				var textArea = document.createElement('textarea');
				textArea.innerHTML = form_settings.survey_settings.instructions;
				$("#surveyinstructions").html(textArea.value);
			}
			if ($("#changeFont").length)	// resize font
				$("#changeFont div").eq(0).html(form_settings.basic_settings.resize_font)
			
			// overwrite Submit/Next Page button
			if ($("[name='submit-btn-saverecord']").length) {
				var button =$('[name="submit-btn-saverecord"]')
				
				if (button.hasClass('multilingual-final-submit')) {
					$("[name='submit-btn-saverecord']").html(form_settings.basic_settings.submit);
				} else {
					$("[name='submit-btn-saverecord']").html(form_settings.basic_settings.next + " >>");
				}
			}
			

				
			if ($("[name='submit-btn-saveprevpage']").length) // prev page
				$("[name='submit-btn-saveprevpage']").html("<< " + form_settings.basic_settings.previous);
			$("button").each(function(i, e) { // "close survey" button
				var onclick_text = $(e).attr('onclick');
				if (typeof onclick_text == 'string') {
					if ($(e).attr('onclick').includes('__closewindow=1'))
						$(e).html(form_settings.basic_settings.close);
				}
			})
			if ($("#surveyacknowledgment").length) { // survey acknowledgement
				var textArea = document.createElement('textarea');
				textArea.innerHTML = form_settings.survey_settings.acknowledgement;
				$("#surveyacknowledgment").html(textArea.value);
			}
			
			// translate save and return later feature elements
			var save_button = $('[name="submit-btn-savereturnlater"]').html();
			if (typeof form_settings.save_and_return_survey.button === 'string') {
				save_button = form_settings.save_and_return_survey.button;
			}
			$('[name="submit-btn-savereturnlater"]').html(save_button);
			
			var popup = $('#dpop .popup-contents tbody tr td');
			if ($(popup).length) {
				// copy existing text
				
				var corner_text = $('#return_corner').html();
				var title = $(popup).find('span').eq(1).html();
				var popup_text = $(popup).find('div')[0].previousSibling.textContent;
				var popup_button = $(popup).find('button').html();

				// translate where possible (setting exists)
				if (typeof form_settings.save_and_return_survey.popup_hint === 'string') {
					corner_text = form_settings.save_and_return_survey.popup_hint;
				}
				if (typeof form_settings.save_and_return_survey.popup_title === 'string') {
					title = "<b>" + corner_text + "</b> " + form_settings.save_and_return_survey.popup_title;
				}
				if (typeof form_settings.save_and_return_survey.popup_text === 'string') {
					popup_text = form_settings.save_and_return_survey.popup_text;
				}
				if (typeof form_settings.save_and_return_survey.popup_button === 'string') {
					popup_button = form_settings.save_and_return_survey.popup_button;
				}
				
				//save and return corner
				$('#return_corner a b').html(corner_text);
				
				// popup title
				$(popup).find('span').eq(1).html(title);
				
				// popup text
				$(popup).find('div')[0].previousSibling.textContent = popup_text;
				
				// popup button
				$(popup).find('button').html(popup_button);
			}
			
			// translate e-consent text elements
			if ($("input#econsent_confirm_checkbox").length != 0) {
				$("#econsent_confirm_checkbox_div").prev('div').prev('div').html(form_settings.econsent.top);
				$("input#econsent_confirm_checkbox")[0].nextSibling.textContent = form_settings.econsent.checkbox;
				$("#econsent_confirm_checkbox_div").next('div').html(form_settings.econsent.bottom);
			}
			
			// translate return code form after survey submitted
			if ($("#return_code_completed_survey_div img")[0])
				$("#return_code_completed_survey_div img")[0].nextSibling.textContent = form_settings.save_and_return_saved.survey_complete;
			if ($("#return_code_completed_survey_div div:eq(0) span")[0])
				$("#return_code_completed_survey_div div:eq(0) span")[0].previousSibling.textContent = form_settings.save_and_return_saved.return_code + ": ";
			
			// translate 'Download your survey response (PDF)' and 'Download' button
			$("button").each(function(i, e) {
				var onclick_text = $(e).attr('onclick');
				if (typeof onclick_text == 'string') {
					if ($(e).attr('onclick').includes('window.open') && $(e).attr('onclick').includes('appendEconsentFooter=1')) {
						var download_pdf_button = $(e).find('span');
						var download_pdf_label = $(e).prev('b');
						if ($(download_pdf_button).length)
							$(download_pdf_button).html(form_settings.download_response.button);
						if ($(download_pdf_label).length)
							$(download_pdf_label).html(form_settings.download_response.label);
					}
				}
			})
			
			// translate field level text
			if ($("div.requiredlabel").length)	// '* must provide value' text
				$("div.requiredlabel").html(form_settings.field_level.text);
			if ($(".expandLink").length)	// textarea "Expand" links
				$(".expandLink").html(form_settings.field_level.expand);
			if ($(".smalllink").length)	// input "reset" links
				$(".smalllink").html(form_settings.field_level.reset);
			if ($(".fileuploadlink:contains('Add signature')").length) {	// signature field "Add Signature" links
				$(".fileuploadlink:contains('Add signature')").each(function(i, e) {
					$(e).find('i')[0].nextSibling.textContent = form_settings.field_level.add_signature;
				})
			}
			if ($(".fileuploadlink:contains('Upload file')").length) {	// file upload field "Upload file" links
				$(".fileuploadlink:contains('Upload file')").each(function(i, e) {
					$(e).find('i')[0].nextSibling.textContent = form_settings.field_level.upload_file;
				})
			}
		}
		
		Object.values(languages).forEach(function(language, i) {
			if (langIsHidden(language) === true) {
				// log('removing ' + language + ' button');
				$(".setLangButtons[name=" + language + "]").remove();
			}
		});
	}
	
	function piping(){
		$('.piping_receiver').each(function(){
			var classes = $(this).attr('class').split(' ');
			var tmp;
			var tmp2;
			for(tmp in classes){
				if(classes[tmp].indexOf('piperec') > -1 && !classes[tmp].endsWith('-label')){
					tmp2 = classes[tmp].split('-');
					if($('[name="' + tmp2[2] + '"]').val() != ''){
						$(this).html($('[name="' + tmp2[2] + '"]').val());
					}
				}
			}
		});
	}

	function translateReady(){
		log('translateReady()');
		interval = setInterval(translate, 200);
	}

	function getLanguage(newLang){
		log('getLanguage()');
		langReady = 0;
		// log('getLanguage(' + JSON.stringify(newLang) + ')');
		/*
			if newLang null or undefined,
				try to set language using cookies
				if that fails
					set language to first language that isn't hidden
			else
				if newLang is a hidden lang
					return early
				else
					translate
		*/
		
		if (newLang == null || newLang == undefined) {
			var cookieLangIndex = getCookie('p1000Lang');
			if (languages[cookieLangIndex] && !langIsHidden(languages[cookieLangIndex])) {
				lang = cookieLangIndex;
			} else {
				lang = null;
				Object.values(languages).forEach(function(language, i) {
					if (!lang && !langIsHidden(language))
						lang = language;
				});
			}
		} else {
			if (langIsHidden(newLang) === true) {
				// log('	language hidden!');
				return;
			} else {
				// log('	translating to ' + newLang);
				setCookie('p1000Lang', newLang, .04);
				lang = newLang;
				translateReady();
			}
		}

		//set languages variable to current language
		if(settings['languages_variable']){
			$('[name="' + settings['languages_variable'] + '"] option').each(function(){
				if($(this).text() == lang){
					$(this).prop('selected', true);
				}
			});
		}
		
		log('getLanguage() lang: ', lang);
		getTranslations();
		loadFormSettings();
	}

	function getTranslations(){
		log('getTranslations()');
		langReady = 0;
		var data = {};
		data['todo'] = 1;
		data['lang'] = lang;
		data['project_id'] = pid;
		data['record_id'] = $('[name="' + table_pk + '"]').val();
		if (data['event_id'])
			data['event_id'] = event_id;
		//data['page'] = $('#surveytitle').html().replace(/ /g,'_').toLowerCase();
		var t;
		for(t in languages){
			if(languages[t] == lang){
				data['lang_id'] = t;
				break;
			}
		}

		//pull survey page name
		var prevInput;
		$('input').each(function(){
			if($(this).attr('name') && $(this).attr('name').indexOf('_complete') > -1){
				prevInput = $(this).prev().attr('name');
				if(prevInput == '__response_hash__'){
					data['page'] = $(this).attr('name').replace('_complete','');
				}
			}
		});

		var json = encodeURIComponent(JSON.stringify(data));

		$.ajax({
			url: ajax_url,
			type: 'POST',
			data: 'data=' + json,
			success: function (r) {
				log("getTranslations response", r);
				//hide if no translations
				if(!anyTranslated && (r == null || (r['questions'] == null && r['answers'] == null && r['notes'] == null))){
					clearInterval(interval);
					
					if ($('#changeLang').length)
						$('#changeLang').remove();
					
					// commenting out to prevent issue where overlay is shown again
					// setCookie('p1000Lang', 'en', -1);
				} else {
					// if language is not previously set in cookies, let user choose
					if(getCookie('p1000Lang') == "-1"){
						$('#p1000Overlay').fadeIn();
						$('#p1000ChooseLang').fadeIn();
					}
					translations = r;
					langReady = 1;
					anyTranslated = true;
					matrixProcessed = {};
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
			   log(textStatus, errorThrown);
			}
		});
	}

	function loadFormSettings() {
		log('loadFormSettings()');
		// overwrite project-level $settings with form-specific $form_settings
		if (!settingsRetrieved || !languagesRetrieved)
			return;
		
		// parse stored form_settings JSON
		if (settings.instruments && typeof settings.instruments.value === 'string')
			settings.instruments = JSON.parse(settings.instruments.value)
		
		// if text translations exist for this instrument/lang combo, then set form_settings
		if (settings.instruments && settings.instruments[instrument_name] && settings.instruments[instrument_name][lang]) {
			log('loadFormSettings(), set form_settings lang:', lang);
			form_settings = settings.instruments[instrument_name][lang];
		}
		
		// if survey acknowledgement text is shown, add buttons so user can translate survey acknowledgement text
		if ($("#surveyacknowledgment").length && !$("#language_buttons").length && settings.instruments) {
			$("#pagecontent").prepend("<div id='language_buttons'></div>");
			for (let [lang, s] of Object.entries(settings.instruments[instrument_name])) {
				$("#language_buttons").append("<button>" + lang + "</button>")
			}
			$("#language_buttons button").css('width', "100px");
			$("#language_buttons").show();
			
			$("#language_buttons").on('click', 'button', function() {
				var lang = $(this).html();
				form_settings = settings.instruments[instrument_name][lang];
				form_translate();
			});
		}
	}
	
	//generic functions
	function getVariable(variable){
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
			   var pair = vars[i].split("=");
			   if(pair[0] == variable){return pair[1];}
		}
		return(false);
	}

	function setCookie(cname, cvalue, exdays) {
		var id;
		var key = '-1';
		for(id in languages){
			if(languages[id] == cvalue){
				key = id;
			}
		}

		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + key + "; " + expires;
	}

	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return languages[c.substring(name.length,c.length)];
			}
		}

		return "-1";
	}

	function setNormalCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}
	
	function langIsHidden(lang) {
		if (!settings || !settings.instruments || !settings.instruments[instrument_name] || !settings.instruments[instrument_name][lang] || !settings.instruments[instrument_name][lang].basic_settings)
			return null;
		
		var slice = settings.instruments[instrument_name][lang].basic_settings;
		if (slice.multilingual_module_hide_language == '1') {
			return true;
		} else {
			return false;
		}
	}
	
	function onLanguageSelect(selectedLanguage) {
		var language_selected_url = 'MULTILINGUAL_LANGUAGE_SELECTED_URL';
		var pdf_translation_enabled = 'MULTILINGUAL_PDF_TRANSLATION_ENABLED';
		
		if (language_selected_url == '' || !record_id || !instrument_name || pdf_translation_enabled == 'false')
			return;
		
		var data = {
			record_id: record_id,
			event_id: event_id,
			instrument: instrument_name,
			language_value: selectedLanguage
		};
		
		$.ajax({
			url: language_selected_url,
			type: 'POST',
			data: data
		});
	}
})();
