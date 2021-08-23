<?php
require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';

$dom = new \DOMDocument();

// libxml_use_internal_errors(true);
// $dom->loadHTML("<span>abc</pan>");
// print_r(libxml_get_errors());
// echo "<br>";

libxml_use_internal_errors(true);
$dom->loadHTML("<div>adef<div>");
print_r(libxml_get_errors());

echo "-";

require_once APP_PATH_DOCROOT . 'ProjectGeneral/footer.php';

/*
	1. need escape html option (checkbox)
	2. need 'HTML Nodes' column
	3. need 'Text Translation' and 'Nodal Translation' columns
		instead of 'Data Entry' and 'Survey Translation'


** nice-to-haves
	use JS string replace stuff for html escaping
		https://stackoverflow.com/questions/1787322/what-is-the-htmlspecialchars-equivalent-in-javascript
	remember selected page-length and default to 25?
	color empty translation cells gray?

*/

?>