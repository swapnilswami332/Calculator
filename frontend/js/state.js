const initialState = {
  mode: "standard",
  activeTool: "basic",
  angleMode: "deg",
  theme: "dark",
  loading: false,
  errors: {},
  memory: 0,
  soundEnabled: false,
  expression: "",
  display: "0",
  result: null,
};

let state = { ...initialState };
const listeners = new Set();

export function getState() {
  return { ...state };
}

export function setState(partial) {
  state = { ...state, ...partial };
  listeners.forEach((fn) => fn(getState()));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setFieldError(toolId, field, message) {
  const errors = { ...state.errors, [toolId]: { ...(state.errors[toolId] || {}), [field]: message } };
  setState({ errors });
}

export function clearFieldErrors(toolId) {
  const errors = { ...state.errors };
  delete errors[toolId];
  setState({ errors });
}
