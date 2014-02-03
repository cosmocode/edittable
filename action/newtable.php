<?php
/**
 * Table editor
 *
 * @author     Adrian Lang <lang@cosmocode.de>
 */

if(!defined('DOKU_INC')) die();
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN', DOKU_INC.'lib/plugins/');

/**
 * Handles the inserting of a new table in a running edit session
 */
class action_plugin_edittable_newtable extends DokuWiki_Action_Plugin {

    /**
     * Register its handlers with the DokuWiki's event controller
     */
    function register(Doku_Event_Handler $controller) {
        $controller->register_hook('TOOLBAR_DEFINE', 'AFTER', $this, 'toolbar');

        //$controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handle_newtable');
        $controller->register_hook('PLUGIN_EDITTABLE_PREPROCESS_NEWTABLE', 'BEFORE', $this, 'handle_newtable');
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
            'icon'  => '../../plugins/edittable/images/add_table.png',
            'block' => true
        );
    }

    /**
     * Handle the click on the new table button in the toolbar
     *
     * @param Doku_Event $event
     */
    function handle_newtable($event) {
        global $INPUT;
        global $TEXT;
        global $ACT;

        if(!$INPUT->post->has('edittable__new')) return;

        /*
         * $fields['pre']  has all data before the selection when the "Insert table" button was clicked
         * $fields['text'] has all data inside the selection when the "Insert table" button was clicked
         * $fields['suf']  has all data after the selection when the "Insert table" button was clicked
         * $TEXT has the table created by the editor (from action_plugin_edittable_editor::handle_table_post())
         */
        $fields = $INPUT->post->arr('edittable__new');

        // clean the fields (undos formText()) and update the post and request arrays
        $fields['pre'] = cleanText($fields['pre']);
        $fields['text'] = cleanText($fields['text']);
        $fields['suf'] = cleanText($fields['suf']);
        $INPUT->post->set('edittable__new', $fields);


        $ACT = act_clean($ACT);
        switch($ACT){
            case 'preview':
                // preview view of a table edit
                $INPUT->post->set('target', 'table');
                break;
            case 'edit':
                // edit view of a table (first edit)
                $INPUT->post->set('target', 'table');
                $TEXT = "^  ^  ^\n";
                foreach(explode("\n", $fields['text']) as $line) {
                    $TEXT .= "| $line |  |\n";
                }
                break;
            case 'draftdel':
                // not sure if/how this would happen, we restore all data and hand over to section edit
                $INPUT->post->set('target', 'section');
                $TEXT = $fields['pre'].$fields['text'].$fields['suf'];
                $ACT  = 'edit';
                break;
            case 'save':
                // return to edit page
                $INPUT->post->set('target', 'section');
                $TEXT = $fields['pre'].$TEXT.$fields['suf'];
                $ACT  = 'edit';
                break;
        }
    }
}