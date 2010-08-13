function addBtnActionInsertTable(btn, param, edid) {
    addEvent(btn, 'click', function () {
        var editform = $('dw__editform');
        var sel = getSelection($(edid));
        var text = $(edid).value;
        $(edid).parentNode.removeChild($(edid));

        var pos_field = document.createElement('textarea');
        pos_field.name = 'edittable__new[pre]';
        pos_field.value = text.substr(0, sel.start);
        editform.appendChild(pos_field);

        pos_field = document.createElement('textarea');
        pos_field.name = 'edittable__new[text]';
        pos_field.value = text.substr(sel.start, sel.end - sel.start);
        editform.appendChild(pos_field);

        pos_field = document.createElement('textarea');
        pos_field.name = 'edittable__new[suf]';
        pos_field.value = text.substr(sel.end);
        editform.appendChild(pos_field);

        // Fake POST
        var editbutton = document.createElement('input');
        editbutton.name = 'do[edit]';
        editbutton.type = 'submit';
        editform.appendChild(editbutton);
        editbutton.click();
    });
    return true;
}
