/**
 * Enum for web hosts.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

const hosts = {
    'apache-http-server': ['apache/.htaccess'], 
    'cloudflare-pages': ['cloudflare/pages/_headers', 'cloudflare/pages/404.html'], 
    'cloudflare-workers': ['cloudflare/workers/_headers', 'cloudflare/workers/404.html']
};

export default hosts;
