
Multilingual = {}

Multilingual.initialize = function() {
	Multilingual.datatable = $('table.audit_table').DataTable({
		ordering: false,
		pageLength: 25
	});
	
	Multilingual.selectedForm = Multilingual.getURLParameter('form');
	if (Multilingual.selectedForm) {
		$('.form_dd button').text(Multilingual.selectedForm);
	}
	
	Multilingual.selectedLanguage = Multilingual.getURLParameter('lang');
	if (Multilingual.selectedLanguage) {
		$('.lang_dd button').text(Multilingual.selectedLanguage);
	}
	
	Multilingual.escapeHTML = Multilingual.getURLParameter('escapeHTML');
	console.log('Multilingual.escapeHTML', Multilingual.escapeHTML);
	console.log('typeof Multilingual.escapeHTML', typeof Multilingual.escapeHTML);
	if (Multilingual.escapeHTML) {
		console.log('setting prop checked to: ', Multilingual.escapeHTML);
		$('#escape-html').prop('checked', Multilingual.escapeHTML);
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
		
		// update escape html parameter
		if (Multilingual.escapeHTML) {
			if (/escapeHTML=true/.test(url) == false) {
				if (/#/.test(url)) {
					url = url.replace("#", "&escapeHTML=true#");
				} else {
					url = url + "&escapeHTML=true";
				}
			}
		} else {
			url = url.replace(/&?escapeHTML=.*?(?=&|$|#)/, "");
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
	$('body').on('change', 'input#escape-html', function(event) {
		Multilingual.escapeHTML = $(event.target).prop('checked');
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