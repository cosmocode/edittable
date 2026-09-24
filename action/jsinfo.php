<?php

use dokuwiki\Extension\ActionPlugin;
use dokuwiki\Extension\EventHandler;

/**
 * handles the data that has to be written into jsinfo
 *
 * like displaying the editor and adding custom edit buttons
 */
class action_plugin_edittable_jsinfo extends ActionPlugin
{
    /**
     * Register its handlers with the DokuWiki's event controller
     */
    public function register(EventHandler $controller)
    {
        // register custom edit buttons
        $controller->register_hook('DOKUWIKI_STARTED', 'BEFORE', $this, 'fill_jsinfo');
    }

    public function fill_jsinfo()
    {
        global $JSINFO;
        $JSINFO['plugins']['edittable']['default columnwidth'] = $this->getConf('default colwidth');
    }
}
