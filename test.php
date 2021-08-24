<?php
require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';

$nodes = $module->getHTMLNodes("<div>tl</div> <span>br</span>");
$perNodeTranslation = $module->translatePerNode("<p>def</p> <span>abc</span>", $nodes);

echo "<pre>";
print_r($perNodeTranslation);
echo "\n";
echo "\n";
echo "\n";
print_r(htmlspecialchars($perNodeTranslation));
echo "</pre>";

require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';

/*
x	1. need escape html option (checkbox)
x	2. need 'HTML Node Count' column
x	3. need 'Text Translation' and 'Nodal Translation' columns
		instead of 'Data Entry' and 'Survey Translation'
		
	test nodal translations
	test mobile multi choice survey presentation/translation
	update README to explain audit translations page


** nice-to-haves
	use JS string replace stuff for html escaping
		https://stackoverflow.com/questions/1787322/what-is-the-htmlspecialchars-equivalent-in-javascript
x	remember selected page-length and default to 25?
	color empty translation cells gray?

*/

?>