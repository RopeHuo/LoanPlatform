const localStorage = window.localStorage
const JSON = window.JSON

export default {
  get(name) {
    let value = localStorage.getItem(name)
    if (/^[\[\{].*[\}\]]$/.test(value)) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        this.remove(name);
        return null;
      }
    }
    if (value && (typeof value === typeof {}) && value.expire) {
      if (value.time + value.expire < (new Date()).getTime()) {
        this.remove(name);
        return null;
      } else {
        return value.data;
      }
    }
    return value
  },
  set(name, value, expire) {
    if (value == null) {
      localStorage.removeItem(name)
      return;
    }
    if (expire) {
      value = { data: value, expire: expire, time: (new Date()).getTime() }
    }
    if (typeof value === typeof {}) value = JSON.stringify(value)
    return localStorage.setItem(name, value)
  },
  remove(name) {
    return localStorage.removeItem(name)
  }
}
