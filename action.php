<?php
/**
 * Example Action Plugin:   Example Component.
 *
 * @author     Samuele Tognini <samuele@cli.di.unipi.it>
 */

if(!defined('DOKU_INC')) die();
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once DOKU_PLUGIN.'action.php';

class action_plugin_edittable extends DokuWiki_Action_Plugin {

    /**
     * return some info
     */
    function getInfo(){
        return array('author' => 'Me name',
                     'email'  => 'myname@example.org',
                     'date'   => '2006-12-17',
                     'name'   => 'Example (action plugin component)',
                     'desc'   => 'Example action functions.',
                     'url'    => 'http://www.example.org');
    }

    /**
     * Register its handlers with the DokuWiki's event controller
     */
    function register(&$controller) {
        $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handle_table_post');
        $controller->register_hook('HTML_EDIT_FORMSELECTION', 'BEFORE', $this, 'html_table_editform');
        $controller->register_hook('TOOLBAR_DEFINE', 'AFTER', $this, 'toolbar');
    }

    function toolbar($event) {
        $menu = array(
                    array('title' => $this->getLang('toggle_header'),
                          'key' => 'H',
                          'icon' => 'text_heading.png',
                          'type' => 'toggletag'),

                    array('title' => $this->getLang('val_align_left'),
                          'key' => 'L',
                          'icon' => 'a_left.png',
                          'type' => 'val',
                          'prop' => 'align',
                          'val' => 'left'),

                    array('title' => $this->getLang('val_align_center'),
                          'key' => 'C',
                          'icon' => 'a_center.png',
                          'type' => 'val',
                          'prop' => 'align',
                          'val' => 'center'),

                    array('title' => $this->getLang('val_align_right'),
                          'key' => 'R',
                          'icon' => 'a_right.png',
                          'type' => 'val',
                          'prop' => 'align',
                          'val' => 'right'),

                    array('title' => $this->getLang('span_col_plus'),
                          'icon' => 'more.png',
                          'type' => 'span',
                          'target' => 'col',
                          'ops' => '+'),

                    array('title' => $this->getLang('span_col_minus'),
                          'icon' => 'less.png',
                          'type' => 'span',
                          'target' => 'col',
                          'ops' => '-'),

                    array('title' => $this->getLang('span_row_plus'),
                          'icon' => 'more.png',
                          'type' => 'span',
                          'target' => 'row',
                          'ops' => '+'),

                    array('title' => $this->getLang('span_row_minus'),
                          'icon' => 'less.png',
                          'type' => 'span',
                          'target' => 'row',
                          'ops' => '-'),

                    array('title' => $this->getLang('struct_row_plus'),
                          'icon' => 'row_insert.png',
                          'type' => 'structure',
                          'target' => 'row',
                          'ops' => '+'),

                    array('title' => $this->getLang('struct_row_minus'),
                          'icon' => 'row_delete.png',
                          'type' => 'structure',
                          'target' => 'row',
                          'ops' => '-'),

                    array('title' => $this->getLang('struct_col_plus'),
                          'icon' => 'column_add.png',
                          'type' => 'structure',
                          'target' => 'col',
                          'ops' => '+'),

                    array('title' => $this->getLang('struct_col_minus'),
                          'icon' => 'column_delete.png',
                          'type' => 'structure',
                          'target' => 'col',
                          'ops' => '-'),
        );
        foreach ($menu as &$entry) {
            $entry['icon'] = '../../plugins/edittable/images/' . $entry['icon'];
        }

        // use JSON to build the JavaScript array
        $json = new JSON();
        echo 'var table_toolbar = '.$json->encode($menu).';'.DOKU_LF;
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

        // Preprocess table for rowspan, make table 0-based.
        $table = array();
        foreach($_POST['table'] as $i => $row) {
            if (!isset($table[$i - 1])) $table[$i - 1] = array();
            foreach ($row as $cell) {
                $nextkey = 0;
                while (isset($table[$i - 1][$nextkey])) {$nextkey++;}
                $nextkey += $cell['colspan'] - 1;
                $table[$i - 1][$nextkey] = $cell;
                $rowspan = $cell['rowspan'];
                $i2 = $i;
                while ($rowspan-- > 1) {
                    if (!isset($table[$i2])) $table[$i2] = array();
                    $nu_cell = $cell;
                    $nu_cell['text'] = ':::';
                    $nu_cell['rowspan'] = 1;
                    $table[$i2++][$nextkey] = $nu_cell;
                }
            }
            ksort(&$table[$i - 1]);
        }

        // Get the length of a row including all previous rows for table
        // prettyprinting.
        $rightpos = array();
        foreach($table as $row) {
            foreach($row as $n => $cell) {
                $pos = (strlen($cell['text']) + $cell['colspan'] +
                        ($cell['align'] === 'center' ? 4 : 3)) +
                       ($n > 0 ? $rightpos[$n - $cell['colspan']] : 0);
                if (!isset($rightpos[$n]) || $rightpos[$n] < $pos) {
                    $rightpos[$n] = $pos;
                }
            }
        }

        // Write the table.
        $types = array('th' => '^', 'td' => '|');
        $str = '';
        foreach ($table as $row) {
            $pos = 0;
            foreach ($row as $n => $cell) {
                $pos += strlen($cell['text']) + $cell['colspan'];
                $pad = $rightpos[$n] - $pos;
                $pos += $pad;
                switch ($cell['align']) {
                case 'right': case '':
                    $lpad = $pad - 1;
                    break;
                case 'left':
                    $lpad = 1;
                    break;
                case 'center':
                    $lpad = floor($pad / 2);
                    break;
                }
                $str .= $types[$cell['tag']] . str_repeat(' ', $lpad) .
                        $cell['text'] . str_repeat(' ', $pad - $lpad) .
                        str_repeat('|', $cell['colspan'] - 1);
            }
            $str .= $types[$cell['tag']] . "\n";
        }
        $TEXT = $str;
        global $SUF;
        $SUF = ltrim($SUF);
    }

