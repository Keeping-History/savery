document.addEventListener('DOMContentLoaded', function() {
	var $bsMultiSelects = $('#tags, #tags-quick, #speaker')
	$bsMultiSelects.bsMultiSelect({ cssPatch : {  choices: {columnCount:'3' }}});

	var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bss-tooltip]'));
	var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
	  return new bootstrap.Tooltip(tooltipTriggerEl);
	})
}, false);
