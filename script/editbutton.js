/**
 * Adjust the top margin and make buttons visible
 */
jQuery(function () {
    var $editbutton = jQuery('.dokuwiki div.editbutton_table');
    if (!$editbutton.length) return;

    // unhide the buttons - we have JavaScript
    $editbutton.show();

    // determine the bottom margin of the table above and remove it from our button
    var margin = 0;
    var $tablediv = $editbutton.prev('div.table');
    if (!$tablediv.length) return;
    margin += parseFloat($tablediv.css('margin-bottom'));
    margin += parseFloat($tablediv.find('table').css('margin-bottom'));
    margin += 1; // for the border

    $editbutton.css('margin-top', margin * -1);
});