/**
 * Add button action for your toolbar button
 *
 * @param  {jQuery}   $btn  Button element to add the action to
 * @param  {Array}    props Associative array of button properties
 * @param  {string}   edid  ID of the editor textarea
 * @return {string}   If button should be appended return the id for in aria-controls,
 *                    otherwise an empty string
 */
function addBtnActionNewTable($btn, props, edid) {

    $btn.click(function () {
        var editform = jQuery('#dw__editform')[0];
        var ed = jQuery('#' + edid)[0];

        function addField(name, val) {
            var pos_field = document.createElement('textarea');
            pos_field.name = 'edittable__new[' + name + ']';
            pos_field.value = val;
            pos_field.style.display = 'none';
            editform.appendChild(pos_field);
        }

        var sel;
        if (window.DWgetSelection) {
            sel = DWgetSelection(ed);
        } else {
            sel = getSelection(ed);
        }
        addField('pre', ed.value.substr(0, sel.start));
        addField('text', ed.value.substr(sel.start, sel.end - sel.start));
        addField('suf', ed.value.substr(sel.end));

        // adora belle requires a range, even though we handle ranging ourselve here
        var range = document.createElement('input');
        range.name = 'range';
        range.value = '0-0';
        range.type = 'hidden';
        editform.appendChild(range);

        // Fake POST
        var editbutton = document.createElement('input');
        editbutton.name = 'do[edit]';
        editbutton.type = 'submit';
        editbutton.style.display = 'none';
        editform.appendChild(editbutton);
        // Prevent warning
        window.textChanged = false;
        editbutton.click();

    });
    return 'click';
}
