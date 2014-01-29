<?php
/**
 * Table editor
 *
 * @author Andreas Gohr <gohr@cosmocode.de>
 */

if(!defined('DOKU_INC')) die();
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN', DOKU_INC.'lib/plugins/');

/**
 * just intercepts ACTION_ACT_PREPROCESS and emits two new events
 *
 * We have two action components handling above event but need them to execute in a specific order.
 * That's currently not possible to guarantee, so we catch the event only once and emit two of our own
 * in the right order. Once DokuWiki supports a sort we can skip this.
 */
class action_plugin_edittable_preprocess extends DokuWiki_Action_Plugin {

    /**
     * Register its handlers with the DokuWiki's event controller
     */
    function register(Doku_Event_Handler $controller) {
        // register preprocessing for accepting editor data
        $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handle_preprocess');
    }

    /**
     * See class description for WTF we're doing here
     *
     * @param Doku_Event $event
     */
    public function handle_preprocess(Doku_Event $event){
        trigger_event('PLUGIN_EDITTABLE_PREPROCESS_EDITOR', $event->data);
        trigger_event('PLUGIN_EDITTABLE_PREPROCESS_NEWTABLE', $event->data);
    }
}