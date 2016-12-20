<?php

if(!defined('DOKU_INC')) die();

/**
 * handles the data that has to be written into jsinfo
 *
 * like displaying the editor and adding custom edit buttons
 */
class action_plugin_edittable_jsinfo extends DokuWiki_Action_Plugin {

    /**
     * Register its handlers with the DokuWiki's event controller
     */
    function register(Doku_Event_Handler $controller) {
        // register custom edit buttons
        $controller->register_hook('DOKUWIKI_STARTED', 'BEFORE', $this, 'fill_jsinfo');
    }

    function fill_jsinfo() {
        global $JSINFO;
        $JSINFO['plugins']['edittable']['default columnwidth'] = $this->getConf('default colwidth');
    }
}
