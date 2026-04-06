import { EventEmitter } from 'events';

// In Next.js (Node environment), global variables survive across requests.
// We use a specific name to avoid collisions.
declare global {
  var _dashboardEventBus: EventEmitter | undefined;
}

// Check if the event bus already exists on the global object
let eventBus: EventEmitter;

if (global._dashboardEventBus) {
  eventBus = global._dashboardEventBus;
} else {
  eventBus = new EventEmitter();
  // Limit listeners to prevent memory leaks
  eventBus.setMaxListeners(100);
  global._dashboardEventBus = eventBus;
}

export { eventBus };
