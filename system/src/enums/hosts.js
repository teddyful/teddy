/**
 * Enum for web hosts.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

const hosts = {
    'apache-http-server': ['apache/.htaccess'], 
    'cloudflare-pages': ['cloudflare/pages/_headers', 'cloudflare/pages/404.html'], 
    'cloudflare-workers': ['cloudflare/workers/_headers', 'cloudflare/workers/404.html']
};

export default hosts;
