<?php
/**
 * Table editor
 *
 * @author     Adrian Lang <lang@cosmocode.de>
 */

if(!defined('DOKU_INC')) die();
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN', DOKU_INC.'lib/plugins/');

class action_plugin_edittable_newtable extends DokuWiki_Action_Plugin {

    /**
     * Register its handlers with the DokuWiki's event controller
     */
    function register(Doku_Event_Handler $controller) {
        $controller->register_hook('TOOLBAR_DEFINE', 'AFTER', $this, 'toolbar');

        $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handle_newtable');
    }

    /**
     * Add a button for inserting tables to the toolbar array
     *
     * @param Doku_Event $event
     */
    function toolbar($event) {
        $event->data[] = array(
            'title' => $this->getLang('add_table'),
            'type'  => 'NewTable',
            'icon'  => '../../plugins/edittable/images/add_table.png'
        );
    }

    /**
     * Handle the click on the new table button in the toolbar
     *
     * @param Doku_Event $event
     */
    function handle_newtable($event) {
        if(!isset($_POST['edittable__new'])) {
            return;
        }

        foreach($_POST['edittable__new'] as &$v) {
            // Form performs a formText
            $v = cleanText($v);
        }

        global $TEXT;
        if(isset($_POST['do']['preview'])) {
            // preview view of a table edit
            global $INPUT;
            $INPUT->set('target', 'table');
            $_REQUEST['target'] = 'table';
        } elseif(isset($_POST['do']['edit'])) {
            // edit view of a table (first edit)
            $_REQUEST['target'] = 'table';
            $TEXT               = "^  ^  ^\n";
            foreach(explode("\n", $_POST['edittable__new']['text']) as $line) {
                $TEXT .= "| $line |  |\n";
            }
        } elseif(isset($_POST['do']['draftdel'])) {
            $TEXT = $_POST['edittable__new']['pre'].
                $_POST['edittable__new']['text'].
                $_POST['edittable__new']['suf'];
            global $ACT;
            $ACT                = 'edit';
            $_REQUEST['target'] = 'section';
        } elseif(isset($_POST['do']['save'])) {
            // return to edit page
            $TEXT = $_POST['edittable__new']['pre'].
                $TEXT.
                $_POST['edittable__new']['suf'];
            global $ACT;
            $ACT                = 'edit';
            $_REQUEST['target'] = 'section';
        }
    }
}