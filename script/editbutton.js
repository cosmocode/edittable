/**
 * Adjust the top margin and make buttons visible
 */
jQuery(() => {
    'use strict';
    const $editbuttons = jQuery('.dokuwiki div.editbutton_table');
    if (!$editbuttons.length) {
        return;
    }

    // the buttons stay hidden when JavaScript is not available
    $editbuttons.show();

    for (const editbutton of $editbuttons) {
        const $editbutton = jQuery(editbutton);
        const $tablediv = $editbutton.prev('div.table');
        if (!$tablediv.length) {
            continue;
        }

        // measure the gap the table above leaves, then pull the button onto the table's border
        $editbutton.css('margin-top', 0);
        const gap = editbutton.getBoundingClientRect().top - $tablediv[0].getBoundingClientRect().bottom;
        $editbutton.css('margin-top', -(gap + 1));
    }
});
