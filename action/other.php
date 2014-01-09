<?php
/**
 * Table editor
 *
 * @author     Adrian Lang <lang@cosmocode.de>
 */

if(!defined('DOKU_INC')) die();
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');

class action_plugin_edittable_other extends DokuWiki_Action_Plugin {

    /**
     * Register its handlers with the DokuWiki's event controller
     */
    function register(Doku_Event_Handler &$controller) {

        $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handle_table_post');
        $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handle_newtable');

        $controller->register_hook('TOOLBAR_DEFINE', 'AFTER', $this, 'toolbar');
        $controller->register_hook('ACTION_SHOW_REDIRECT', 'BEFORE', $this, 'jump_to_section');
    }

    function getLang($id) {
        $r = parent::getLang($id);
        if ($r !== '') return $r;

        $js = parent::getLang('js');
        return $js[$id];
    }

    function toolbar(&$event) {
        $menu = array(
                    array('title'  => $this->getLang('toggle_header'),
                          'key'    => 'H',
                          'icon'   => 'text_heading.png',
                          'type'   => 'toggletag'),

                    array('title'  => $this->getLang('val_align_left'),
                          'key'    => 'N',
                          'icon'   => 'a_left.png',
                          'type'   => 'val',
                          'prop'   => 'align',
                          'class'  => 'separator',
                          'val'    => 'left'),

                    array('title'  => $this->getLang('val_align_center'),
                          'key'    => 'M',
                          'icon'   => 'a_center.png',
                          'type'   => 'val',
                          'prop'   => 'align',
                          'val'    => 'center'),

                    array('title'  => $this->getLang('val_align_right'),
                          'key'    => 'R',
                          'icon'   => 'a_right.png',
                          'type'   => 'val',
                          'prop'   => 'align',
                          'val'    => 'right'),

                    array('title'  => $this->getLang('span_col_plus'),
                          'icon'   => 'merge_right.png',
                          'type'   => 'span',
                          'class'  => 'separator',
                          'target' => 'col',
                          'ops'    => '+'),

                    array('title'  => $this->getLang('span_col_minus'),
                          'icon'   => 'split_right.png',
                          'type'   => 'span',
                          'target' => 'col',
                          'ops'    => '-'),

                    array('title'  => $this->getLang('span_row_plus'),
                          'icon'   => 'merge_down.png',
                          'type'   => 'span',
                          'class'  => 'separator',
                          'target' => 'row',
                          'ops'    => '+'),

                    array('title'  => $this->getLang('span_row_minus'),
                          'icon'   => 'split_down.png',
                          'type'   => 'span',
                          'target' => 'row',
                          'ops'    => '-'),

                    array('title'  => $this->getLang('struct_row_plus'),
                          'icon'   => 'row_insert.png',
                          'type'   => 'structure',
                          'class'  => 'separator',
                          'target' => 'row',
                          'ops'    => '+'),

                    array('title'  => $this->getLang('struct_row_minus'),
                          'icon'   => 'row_delete.png',
                          'type'   => 'structure',
                          'target' => 'row',
                          'ops'    => '-'),

                    array('title'  => $this->getLang('struct_col_plus'),
                          'icon'   => 'column_add.png',
                          'type'   => 'structure',
                          'class'  => 'separator',
                          'target' => 'col',
                          'ops'    => '+'),

                    array('title'  => $this->getLang('struct_col_minus'),
                          'icon'   => 'column_delete.png',
                          'type'   => 'structure',
                          'target' => 'col',
                          'ops'    => '-'),
        );
        foreach ($menu as &$entry) {
            $entry['icon'] = '../../plugins/edittable/images/' . $entry['icon'];
        }

        // use JSON to build the JavaScript array
        $json = new JSON();
        echo 'var table_toolbar = '.$json->encode($menu).';'.DOKU_LF;

        $event->data[] = array('title'  => $this->getLang('add_table'),
                               'type'   => 'insertTable',
                               'icon'   => '../../plugins/edittable/images/add_table.png');
    }

    /**
     * Handles a POST from the table editor
     *
     * This function preprocesses a POST from the table editor. It converts the
     * table array to plain wiki markup text and stores it in the global $TEXT.
     *
     * @author Adrian Lang <lang@cosmocode.de>
     */
    function handle_table_post($event) {
        if (!isset($_POST['table'])) {
            return;
        }
        global $TEXT;
        /** @var helper_plugin_edittable $hlp */
        $hlp = plugin_load('helper', 'edittable');
        $TEXT = $hlp->table_to_wikitext($_POST['table']);
    }

    function handle_newtable($event) {
        if (!isset($_POST['edittable__new'])) {
            return;
        }

        foreach($_POST['edittable__new'] as &$v) {
            // Form performs a formText
            $v = cleanText($v);
        }

        global $TEXT;
        if (isset($_POST['do']['preview'])) {
            // preview view of a table edit
            global $INPUT;
            $INPUT->set('target', 'table');
            $_REQUEST['target'] = 'table';
        } elseif (isset($_POST['do']['edit'])) {
            // edit view of a table (first edit)
            $_REQUEST['target'] = 'table';
            $TEXT = "^  ^  ^\n";
            foreach (explode("\n", $_POST['edittable__new']['text']) as $line) {
                $TEXT .= "| $line |  |\n";
            }
        } elseif (isset($_POST['do']['draftdel'])) {
            $TEXT = $_POST['edittable__new']['pre'] .
                    $_POST['edittable__new']['text'] .
                    $_POST['edittable__new']['suf'];
            global $ACT;
            $ACT = 'edit';
            $_REQUEST['target'] = 'section';
        } elseif (isset($_POST['do']['save'])) {
            // return to edit page
            $TEXT = $_POST['edittable__new']['pre'] .
                    $TEXT .
                    $_POST['edittable__new']['suf'];
            global $ACT;
            $ACT = 'edit';
            $_REQUEST['target'] = 'section';
        }
    }



    /**
     * Jump after save to the section containing this table
     */
    function jump_to_section(&$event) {
        if (!isset($_POST['table'])) {
            return;
        }

        global $PRE;
        if(preg_match_all('/^\s*={2,}([^=\n]+)/m',$PRE,$match, PREG_SET_ORDER)) {
            $check = false; //Byref
            $match = array_pop($match);
            $event->data['fragment'] = sectionID($match[1], $check);
        }
    }
}
