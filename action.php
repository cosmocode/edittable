<?php
/**
 * Example Action Plugin:   Example Component.
 *
 * @author     Samuele Tognini <samuele@cli.di.unipi.it>
 */

if(!defined('DOKU_INC')) die();
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once DOKU_PLUGIN.'action.php';
require_once DOKU_PLUGIN.'edittable/common.php';

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
        $controller->register_hook('HTML_SECEDIT_BUTTON', 'BEFORE', $this, 'html_secedit_button');
        $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handle_table_post');
        $controller->register_hook('HTML_EDIT_FORMSELECTION', 'BEFORE', $this, 'html_table_editform');
        $controller->register_hook('TOOLBAR_DEFINE', 'AFTER', $this, 'toolbar');
    }

    function toolbar($event) {
        $menu = array(
                    array('title'  => $this->getLang('toggle_header'),
                          'key'    => 'H',
                          'icon'   => 'text_heading.png',
                          'type'   => 'toggletag'),

                    array('title'  => $this->getLang('val_align_left'),
                          'key'    => 'L',
                          'icon'   => 'a_left.png',
                          'type'   => 'val',
                          'prop'   => 'align',
                          'class'  => 'separator',
                          'val'    => 'left'),

                    array('title'  => $this->getLang('val_align_center'),
                          'key'    => 'C',
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
        global $SUF;

        $TEXT = table_to_wikitext($_POST['table']);
        $SUF = ltrim($SUF);
    }

    function html_secedit_button(&$event) {
        if ($event->data['target'] !== 'table') {
            return;
        }
        $event->data['name'] = $this->getLang('secedit_name');
    }

    function html_table_editform($event) {
        if (((!isset($_REQUEST['target']) ||
            $_REQUEST['target'] !== 'table') && !isset($_POST['table'])) ||
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
        $form->addElement(form_makeButton('submit', 'preview', $lang['btn_preview'], array('id'=>'edbtn__preview', 'accesskey'=>'p', 'tabindex'=>'5')));
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
