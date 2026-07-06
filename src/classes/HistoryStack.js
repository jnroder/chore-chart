/**
 * Bounded snapshot stack for undo/redo.
 * Snapshots are opaque JSON-serializable state blobs (deep-cloned by the caller).
 */
export class HistoryStack {
  constructor({ cap = 50 } = {}) {
    this.cap = cap;
    this.stack = [];
    this.index = -1; // pointer to "current" snapshot
  }

  /** Push a new snapshot. Truncates any redo history. */
  push(snapshot) {
    if (this.index < this.stack.length - 1) {
      this.stack.splice(this.index + 1);
    }
    this.stack.push(snapshot);
    if (this.stack.length > this.cap) this.stack.shift();
    this.index = this.stack.length - 1;
  }

  canUndo() {
    return this.index > 0;
  }
  canRedo() {
    return this.index < this.stack.length - 1;
  }

  undo() {
    if (!this.canUndo()) return null;
    this.index--;
    return this.stack[this.index];
  }

  redo() {
    if (!this.canRedo()) return null;
    this.index++;
    return this.stack[this.index];
  }

  /** Replace history with a single snapshot (used on load). */
  reset(snapshot) {
    this.stack = [snapshot];
    this.index = 0;
  }
}