    function html_table_editform($event) {
        if (!isset($_REQUEST['edittarget']) ||
            $_REQUEST['edittarget'] !== 'table' ||
            !$event->data['wr']) {
            return;
        }

        $event->stopPropagation();
        $event->preventDefault();

        global $lang;
        global $SUM;
        global $conf;
        global $license;
        global $ID;
        global $REV;
        global $DATE;
        global $PRE;
        global $SUF;
        global $INFO;

        extract($event->data); // $text, $check


        require_once 'renderer_table_edit.php';
        $Renderer = new Doku_Renderer_xhtml_table_edit();
        $instructions = p_get_instructions($text);

        $Renderer->reset();

        $Renderer->smileys = getSmileys();
        $Renderer->entities = getEntities();
        $Renderer->acronyms = getAcronyms();
        $Renderer->interwiki = getInterwiki();

        // Loop through the instructions
        foreach ( $instructions as $instruction ) {
            // Execute the callback against the Renderer
            call_user_func_array(array(&$Renderer, $instruction[0]),$instruction[1]);
        }

        $table = $Renderer->doc;
        ?>
        <div style="width:99%;">

        <div class="toolbar">
        <div id="draft__status"><?php if(!empty($INFO['draft'])) echo $lang['draftdate'].' '.dformat();?></div>
        <div id="tool__bar"><?php if($wr){?><a href="<?php echo DOKU_BASE?>lib/exe/mediamanager.php?ns=<?php echo $INFO['namespace']?>"
            target="_blank"><?php echo $lang['mediaselect'] ?></a><?php }?></div>

        </div>
        <?php

        $form = new Doku_Form(array('id' => 'dw__editform'));
        $form->addHidden('id', $ID);
        $form->addHidden('rev', $REV);
        $form->addHidden('date', $DATE);
        $form->addHidden('prefix', $PRE);
        $form->addHidden('suffix', $SUF);
        $form->addHidden('changecheck', $check);

        $form->addElement($table);
        $form->addElement(form_makeOpenTag('div', array('id'=>'wiki__editbar')));
        $form->addElement(form_makeOpenTag('div', array('id'=>'size__ctl')));
        $form->addElement(form_makeCloseTag('div'));
        $form->addElement(form_makeOpenTag('div', array('class'=>'editButtons')));
        $form->addElement(form_makeButton('submit', 'save', $lang['btn_save'], array('id'=>'edbtn__save', 'accesskey'=>'s', 'tabindex'=>'4')));
        $form->addElement(form_makeButton('submit', 'draftdel', $lang['btn_cancel'], array('tabindex'=>'6')));
        $form->addElement(form_makeCloseTag('div'));
        $form->addElement(form_makeOpenTag('div', array('class'=>'summary')));
        $form->addElement(form_makeTextField('summary', $SUM, $lang['summary'], 'edit__summary', 'nowrap', array('size'=>'50', 'tabindex'=>'2')));
        $elem = html_minoredit();
        if ($elem) $form->addElement($elem);
        $form->addElement(form_makeCloseTag('div'));
        $form->addElement(form_makeCloseTag('div'));
        if($conf['license']){
            $form->addElement(form_makeOpenTag('div', array('class'=>'license')));
            $out  = $lang['licenseok'];
            $out .= '<a href="'.$license[$conf['license']]['url'].'" rel="license" class="urlextern"';
            if(isset($conf['target']['external'])) $out .= ' target="'.$conf['target']['external'].'"';
            $out .= '> '.$license[$conf['license']]['name'].'</a>';
            $form->addElement($out);
            $form->addElement(form_makeCloseTag('div'));
        }
        html_form('edit', $form);
        print '</div>'.NL;
    }

}
