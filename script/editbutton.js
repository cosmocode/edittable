/**
 * Adjust the top margin and make buttons visible
 */
jQuery(() => {
    'use strict';
    const $editbutton = jQuery('.dokuwiki div.editbutton_table');
    if (!$editbutton.length) {
        return;
    }

    // the buttons stay hidden when JavaScript is not available
    $editbutton.show();

    // pull the button up by the bottom margin of the table above it
    let margin = 0;
    const $tablediv = $editbutton.prev('div.table');
    if (!$tablediv.length) {
        return;
    }
    margin += parseFloat($tablediv.css('margin-bottom'));
    margin += parseFloat($tablediv.find('table').css('margin-bottom'));
    margin += 1; // for the border

    $editbutton.css('margin-top', margin * -1);
});
