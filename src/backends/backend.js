import TestRepoBackend from './test-repo/Implementation';
import { resolveFormat } from '../formats/formats';

export function resolveBackend(config) {
  const name = config.getIn(['backend', 'name']);
  if (name == null) {
    throw 'No backend defined in configuration';
  }

  switch (name) {
    case 'test-repo':
      return new Backend(new TestRepoBackend(config));
    default:
      throw `Backend not found: ${name}`;
  }
}

class Backend {
  constructor(implementation, authStore = null) {
    this.implementation = implementation;
    this.authStore = authStore;
    if (this.implementation == null) {
      throw 'Cannot instantiate a Backend with no implementation';
    }
  }

  currentUser() {
    if (this.user) { return this.user; }
    return this.authStore && this.authStore.retrieve();
  }

  authComponent() {
    return this.implementation.authComponent();
  }

  authenticate(credentials) {
    return this.implementation.authenticate(credentials);
  }

  entries(collection) {
    return this.implementation.entries(collection).then((entries) => (
      (entries || []).map((entry) => {
        const format = resolveFormat(collection, entry);
        if (entry && entry.raw) {
          entry.data = format && format.fromFile(entry.raw);
        }
        return entry;
      })
    ));
  }

  entry(collection, slug) {
    return this.implementation.entry(collection, slug);
  }
}

export const currentBackend = (function() {
  let backend = null;

  return (config) => {
    if (backend) { return backend; }
    if (config.get('backend')) {
      return backend = resolveBackend(config);
    }
  };
})();