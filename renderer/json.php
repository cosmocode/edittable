<?php
/**
 * Table Renderer for Table Editor
 *
 * This renderer will use the inverse renderer to create Wiki text for everything inside the table. The table
 * it self is stored in two arrays which then can be outputted as JSON.
 *
 * @author     Andreas Gohr <gohr@cosmocode.de>
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl.html)
 */

// must be run within Dokuwiki
if (!defined('DOKU_INC')) die();

require_once DOKU_PLUGIN . "/edittable/renderer/inverse.php";

class renderer_plugin_edittable_json extends renderer_plugin_edittable_inverse {
    /** @var array holds the data cells */
    private $tdata = array();
    /** @var array holds the cell meta data */
    private $tmeta = array();

    /** @var array holds the meta data of the current cell */
    private $tmetacell = array();

    /** @var int current row */
    private $current_row = -1;

    /** @var int current column */
    private $current_col = 0;

    /**
     * Returns the whole table data as two dimensional array
     *
     * @return array
     */
    public function getDataJSON() {
        $json = new JSON();
        return $json->encode($this->tdata);
    }

    /**
     * Returns meta data for all cells in a two dimensional array of arrays
     *
     * @return array
     */
    public function getMetaJSON() {
        $json = new JSON();
        return $json->encode($this->tmeta);
    }

    // renderer functions below

    function table_open($maxcols = null, $numrows = null, $pos = null) {
        // FIXME: is this needed somewhere? $this->_counter['table_begin_pos'] = strlen($this->doc);
    }

    function table_close($pos = null) {
    }

    function tablerow_open() {
        // move counters
        $this->current_row++;
        $this->current_col = 0;
    }

    function tablerow_close() {
        // resort just for better debug readability
        ksort($this->tdata[$this->current_row]);
        ksort($this->tmeta[$this->current_row]);
    }

    function tableheader_open($colspan = 1, $align = null, $rowspan = 1) {
        $this->_tablefield_open('th', $colspan, $align, $rowspan);
    }

    function tableheader_close() {
        $this->_tablefield_close();
    }

    function tablecell_open($colspan = 1, $align = null, $rowspan = 1) {
        $this->_tablefield_open('td', $colspan, $align, $rowspan);
    }

    function tablecell_close() {
        $this->_tablefield_close();
    }

    /**
     * Used for a opening THs and TDs
     *
     * @param $tag
     * @param $colspan
     * @param $align
     * @param $rowspan
     */
    private function _tablefield_open($tag, $colspan, $align, $rowspan) {
        // skip cells that already exist - those are previous (span) cells!
        while(isset($this->tmeta[$this->current_row][$this->current_col])) {
            $this->current_col++;
        }

        // remember these, we use them when closing
        $this->tmetacell = array();
        $this->tmetacell['tag'] = $tag;
        $this->tmetacell['colspan'] = $colspan;
        $this->tmetacell['rowspan'] = $rowspan;
        $this->tmetacell['align'] = $align;

        // empty $doc
        $this->doc = '';
    }

    /**
     * Used for closing THs and TDs
     */
    private function _tablefield_close() {
        // these have been set to the correct cell already
        $row = $this->current_row;
        $col = $this->current_col;

        $this->tdata[$row][$col] = trim(str_replace("\n", ' ', $this->doc)); // no newlines in table cells!
        $this->tmeta[$row][$col] = $this->tmetacell; // as remembered in the open call

        // now fill up missing span cells
        {
            $rowspan = $this->tmetacell['rowspan'];
            $colspan = $this->tmetacell['colspan'];

            for($c = 1; $c < $colspan; $c++) {
                // hide colspanned cell in same row
                $this->tmeta[$row][$col + $c]['hide'] = true;
                $this->tmeta[$row][$col + $c]['rowspan'] = 1;
                $this->tmeta[$row][$col + $c]['colspan'] = 1;
                $this->tdata[$row][$col + $c] = '';

                // hide colspanned rows below if rowspan is in effect as well
                for($r = 1; $r < $rowspan; $r++) {
                    $this->tmeta[$row + $r][$col + $c]['hide'] = true;
                    $this->tmeta[$row + $r][$col + $c]['rowspan'] = 1;
                    $this->tmeta[$row + $r][$col + $c]['colspan'] = 1;
                    $this->tdata[$row + $r][$col + $c] = '';
                }
            }

            // hide rowspanned columns
            for($r = 1; $r < $rowspan; $r++) {
                $this->tmeta[$row + $r][$col]['hide'] = true;
                $this->tmeta[$row + $r][$col]['rowspan'] = 1;
                $this->tmeta[$row + $r][$col]['colspan'] = 1;
                $this->tdata[$row + $r][$col] = ':::';
            }
        }
    }
}
