/* exported addBtnActionNewTable */
/**
 * Make the toolbar button open the table editor for a new table at the cursor position
 *
 * @param  {jQuery}   $btn  Button element to add the action to
 * @param  {object}   props the button properties
 * @param  {string}   edid  ID of the editor textarea
 * @return {string}   the ID of the editor textarea, so the toolbar adds the button without a picker
 */
window.addBtnActionNewTable = function addBtnActionNewTable($btn, props, edid) {
    'use strict';

    $btn.on('click', () => {
        const editform = jQuery('#dw__editform')[0];
        const ed = jQuery(`#${edid}`)[0];

        /**
         * Add a hidden textarea with a part of the page text to the form
         *
         * @param {string} name the key of the field in the edittable__new array
         * @param {string} val the text to store
         *
         * @return {void}
         */
        function addField(name, val) {
            const pos_field = document.createElement('textarea');
            pos_field.name = `edittable__new[${name}]`;
            pos_field.value = val;
            pos_field.style.display = 'none';
            editform.appendChild(pos_field);
        }

        const sel = window.DWgetSelection(ed);
        addField('pre', ed.value.substring(0, sel.start));
        addField('text', ed.value.substring(sel.start, sel.end));
        addField('suf', ed.value.substring(sel.end));

        // the table editor needs a range to open, the fields above place the new table
        const range = document.createElement('input');
        range.name = 'range';
        range.value = '0-0';
        range.type = 'hidden';
        editform.appendChild(range);

        // submit the form as an edit request
        const editbutton = document.createElement('input');
        editbutton.name = 'do[edit]';
        editbutton.type = 'submit';
        editbutton.style.display = 'none';
        editform.appendChild(editbutton);
        // suppress the warning about unsaved changes
        window.textChanged = false;
        editbutton.click();

    });
    return edid;
};
