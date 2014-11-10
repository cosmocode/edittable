<?php
/**
 * Table editor
 *
 * @author Adrian Lang <lang@cosmocode.de>
 * @author Andreas Gohr <gohr@cosmocode.de>
 */

if(!defined('DOKU_INC')) die();
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN', DOKU_INC.'lib/plugins/');

/**
 * handles all the editor related things
 *
 * like displaying the editor and adding custom edit buttons
 */
class action_plugin_edittable_editor extends DokuWiki_Action_Plugin {

    /**
     * Register its handlers with the DokuWiki's event controller
     */
    function register(Doku_Event_Handler $controller) {
        // register custom edit buttons
        $controller->register_hook('HTML_SECEDIT_BUTTON', 'BEFORE', $this, 'secedit_button');

        // register our editor
        $controller->register_hook('HTML_EDIT_FORMSELECTION', 'BEFORE', $this, 'editform');

        // register preprocessing for accepting editor data
        // $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handle_table_post');
        $controller->register_hook('PLUGIN_EDITTABLE_PREPROCESS_EDITOR', 'BEFORE', $this, 'handle_table_post');
    }

    /**
     * Add a custom edit button under each table
     *
     * The target 'table' is provided by DokuWiki's XHTML core renderer in the table_close() method
     *
     * @param Doku_Event $event
     */
    function secedit_button(Doku_Event $event) {
        if($event->data['target'] !== 'table') {
            return;
        }
        $event->data['name'] = $this->getLang('secedit_name');
    }

    /**
     * Creates the actual Table Editor form
     *
     * @param Doku_Event $event
     */
    function editform(Doku_Event $event) {
        global $TEXT;
        global $RANGE;

        if($event->data['target'] !== 'table') return;
        if(!$RANGE){
            // section editing failed, use default editor instead
            $event->data['target'] = 'section';
            return;
        }

        $event->stopPropagation();
        $event->preventDefault();

        /** @var renderer_plugin_edittable_json $Renderer our own renderer to convert table to array */
        $Renderer     = plugin_load('renderer', 'edittable_json', true);
        $instructions = p_get_instructions($TEXT);

        // Loop through the instructions
        foreach($instructions as $instruction) {
            // Execute the callback against the Renderer
            call_user_func_array(array(&$Renderer, $instruction[0]), $instruction[1]);
        }

        // output data and editor field

        /** @var Doku_Form $form */
        $form =& $event->data['form'];

        // data for handsontable
        $form->addHidden('edittable_data', $Renderer->getDataJSON());
        $form->addHidden('edittable_meta', $Renderer->getMetaJSON());
        $form->addElement('<div id="edittable__editor"></div>');

        // FIXME add explanation here
        if(isset($_POST['edittable__new'])) {
            foreach($_POST['edittable__new'] as $k => $v) {
                $form->addHidden("edittable__new[$k]", $v);
            }
        }

        // set target and range to keep track during previews
        $form->addHidden('target', 'table');
        $form->addHidden('range', $RANGE);
    }

    /**
     * Handles a POST from the table editor
     *
     * This function preprocesses a POST from the table editor and converts it to plain DokuWiki markup
     *
     * @author Andreas Gohr <gohr@cosmocode,de>
     */
    public function handle_table_post($event) {
        global $TEXT;
        global $INPUT;
        if(!$INPUT->post->has('edittable_data')) return;

        $json = new JSON(JSON_LOOSE_TYPE);
        $data = $json->decode($INPUT->post->str('edittable_data'));
        $meta = $json->decode($INPUT->post->str('edittable_meta'));

        $TEXT = $this->build_table($data, $meta);
    }

    /**
     * Create a DokuWiki table
     *
     * converts the table array to plain wiki markup text. pads the table so the markup is easy to read
     *
     * @param array $data table content for each cell
     * @param array $meta meta data for each cell
     * @return string
     */
    public function build_table($data, $meta) {
        $table = '';
        $rows  = count($data);
        $cols  = $rows ? count($data[0]) : 0;

        $colmax = $cols ? array_fill(0, $cols, 0) : array();

        // find maximum column widths
        for($row = 0; $row < $rows; $row++) {
            for($col = 0; $col < $cols; $col++) {
                $len = utf8_strlen($data[$row][$col]);

                // alignment adds padding
                if($meta[$row][$col]['align'] == 'center') {
                    $len += 4;
                } else {
                    $len += 3;
                }

                // remember lenght
                $meta[$row][$col]['length'] = $len;

                if($len > $colmax[$col]) $colmax[$col] = $len;
            }
        }

        $last = '|'; // used to close the last cell
        for($row = 0; $row < $rows; $row++) {
            for($col = 0; $col < $cols; $col++) {

                // minimum padding according to alignment
                if($meta[$row][$col]['align'] == 'center') {
                    $lpad = 2;
                    $rpad = 2;
                } elseif($meta[$row][$col]['align'] == 'right') {
                    $lpad = 2;
                    $rpad = 1;
                } else {
                    $lpad = 1;
                    $rpad = 2;
                }

                // target width of this column
                $target = $colmax[$col];

                // colspanned columns span all the cells
                for($i = 1; $i < $meta[$row][$col]['colspan']; $i++) {
                    $target += $colmax[$col + $i];
                }

                // copy colspans to rowspans below if any
                if($meta[$row][$col]['colspan'] > 1){
                    for($i = 1; $i < $meta[$row][$col]['rowspan']; $i++) {
                        $meta[$row + $i][$col]['colspan'] = $meta[$row][$col]['colspan'];
                    }
                }

                // how much padding needs to be added?
                $length = $meta[$row][$col]['length'];
                $addpad = $target - $length;

                // decide which side needs padding
                if($meta[$row][$col]['align'] == 'right') {
                    $lpad += $addpad;
                } else {
                    $rpad += $addpad;
                }

                // add the padding
                $cdata = $data[$row][$col];
                if(!$meta[$row][$col]['hide'] || $cdata) {
                    $cdata = str_pad('', $lpad).$cdata.str_pad('', $rpad);
                }

                // finally add the cell
                $last   =  ($meta[$row][$col]['tag'] == 'th') ? '^' : '|';
                $table .= $last;
                $table .= $cdata;
            }

            // close the row
            $table .= "$last\n";
        }
        $table = rtrim($table, "\n");

        return $table;
    }

}