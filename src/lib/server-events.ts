import { EventEmitter } from 'events';

// In Next.js (Node environment), global variables survive across requests in development and 
// in standalone Docker builds. This allows us to have a cross-request event bus.
// In Next.js, global variables survive across requests.
// We use a symbol to avoid potential name collisions.
const EVENT_BUS_SYMBOL = Symbol.for('dashboard.eventBus');

declare global {
  var [EVENT_BUS_SYMBOL]: EventEmitter | undefined;
}

// Check if the event bus already exists on the global object
let eventBus: EventEmitter;

if (global[EVENT_BUS_SYMBOL]) {
  eventBus = global[EVENT_BUS_SYMBOL];
} else {
  eventBus = new EventEmitter();
  // Limit listeners to prevent memory leaks if many tabs connect/disconnect
  eventBus.setMaxListeners(100);
  global[EVENT_BUS_SYMBOL] = eventBus;
}

export { eventBus };
