/**
 * Build options class.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

class Options {

    constructor() {
        this.siteName = null;
        this.themeName = null;
        this.env = 'local';
        this.flags = {};
    }

    getEnv() {
        return this.env;
    }

    setEnv(env) {
        this.env = env;
    }

    getSiteName() {
        return this.siteName;
    }

    setSiteName(siteName) {
        this.siteName = siteName;
    }

    getThemeName() {
        return this.themeName;
    }

    setThemeName(themeName) {
        this.themeName = themeName;
    }

    getFlags() {
        return this.flags;
    }

    setFlag(flag, enabled) {
        this.flags[flag] = enabled;
    }

}

export default Options;
