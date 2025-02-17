/**
 * Build options class.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

class Options {

    constructor() {
        this.env = 'local';
        this.flags = {};
    }

    getEnv() {
        return this.env;
    }

    setEnv(env) {
        this.env = env;
    }

    getFlags() {
        return this.flags;
    }

    setFlag(flag, enabled) {
        this.flags[flag] = enabled;
    }

}

export default Options;
