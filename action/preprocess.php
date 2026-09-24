<?php

/**
 * Table editor
 *
 * @author Andreas Gohr <gohr@cosmocode.de>
 */

use dokuwiki\Extension\ActionPlugin;
use dokuwiki\Extension\EventHandler;
use dokuwiki\Extension\Event;

/**
 * just intercepts ACTION_ACT_PREPROCESS and emits two new events
 *
 * We have two action components handling above event but need them to execute in a specific order.
 * That's currently not possible to guarantee, so we catch the event only once and emit two of our own
 * in the right order. Once DokuWiki supports a sort we can skip this.
 */
class action_plugin_edittable_preprocess extends ActionPlugin
{
    /**
     * Sequence number of our ACTION_ACT_PREPROCESS handler
     *
     * The table editor posts its data instead of the usual wiki text, so the data has to be turned into
     * wiki text before any other plugin looks at it. The negative value runs our handler first, even when
     * another plugin stops the propagation of the event.
     *
     * @var int
     */
    protected const PREPROCESS_SEQUENCE = -100;

    /**
     * Register its handlers with the DokuWiki's event controller
     *
     * @param EventHandler $controller the event controller to register with
     */
    public function register(EventHandler $controller)
    {
        // register preprocessing for accepting editor data
        $controller->register_hook(
            'ACTION_ACT_PREPROCESS',
            'BEFORE',
            $this,
            'handlePreprocess',
            null,
            self::PREPROCESS_SEQUENCE
        );
    }

    /**
     * See class description for WTF we're doing here
     *
     * @param Event $event
     */
    public function handlePreprocess(Event $event)
    {
        Event::createAndTrigger('PLUGIN_EDITTABLE_PREPROCESS_EDITOR', $event->data);
        Event::createAndTrigger('PLUGIN_EDITTABLE_PREPROCESS_NEWTABLE', $event->data);
    }
}
