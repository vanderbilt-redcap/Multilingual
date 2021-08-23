<?php

// make form and language dropdown buttons

// get forms
$form_names = array_keys($Proj->forms);

// get languages
$languages = $module->getLanguages($module->getProjectId());

if ($_GET['lang'] && $_GET['form']) {
	if (array_search($_GET['lang'], $languages) === false) {
		echo "<div class='alert alert-warning w-50' role='alert'>The language selected, '" . $_GET['lang'] . "', could not be found in the list of languages configured for this project:<br>" . print_r($languages, true) . "</div>";
	} elseif (array_search($_GET['form'], $form_names) === false) {
		echo "<div class='alert alert-warning w-50' role='alert'>The form selected, '" . $_GET['form'] . "', could not be found in the list of unique form names for this project:<br>" . print_r($form_names, true) . "</div>";
	} else {
		$audit_table = $module->getAuditTable($_GET['form'], $_GET['lang']);
	}
}

?>
<div class='row audit-options'>
	<div class='dropdown form_dd'>
		<button class='btn btn-primary dropdown-toggle' type='button' id='instrument_select' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
			Select a form
		</button>
		<div class='dropdown-menu' aria-labelledby='instrument_select'>
			<?php
			foreach($form_names as $i => $name) {
				echo "<a class='dropdown-item' href='#'>$name</a>";
			}
			?>
		</div>
	</div>
	<div class='dropdown lang_dd'>
		<button class='btn btn-primary dropdown-toggle' type='button' id='language_select' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
			Select a language
		</button>
		<div class='dropdown-menu' aria-labelledby='language_select'>
			<?php
			foreach($languages as $i => $language) {
				echo "<a class='dropdown-item' href='#'>$language</a>";
			}
			?>
		</div>
	</div>
	<div>
		<input type="checkbox" id="escape-html">
		<label class="audit-option" for="escape-html">Escape HTML</label>
	</div>
</div>

<?php
if ($audit_table) {
	echo $audit_table;
}
?>

<script type='text/javascript' src='<?php echo $module->getUrl('js/auditTranslations.js'); ?>'></script>
<link rel='stylesheet' type='text/css' href='<?php echo $module->getUrl('css/auditTranslations.css'); ?>'>
<!-- add DataTables plugin -->
<script type="text/javascript" src="//cdn.datatables.net/1.10.25/js/jquery.dataTables.min.js"></script>
<link rel="stylesheet" href="//cdn.datatables.net/1.10.25/css/jquery.dataTables.min.css">