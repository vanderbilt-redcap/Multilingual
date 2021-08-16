
Multilingual = {}

Multilingual.initialize = function() {
	Multilingual.selectedForm = Multilingual.getURLParameter('form');
	if (Multilingual.selectedForm) {
		$('.form_dd button').text(Multilingual.selectedForm);
	}
	
	Multilingual.selectedLanguage = Multilingual.getURLParameter('lang');
	if (Multilingual.selectedLanguage) {
		$('.lang_dd button').text(Multilingual.selectedLanguage);
	}
}

Multilingual.optionsSelected = function() {
	if (Multilingual.selectedForm && Multilingual.selectedLanguage) {
		var url = window.location.href;
		
		// update or append form parameter
		if (/form=.*?(?=&|$|#)/.test(url)) {
			url = url.replace(/form=.*?(?=&|$|#)/, "form=" + Multilingual.selectedForm);
		} else if (/#/.test(url)) {
			url = url.replace("#", "&form=" + Multilingual.selectedForm + "#");
		} else {
			url = url + "&form=" + Multilingual.selectedForm + "#";
		}
		
		// update lang parameter
		if (/lang=.*?(?=&|$|#)/.test(url)) {
			url = url.replace(/lang=.*?(?=&|$|#)/, "lang=" + Multilingual.selectedLanguage);
		} else if (/#/.test(url)) {
			url = url.replace("#", "&lang=" + Multilingual.selectedLanguage + "#");
		} else {
			url = url + "&lang=" + Multilingual.selectedLanguage + "#";
		}
		
		window.location.href = url;
	}
}

Multilingual.registerEvents = function() {
	// change button text when form or language is selected
	$('body').on('click', '.form_dd .dropdown-item', function(event) {
		Multilingual.selectedForm = event.target.text;
		$('.form_dd button').text(event.target.text);
		Multilingual.optionsSelected();
	});
	$('body').on('click', '.lang_dd .dropdown-item', function(event) {
		Multilingual.selectedLanguage = event.target.text;
		$('.lang_dd button').text(event.target.text);
		Multilingual.optionsSelected();
	});
}

Multilingual.getURLParameter = function(parameterName) {
	// from stackoverflow
	// https://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-get-parameters
	return new URL(window.location.href).searchParams.get(parameterName);
}

$(function() {
	Multilingual.initialize();
	Multilingual.registerEvents();
});