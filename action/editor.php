<?php
/**
 * Table editor
 *
 * @author Adrian Lang <lang@cosmocode.de>
 * @author Andreas Gohr <gohr@cosmocode.de>
 */

if(!defined('DOKU_INC')) die();
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN', DOKU_INC . 'lib/plugins/');

/**
 * handles all the editor related things
 *
 * like displaying the editor and adding custom edit buttons
 */
class action_plugin_edittable_editor extends DokuWiki_Action_Plugin {

    /**
     * Register its handlers with the DokuWiki's event controller
     */
    function register(Doku_Event_Handler &$controller) {
        // register custom edit buttons
        $controller->register_hook('HTML_SECEDIT_BUTTON', 'BEFORE', $this, 'secedit_button');


        // register our editor
        $controller->register_hook('HTML_EDIT_FORMSELECTION', 'BEFORE', $this, 'editform');
    }

    /**
     * Add a custom edit button under each table
     *
     * The target 'table' is provided by DokuWiki's XHTML core renderer in the table_close() method
     *
     * @param Doku_Event $event
     */
    function secedit_button(Doku_Event $event) {
        if ($event->data['target'] !== 'table') {
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

        if ($event->data['target'] !== 'table') return;
        $event->stopPropagation();
        $event->preventDefault();

        /** @var renderer_plugin_edittable_json $Renderer our own renderer to convert table to array */
        $Renderer = plugin_load('renderer', 'edittable_json', true);
        $instructions = p_get_instructions($TEXT);

        // Loop through the instructions
        foreach ( $instructions as $instruction ) {
            // Execute the callback against the Renderer
            call_user_func_array(array(&$Renderer, $instruction[0]),$instruction[1]);
        }

        // output data and editor field

        /** @var Doku_Form $form */
        $form =& $event->data['form'];

        // data for handsontable
        $form->addHidden('edittable_data',$Renderer->getDataJSON());
        $form->addHidden('edittable_meta',$Renderer->getMetaJSON());
        $form->addElement('<div id="edittable__editor"></div>');

        // FIXME add explanation here
        if (isset($_POST['edittable__new'])) {
            foreach($_POST['edittable__new'] as $k => $v) {
                $form->addHidden("edittable__new[$k]", $v);
            }
        }

        // set target and range to keep track during previews
        $form->addHidden('target', 'table');
        $form->addHidden('range', $RANGE);
    }

}