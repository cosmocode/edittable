/**
 * Add neat functions to the table editor
 *
 * This function adds a toolbar and column/row handles to the table editor.
 *
 * The source code has the following sections:
 * - helper functions
 * - element prototype enhancers (pimps); the core functionality related to the
 *   table, rows and cells
 * - toolbar definition; the button actions
 * - drag ’n’ drop handler
 *
 * @author Adrian Lang <lang@cosmocode.de>
 */
addInitEvent(function () {
    var table = getElementsByClass('edit', document, 'table')[0];
    if (!table) {
        // There is no table editor.
        return;
    }
    var tbody = table.getElementsByTagName('tbody')[0];
    table.insertBefore(document.createElement('thead'), table.firstChild);

    // The currently selected table field
    var cur_field = null;

    function setCurrentField(newcur) {
        var t = getType.call(newcur);
        if (t < TYPE__CELL) {
            return false;
        }
        if (newcur._parent) {
            newcur = newcur._parent;
        }
        cur_field = newcur;
        lastChildElement.call(cur_field).focus();
    }

    // An array containing functions which are to be called on a focus change;
    // The first handler updates the var “cur_field”.
    var focushandlers = [function () {cur_field = this.parentNode; }];

    /**
     * General helper functions
     *
     * These functions allow to navigate through DOM trees without text nodes.
     */
    function previousElement() {
        var node = this.previousSibling;
        while (node && !assertType.call(node, TYPE__ELEMENT)) {
            node = node.previousSibling;
        }
        return node;
    }

    function nextElement() {
        var node = this.nextSibling;
        while (node && !assertType.call(node, TYPE__ELEMENT)) {
            node = node.nextSibling;
        }
        return node;
    }

    function firstChildElement() {
        var node = this.firstChild;
        return (node && !assertType.call(node, TYPE__ELEMENT)) ?
               nextElement.call(node) : node;
    }

    function lastChildElement() {
        var node = this.lastChild;
        return (node && !assertType.call(node, TYPE__ELEMENT)) ?
               previousElement.call(node) : node;
    }

    /**
     * Table related helper functions
     */

    // Internal helper function used in findColumn and findRow
    function findTableElement(target, col, prep, coord_pos, coord_size) {
        for (var i = 0 ; i < col.length; ++i) {
            var startelem = prep.call(col[i]);
            var c_val = 0;
            var c_elem = startelem;
            do {
                c_val += c_elem[coord_pos];
                c_elem = c_elem.offsetParent;
            } while (c_elem);
            if (target >= c_val && c_val >= target - startelem[coord_size]) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Get the column number of a certain x value
     *
     * x should include scrollLeft.
     */
    function findColumn(x) {
        return findTableElement(x, table.tHead.rows[0].cells,
                                function () { return this; },
                                'offsetLeft',
                                'offsetWidth');
    }

    /**
     * Get the row number of a certain y value
     *
     * y should include scrollHeight.
     */
    function findRow(y) {
        return findTableElement(y, table.rows,
                                firstChildElement,
                                'offsetTop',
                                'offsetHeight');
    }

    /**
     * Get the number of columns this has
     *
     * upto specifies the cell up to which should be counted.
     */
    function countCols(upto) {
        var count = 0;
        var node = firstChildElement.call(this);
        while (node && node !== upto) {
            ++count;
            node = nextElement.call(node);
        }
        return count;
    }

    /**
     * Get the cell in this row at position “column”
     */
    function getCell(column) {
        var _ret = null;
        this.forEveryCell(function () {
            if (this.getPos()[1] === column) {
                _ret = this;
            }
        });
        return _ret;
    }

    /**
     * Get the cell below this
     */
    function getCellBelow() {
        var row = nextElement.call(this.parentNode);
        return row ? getCell.call(row, this.getPos()[1]) : null;
    }

    /**
     * Get the cell above this
     */
    function getCellAbove() {
        var row = previousElement.call(this.parentNode);
        return row ? getCell.call(row, this.getPos()[1]) : null;
    }

    var TYPE__NODE    = 0;
    var TYPE__ELEMENT = 1;
    var TYPE__CELL    = 2;
    var TYPE__FIELD   = 3;

    function getType() {
        if (!this.tagName) {
            return TYPE__NODE;
        }
        if (this._parent) {
            return TYPE__CELL;
        }
        if (this.getInpObj || (this.tagName.match(/t[dh]/i) &&
                               !this.className.match(/(row|col)handle/))) {
            return TYPE__FIELD;
        }
        return TYPE__ELEMENT;
    }

    function assertType(type) {
        return getType.call(this) >= type;
    }

    /**
     * Create a new cell based on a template cell
     *
     * The cell consists in a td or th object, hidden inputs and text input.
     */
    function getNewCell(template, changes) {
        var params;
        if (template) {
            params = {'tag': template.getVal('tag'),
                      'align': template.getVal('align'),
                      'colspan': template.getVal('colspan'),
                      'rowspan': template.getVal('rowspan'),
                      'pos': template.getPos(),
                      'text': template.getVal('text')};
        } else {
            params = {'tag': 'td', 'align': 'right', 'colspan': 1,
                      'rowspan': 1, 'pos': [0, 0], 'text': ''};
        }

        for (var index in changes) {
            params[index] = changes[index];
        }

        var cell = document.createElement(params.tag);
        cell.className = 'col' + params.pos[1] + ' ' + params.align + 'align';
        cell.colSpan = params.colspan;
        cell.rowSpan = params.rowspan;
        var basename = 'table[' + params.pos[0] + '][' + params.pos[1] + ']';
        for (var val in params) {
            if (val === 'pos' || val === 'text') continue;
            cell.innerHTML += '<input type="hidden" value="' + params[val] +
                              '" name="' + basename + '[' + val + ']" />';
        }
        cell.innerHTML += '<input name="' + basename + '[text]" value="' +
                          params.text + '" />';
        pimp.call(cell);
        cell._placeholders = [];
        return cell;
    }

    /**
     * Create a new placeholder div
     */
    function getNewPlaceholder(pos, partof) {
        var elem = document.createElement('div');
        elem.style.display = 'none';
        elem._parent = partof;

        elem.setPos = function (n_pos) {
            this.getPos = function () {
                return n_pos;
            };
        };

        elem.setPos(pos);

        elem.nextCell = function () {
            var nextcell = this;
            do {
                nextcell = nextElement.call(nextcell);
            } while (nextcell && nextcell.tagName === 'DIV');
            return nextcell;
        };

        elem.getVal = function (val) {
            return '';
        };

        elem.removeFromSpan = function (pos, newobj) {
            return this._parent.removeFromSpan(pos, newobj);
        };

        elem.checkRemoveSpan = function (pos) {
            return this._parent.checkRemoveSpan(pos);
        };

        partof._placeholders.push(elem);
        return elem;
    }

    /** PIMPS **/

    /**
     * Table
     */
    table.forEveryCell = function (func) {
        var rows = tbody.getElementsByTagName('tr');
        for (var r = 0 ; r < rows.length ; ++r) {
            rows[r].forEveryCell(func);
        }
    };

    /**
     * Rows
     */
    function pimpRow() {
        this.forEveryCell = function (func) {
            for (var c = 0 ; c < this.childNodes.length ; ++c) {
                var elem = this.childNodes[c];
                if (assertType.call(elem, TYPE__CELL)) {
                    func.call(elem);
                }
            }
        };

        this.getPos = function () {
            return parseInt(this.className.match(/row(\d+)/)[1], 10);
        };

        this.setPos = function (nupos) {
            this.className = 'row' + nupos;
        };

        this.move = function (nupos) {
            this.setPos(nupos);
            this.forEveryCell(function () {
                this.setPos([nupos, this.getPos()[1]]);
            });
        };

    }

    var rows = tbody.getElementsByTagName('tr');
    for (var r = 0 ; r < rows.length ; ++r) {
        pimpRow.call(rows[r]);
    }

    /**
     * Cells
     */
    // Attaches focus handlers and methods to a cell.
    function pimp() {
        addEvent(lastChildElement.call(this), 'focus', function () {
            for (var i = 0 ; i < focushandlers.length ; ++i) {
                focushandlers[i].call(this);
            }
        });

        this.nextCell = function () {
            var nextcell = this;
            do {
                nextcell = nextElement.call(nextcell);
            } while (nextcell && !assertType.call(nextcell, TYPE__FIELD) &&
                     nextcell._parent === this);
            return nextcell;
        };

        this.getInpObj = function (name) {
            var tname = lastChildElement.call(this).name.replace('text', name);
            var inputs = this.getElementsByTagName('input');
            for (var i = 0 ; i < inputs.length ; ++i) {
                if (inputs[i].name === tname) {
                    return inputs[i];
                }
            }
        };

        this.getVal = function (name) {
            var val = this.getInpObj(name).value;
            if (name === 'colspan' || name === 'rowspan') {
                val = parseInt(val, 10);
            }
            return val;
        };

        this.setVal = function (name, nuval) {
            this.getInpObj(name).value = nuval;
            if (name === 'rowspan') {
                this.rowSpan = nuval;
            } else if (name === 'colspan') {
                this.colSpan = nuval;
            }
        };

        this.setTag = function (nuval) {
            var nuparent = getNewCell(this, {'tag': nuval});
            nuparent._placeholders = this._placeholders;
            for (var p in this._placeholders) {
                this._placeholders[p]._parent = nuparent;
            }
            this.parentNode.replaceChild(nuparent, this);
            setCurrentField(nuparent);
        };

        this.setAlign = function (nualign) {
            this.setVal('align', nualign);
            this.className = this.className.replace(/\w+align/, nualign +
                                                                'align');
        };

        /**
         * Update position information
         */
        this.setPos = function (pos) {
            var match = /table\[\d+\]\[\d+\]\[(\w+)\]/;
            var newname = 'table[' + pos[0] + '][' + pos[1] + '][$1]';
            for (var i = 0 ; i < this.childNodes.length ; ++i) {
                this.childNodes[i].name = this.childNodes[i].name
                                          .replace(match, newname);
            }
            this.className = this.className.replace(/(.*)col\d+(.*)/,
                                                    '$1col' + pos[1] + '$2');
        };

        /**
         * Get position information
         */
        this.getPos = function () {
            return lastChildElement.call(this).name
                   .match(/table\[(\d+)\]\[(\d+)\]/).slice(1)
                   .map(function (v) { return parseInt(v, 10); });
        };

        this.getBottom = function () {
            return this.getLast(getCellBelow);
        };

        this.getRight = function () {
            return this.getLast(nextElement);
        };

        this.getLast = function (func) {
            var node = this;
            var nextnode = func.call(node);
            while (nextnode && nextnode._parent === this) {
                node = nextnode;
                nextnode = func.call(node);
            }
            return node;
        };

        this.checkRemoveSpan = function (pos) {
            if (this.getVal('rowspan') === 1) pos[0] = '*';
            if (this.getVal('colspan') === 1) pos[1] = '*';
            return (pos[0] !== '*' && pos[1] !== '*') ? false : pos;
        };

        this.removeFromSpan = function (pos, template_func) {
            pos = this.checkRemoveSpan(pos);
            if (pos === false) return false;

            function handle(elem) {
                if (template_func) {
                    elem.parentNode.replaceChild(template_func(elem), elem);
                } else {
                    elem.parentNode.removeChild(elem);
                }
            }

            if (pos[0] === '*' && pos[1] === '*') {
                for (var pholder in this._placeholders) {
                    handle(this._placeholders[pholder]);
                }
                handle(this);
                return;
            }

            var ops = (pos[0] === '*') ?
                        {'span': 'colspan', 'index': 1,
                         'getnext': nextElement} :
                        {'span': 'rowspan', 'index': 0,
                         'getnext': getCellBelow};
            var spanval = this.getVal(ops.span);
            if (spanval > 1) {
                this.setVal(ops.span, spanval - 1);
            }

            pos[ops.index] = pos[ops.index].getPos()[ops.index];

            if (this.getPos()[ops.index] === pos[ops.index]) {
                // The main node is to be deleted, so move it to a safe place.
                var oldplaceholder = ops.getnext.call(this);
                var pholder_insertpoint = this.nextSibling;
                var pholder_pnode = this.parentNode;
                var c_pos = this.getPos();
                this.setPos(oldplaceholder.getPos());
                oldplaceholder.setPos(c_pos);
                if (pholder_insertpoint !== oldplaceholder) {
                    oldplaceholder.parentNode.replaceChild(this, oldplaceholder);
                    pholder_pnode.insertBefore(oldplaceholder, pholder_insertpoint);
                }
            }

            var newp = [];
            for (var pholder in this._placeholders) {
                var placeholder = this._placeholders[pholder];
                var c_pos = placeholder.getPos();
                if (c_pos[ops.index] === pos[ops.index]) {
                    handle(placeholder);
                } else {
                    // not a target
                    newp.push(placeholder);
                }
            }
            this._placeholders = newp;
        };

        this.addToSpan = function (pos, check) {
            var ops = (pos[0] === '*') ?
                      {'span': 'colspan', 'index': 1, 'getnext': getCellBelow,
                       'ospan': 'rowspan'} :
                      {'span': 'rowspan', 'index': 0, 'getnext': nextElement,
                       'ospan': 'colspan'};

            var span = this.getVal(ops.ospan);
            var node = pos[ops.index];
            for (var n = 0 ; n < span ; ++n) {
                if (node === null ||
                    node.checkRemoveSpan([node, node]) === false) {
                    return false;
                }
                node = ops.getnext.call(node);
            }

            if (check) return true;

            var spanval = this.getVal(ops.span);
            this.setVal(ops.span, spanval + 1);

            var node = pos[ops.index];
            var _this = this;
            function spawnPlaceholder (placeholder) {
                    return getNewPlaceholder(placeholder.getPos(), _this);
            }
            for (var n = 0 ; n < span ; ++n) {
                var nnode = ops.getnext.call(node);

                if (node.getVal('text') !== '') {
                    this.setVal('text', this.getVal('text') + ' ' +
                                        node.getVal('text'));
                }

                node.removeFromSpan([node, node], spawnPlaceholder);
                node = nnode;
            }
        };
    }

    // Attach focus handlers and methods to every cell.
    table.forEveryCell(pimp);

    // Insert rowspan and colspan placeholder.
    table.forEveryCell(function () {
        if (!assertType.call(this, TYPE__FIELD)) return;
        this._placeholders = [];
        var colspan = this.getVal('colspan');
        var pos = this.getPos();
        while (colspan-- > 1) {
            this.parentNode.insertBefore(getNewPlaceholder([pos[0],
                                                            pos[1] + colspan],
                                                           this),
                                         nextElement.call(this));
        }
        var rowspan = this.getVal('rowspan');
        var insertpoint = getCellBelow.call(this);
        var placeholder = this;
        for (var c = 1; c < rowspan; ++c) {
            var trow = insertpoint ? insertpoint.parentNode :
                       nextElement.call(placeholder.parentNode);
            placeholder = getNewPlaceholder([pos[0] + c, pos[1]], this);
            trow.insertBefore(placeholder, insertpoint);

            // Move subsequent cell names
            var ncell = insertpoint;
            while (ncell) {
                var m_pos = ncell.getPos();
                ncell.setPos([m_pos[0], m_pos[1] + this.getVal('colspan')]);
                ncell = nextElement.call(ncell);
            }

            insertpoint = getCellBelow.call(placeholder);
        }
    });

    /**
     * Toolbar
     */
    function prepareButton(button, click_handler, update_handler) {
        // Click handler
        addEvent(button, 'click', function () {
            var nextcur = cur_field ? click_handler() :
                          tbody.rows[0].cells[1];
            if (!nextcur) {
                nextcur = cur_field;
            }
            setCurrentField(nextcur);
            return false;
        });

        // Update the button’s state
        button.update = function () {
            if (!cur_field) return;
            var state = update_handler.call(this);
            this.className = 'toolbutton';
            if (state[0]) this.className += ' selected';
            if (state[1]) this.className += ' disabled';
            this.disabled = state[1];
        };
        focushandlers.push(function () {button.update.call(button); });
        return button;
    }

    // window scope needed for these
    window.addBtnActionToggletag = function (button) {
        return prepareButton(button,
        function () {
            cur_field.setTag(cur_field.getVal('tag') === 'th' ? 'td' : 'th');
        }, function () {
            return [cur_field.getVal('tag') === 'th', false];
        });
    }

    window.addBtnActionVal = function (button, arr) {
        var ucase = arr.prop.charAt(0).toUpperCase() + arr.prop.substring(1);
        return prepareButton(button,
        function () {
            cur_field['set' + ucase](arr.val);
        }, function () {
            return [cur_field.getVal(arr.prop) === arr.val, false];
        });
    }

    window.addBtnActionSpan = function (button, arr) {
        var target = ['*', '*'];
        var ops = arr.target === 'col' ?
                  {index: 1, next: [nextElement, 'getRight']} :
                  {index: 0, next: [getCellBelow, 'getBottom']};

        if (arr.ops === '+') {
            return prepareButton(button,
            function () {
                target[ops.index] = ops.next[0].call(cur_field[ops.next[1]]());
                cur_field.addToSpan(target);
            }, function () {
                target[ops.index] = ops.next[0].call(cur_field[ops.next[1]]());
                return [false, !cur_field.addToSpan(target, true)];
            });
        } else {
            return prepareButton(button,
            function () {
                target[ops.index] = cur_field[ops.next[1]]();
                cur_field.removeFromSpan(target, function (placeholder) {
                        return getNewCell(placeholder._parent, {'text': '', 'colspan': 1, 'rowspan': 1, 'pos': placeholder.getPos()});});
            }, function () {
                return [false, cur_field.getVal(arr.target +  'span') === 1];
            });
        }
    }

    window.addBtnActionStructure = function (button, arr) {
        var click_handler = null, update = null;
        var ops = arr.target === 'row' ?
                {next: getCellBelow, prev: getCellAbove} :
                {next: nextElement, prev: previousElement};

        if (arr.ops === '+') {
            update = function () {return [false, false];};
        } else {
            getNextcur = function () {
                var nextcur = ops.next.call(cur_field);
                if (!assertType.call(nextcur, TYPE__CELL)) {
                    nextcur = ops.prev.call(cur_field);
                }
                return nextcur;
            }
            update = function () {
                return [false, !assertType.call(getNextcur(), TYPE__CELL)];
            };
        }

        if (arr.ops === '+' && arr.target === 'row') {
            click_handler = function () {
                var row = cur_field.parentNode;
                var newrow = document.createElement('tr');
                pimpRow.call(newrow);
                newrow.setPos(row.getPos() + 1);

                // Insert new cells.
                row.forEveryCell(function () {
                    var root = this._parent ? this._parent : this;
                    var newnode = null;
                    var below = getCellBelow.call(this);
                    if  (below && root === below._parent) {
                        // TODO: Abstraction fail
                        root.setVal('rowspan', root.getVal('rowspan') + 1);
                        var pos = root.getPos();
                        newnode = getNewPlaceholder([pos[0] + 1, pos[1]], root);
                    } else {
                        var pos = this.getPos();
                        ++pos[0];
                        newnode = getNewCell(root, {'pos': pos, 'text': '',
                                                    'colspan': 1, 'rowspan': 1});
                    }
                    newrow.appendChild(newnode);
                });

                // Insert row.
                var nextrow = nextElement.call(row);
                row.parentNode.insertBefore(newrow, nextrow);

                // Update pos information in rows after the new one.
                while (nextrow) {
                    nextrow.move(nextrow.getPos() + 1);
                    nextrow = nextElement.call(nextrow);
                }

                addHandle.call(newrow, 'row', newrow.firstChild);
                return firstChildElement.call(newrow);
            };
        } else if (arr.ops === '-' && arr.target === 'row') {
            click_handler = function () {
                var row = cur_field.parentNode;

                var nextcur = getNextcur();
                if (!nextcur) return;
                if (nextcur._parent) nextcur = nextcur._parent;

                while (row.hasChildNodes()) {
                    var c = row.childNodes[0];
                    if (c.removeFromSpan) {
                        c.removeFromSpan([c, '*']);
                    } else {
                        row.removeChild(c);
                    }
                }

                // Remove row.
                row.parentNode.removeChild(row);

                // Update pos information in rows after the new one.
                var nextrow = nextElement.call(row);
                while (nextrow) {
                    nextrow.move(nextrow.getPos() - 1);
                    nextrow = nextElement.call(nextrow);
                }
                return nextcur;
            };
        } else if (arr.ops === '+' && arr.target === 'col') {
            click_handler = function () {
                var col = cur_field.getPos()[1] + cur_field.getVal('colspan');
                for (var i = 0 ; i < tbody.rows.length ; ++i) {
                    var ins = null;
                    tbody.rows[i].forEveryCell(function () {
                        var pos = this.getPos();
                        if (ins === null && pos[1] === col) {
                            ins = this;
                        }
                        if (ins !== null) {
                            pos[1]++;
                            this.setPos(pos);
                        }
                    });
                    var newnode = null;
                    if  (ins && ins._parent) {
                        // TODO: Abstraction fail
                        var root = ins._parent ? ins._parent : ins;
                        root.setVal('colspan', root.getVal('colspan') + 1);
                        var pos = previousElement.call(ins).getPos();
                        newnode = getNewPlaceholder([i + 1, pos[1] + 1], root);
                    } else {
                        newnode = getNewCell(null, {'pos': [i + 1, col], 'text': '',
                                                    'colspan': 1, 'rowspan': 1});
                    }
                    tbody.rows[i].insertBefore(newnode, ins);
                }
                addHandle.call(table.tHead.rows[0], 'col', null);
                return cur_field.nextCell();
            };
        } else {
            click_handler = function () {
                var col = cur_field.getPos()[1] +
                          cur_field.getVal('colspan') - 1;
                var nextcur = getNextcur();
                if (!nextcur) return;
                if (nextcur._parent) nextcur = nextcur._parent;

                for (var i = 0 ; i < tbody.rows.length ; ++i) {
                    var ins = null;
                    tbody.rows[i].forEveryCell(function () {
                        var pos = this.getPos();
                        if (ins === null && pos[1] === col) {
                            ins = this;
                        } else if (ins !== null) {
                            pos[1]--;
                            this.setPos(pos);
                        }
                    });
                    ins.removeFromSpan([ins, ins]);
                }
                table.tHead.rows[0].removeChild(lastChildElement.call(table.tHead.rows[0]));

                return nextcur;
            };
        }
        return prepareButton(button, click_handler, update);
    };

    initToolbar('tool__bar', 'dw__editform', window.table_toolbar);

    /**
     * Drag ’n’ drop
     */
    drag.marker = document.createElement('span');
    drag.marker.innerHTML = '|';
    drag.marker.style.marginRight = '-0.4em';
    drag.marker.style.cssFloat = 'right';
    drag.marker.style.marginTop = '-1.5em';

    // Massively ugly copy and paste from drag.js
    drag.handlers.start.pre.push(function (e) {
        // If there is (row|col)span on (row|col) move, die.
        var _break = false;
        if (e.target.className.match(/rowhandle/)) {
            e.target.parentNode.forEveryCell(function () {
                var node = this;
                if (node._parent) node = node._parent;
                if (node.rowSpan > 1) {
                    _break = true;
                }
            });
        } else {
            var pos = countCols.call(e.target.parentNode, e.target) - 1;
            for (var i = 0 ; i < tbody.rows.length ; ++i) {
                var elem = tbody.rows[i].childNodes[pos];
                while (elem && (!elem.getPos || elem.getPos()[1] !== pos)) {
                    elem = nextElement.call(elem);
                }
                if (elem._parent) elem = elem._parent;
                if (elem.colSpan > 1) {
                    _break = true;
                }
            }
        }
        return !_break;
    });

    drag.handlers.drag.post.push(function(e) {
        // Move marker
        if (drag.handle.className.match(/rowhandle/)) {
            var row = findRow(drag.evY(e));
            if (row !== -1) {
                table.rows[row].cells[0].appendChild(drag.marker);
            }
        } else {
            var col = findColumn(drag.evX(e));
            if (col !== -1) {
                table.tHead.rows[0].cells[col].appendChild(drag.marker);
            }
        }
    });

    drag.handlers.stop.pre.push(function(){
        var src = drag.obj;

        // Do the move
        var target = drag.marker.parentNode;
        if (!target) return true;

        // Are we moving a row or a column?
        if (src.className.match(/rowhandle/)) {
            // Move row HTML element.
            var ins = target.parentNode.getPos ? target.parentNode.nextSibling : tbody.rows[0];
            ins.parentNode.insertBefore(src.parentNode, ins);

            // Rebuild pos information after move.
            for (var r = 0 ; r < tbody.rows.length ; ++r) {
                rows[r].move(r);
            }

            setCurrentField(src.parentNode.cells[1]);
        } else {
            var from = countCols.call(src.parentNode, src) - 1;
            var to = countCols.call(target.parentNode, target);

            for (var i = 0 ; i < tbody.rows.length ; ++i) {
                var obj = null;
                var ins = null;
                var diffs = [];
                tbody.rows[i].forEveryCell(function () {
                    var pos = this.getPos();
                    if (ins === null && pos[1] === to) {
                        ins = this;
                    }
                    if (obj === null && pos[1] === from) {
                        obj = this;
                    } else if (ins === null ^ obj === null) {
                        diffs.push([this, (ins === null)]);
                    }
                });
                if (obj === ins) continue;
                for (var n in diffs) {
                    var pos = diffs[n][0].getPos();
                    pos[1] = pos[1] + (diffs[n][1] ? -1 : 1);
                    diffs[n][0].setPos(pos);
                }
                obj.setPos([obj.getPos()[0], to - (to > from ? 1 : 0)]);
                tbody.rows[i].insertBefore(obj, ins);
            }
            setCurrentField(obj);
        }

        drag.marker.parentNode.removeChild(drag.marker);
        return true;
    });

    // Add handles to rows and columns.
    function addHandle(text, before) {
        var handle = document.createElement('TD');
        handle.innerHTML = text + 'handle';
        handle.className = text + 'handle';
        drag.attach(handle);
        this.insertBefore(handle, before);
    }

    var newrow = document.createElement('TR');
    newrow.className = 'handle';
    table.tHead.appendChild(newrow);
    for (var i = countCols.call(tbody.rows[0], null) ; i > 0 ; --i) {
        addHandle.call(newrow, 'col', newrow.firstChild);
    }
    newrow.insertBefore(document.createElement('TD'), newrow.firstChild);

    for (var r = 0 ; r < tbody.rows.length ; ++r) {
        addHandle.call(tbody.rows[r], 'row', tbody.rows[r].firstChild);
    }
});
