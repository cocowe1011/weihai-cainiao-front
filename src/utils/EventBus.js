/**
 * Vue 3 轻量 EventBus，接口对齐其它项目的 Vue.prototype EventBus
 * （$on / $off / $emit），不依赖 mitt。
 */
class EventBusImpl {
  constructor() {
    this.events = {};
  }

  $on(event, callback) {
    if (!event || typeof callback !== 'function') return;
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  $off(event, callback) {
    if (!event || !this.events[event]) return;
    if (!callback) {
      this.events[event] = [];
      return;
    }
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  $emit(event, ...args) {
    if (!event || !this.events[event]) return;
    this.events[event].forEach((cb) => {
      cb(...args);
    });
  }
}

export const EventBus = new EventBusImpl();
