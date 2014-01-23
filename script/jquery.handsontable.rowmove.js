/**
 * Handle Row Moves on our Editor
 *
 * based on the example plugin that comes with Handsontable but simplified and adjusted to work on our
 * custom data/meta datastructure
 *
 * @author Andreas Gohr <andi@cosmocode.de>
 * @constructor
 */
function EditTableRowMove() {
    var pressed,
        startRow,
        endRow,
        startY,
        startOffset;

    var ghost = document.createElement('DIV'),
        ghostStyle = ghost.style;

    ghost.className = 'ghost';
    ghostStyle.position = 'absolute';
    ghostStyle.top = '25px';
    ghostStyle.left = '50px';
    ghostStyle.width = '10px';
    ghostStyle.height = '10px';
    ghostStyle.backgroundColor = '#CCC';
    ghostStyle.opacity = 0.7;

    /**
     * Attach all the events
     */
    var bindMoveRowEvents = function () {
        var instance = this;

        /**
         * during drag operation
         */
        instance.rootElement.on('mousemove.editTableRowMove', function (e) {
            if (pressed) {
                ghostStyle.top = startOffset + e.pageY - startY + 6 + 'px';
                if (ghostStyle.display === 'none') {
                    ghostStyle.display = 'block';
                }
            }
        });

        /**
         * end of drag operation
         *
         * The row move is executed here
         */
        instance.rootElement.on('mouseup.editTableRowMove', function () {
            if (pressed) {
                if (startRow < endRow) {
                    endRow--;
                }
                if (instance.getSettings().colHeaders) {
                    startRow--;
                    endRow--;
                }
                jQuery('.editTableRowMover.active').removeClass('active');
                pressed = false;
                ghostStyle.display = 'none';

                // rows are off by one
                startRow += 1;
                endRow += 1;

                if (startRow == endRow)  return;

                // if this row is part of a row span, do not move
                if (instance.raw.rowinfo[endRow].rowspan) return;

                // swap the rows
                instance.raw.data.splice(endRow, 0, instance.raw.data.splice(startRow, 1)[0]);
                instance.raw.meta.splice(endRow, 0, instance.raw.meta.splice(startRow, 1)[0]);

                instance.forceFullRender = true;
                instance.view.render(); //updates all
            }
        });

        /**
         * start drag operation
         */
        instance.rootElement.on('mousedown.editTableRowMove', '.editTableRowMover', function (e) {

            var mover = e.currentTarget;
            var TH = instance.view.wt.wtDom.closest(mover, 'TH');
            startRow = instance.view.wt.wtDom.index(TH.parentNode) + instance.rowOffset();
            endRow = startRow;
            pressed = true;
            startY = e.pageY;

            var TABLE = instance.$table[0];
            TABLE.parentNode.appendChild(ghost);
            ghostStyle.height = instance.view.wt.wtDom.outerHeight(TH) + 'px';
            ghostStyle.width = instance.view.wt.wtDom.outerWidth(TABLE) + 'px';
            startOffset = parseInt(instance.view.wt.wtDom.offset(TH).top - instance.view.wt.wtDom.offset(TABLE).top, 10);
            ghostStyle.top = startOffset + 6 + 'px';
        });

        /**
         * on mouseover, show drag handle
         */
        instance.rootElement.on('mouseenter.editTableRowMove', 'td, th', function () {
            if (pressed) {
                var active = instance.view.TBODY.querySelector('.editTableRowMover.active');
                if (active) {
                    instance.view.wt.wtDom.removeClass(active, 'active');
                }
                endRow = instance.view.wt.wtDom.index(this.parentNode) + instance.rowOffset();

                // if this row is part of a row span, do not move
                if (instance.raw.rowinfo[endRow].rowspan) return;

                var THs = instance.view.TBODY.querySelectorAll('th');
                var mover = THs[endRow].querySelector('.editTableRowMover');
                instance.view.wt.wtDom.addClass(mover, 'active');
            }
        });

        instance.addHook('afterDestroy', unbindMoveRowEvents);
    };

    /**
     * Remove all the Events
     */
    var unbindMoveRowEvents = function () {
        var instance = this;
        instance.rootElement.off('mouseup.editTableRowMove');
        instance.rootElement.off('mousemove.editTableRowMove');
        instance.rootElement.off('mousedown.editTableRowMove');
        instance.rootElement.off('mouseenter.editTableRowMove');
    };

    /**
     * Initialize the plugin
     */
    this.init = function () {
        var instance = this;
        var editTableRowMoveEnabled = !!(this.getSettings().editTableRowMove);

        if (editTableRowMoveEnabled) {
            instance.forceFullRender = true;
            bindMoveRowEvents.call(this);

        } else {
            unbindMoveRowEvents.call(this);
        }
    };

    /**
     * Add a move handler to each row head
     *
     * @param row
     * @param TH
     */
    this.getRowHeader = function (row, TH) {
        if (row > -1 && this.getSettings().editTableRowMove) {
            // if this row is part of a row span, do not add move handle
            if (this.raw.rowinfo[row].rowspan) return;

            var DIV = document.createElement('DIV');
            DIV.className = 'editTableRowMover';
            TH.firstChild.appendChild(DIV);
        }
    };
}

var htEditTableRowMove = new EditTableRowMove();

Handsontable.PluginHooks.add('afterInit', function () {
    htEditTableRowMove.init.call(this);
});

Handsontable.PluginHooks.add('afterGetRowHeader', htEditTableRowMove.getRowHeader);
