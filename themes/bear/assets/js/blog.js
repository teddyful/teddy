/**
 * Basic demo blog listing page using Mithril.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

/* -----------------------------------------------------------------------------
 * ELEMENTS
 * ---------------------------------------------------------------------------*/

const PAGE_LANGUAGE = getPageLanguage();
const elements = {
    blog: {
        listing: {
            container: document.getElementById('blog-listing'),
            loadMore: document.getElementById('blog-listing-load-more')
        },
        filters: {
            message: document.getElementById('blog-filters-message'),
            search: {
                form: document.getElementById('blog-search-form')
            },
            categories: {
                container: document.getElementById('blog-categories')
            },
            reset: document.getElementById('blog-filters-reset')
        }
    }
};

function hasBlogListingElements() {
    return Boolean(
        elements.blog.listing.container &&
        elements.blog.listing.loadMore &&
        elements.blog.filters.message &&
        elements.blog.filters.search.form &&
        elements.blog.filters.categories.container &&
        elements.blog.filters.reset
    );
}

/* -----------------------------------------------------------------------------
 * HELPER FUNCTIONS
 * ---------------------------------------------------------------------------*/

const PAGE_SIZE = Math.max(
    1, Math.floor(Number(COLLECTION_PAGINATION_SIZE) || 1)
);

function hasUnsafePathSegments(value) {
    return String(value ?? '')
        .split('/')
        .some(segment => segment === '..');
}

function hasUrlProtocol(value) {
    return /^[a-z][a-z0-9+.-]*:/i.test(String(value ?? '').trim());
}

function isUnsafeUrl(value) {
    const url = String(value ?? '').trim().toLowerCase();
    return url.length === 0 ||
        url.startsWith('javascript:') ||
        url.startsWith('data:') ||
        url.startsWith('vbscript:') ||
        url.startsWith('//');
}

function normalizeLocalUrl(value, fallback = '#') {
    const url = String(value ?? '').trim();
    if (isUnsafeUrl(url) || hasUrlProtocol(url) ||
        hasUnsafePathSegments(url)) {
        return fallback;
    }
    return url;
}

function normalizeAuthorUrl(value) {
    const url = String(value ?? '').trim();
    if (isUnsafeUrl(url) || hasUnsafePathSegments(url)) {
        return '#';
    }
    try {
        const parsedUrl = new URL(url, window.location.origin);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return '#';
        }
    } catch (error) {
        return '#';
    }
    return url;
}

function buildPostUrl(doc) {
    return normalizeLocalUrl(doc.relUrl);
}

function buildCoverUrl(doc) {
    if (!doc.cover) {
        return '';
    }
    const relUrl = normalizeLocalUrl(doc.relUrl, '');
    const cover = normalizeLocalUrl(doc.cover, '');
    if (!relUrl || !cover) {
        return '';
    }
    return `${relUrl}/${cover}`;
}

/* -----------------------------------------------------------------------------
 * SEARCH
 * ---------------------------------------------------------------------------*/

async function doSearch(loadMore = false) {
    const requestId = ++searchRequestId;
    const nextSearchResults = loadMore ? searchResults.slice() : [];
    const offset = nextSearchResults.length;
    let nextSearchResultsDelta = [];
    if (!searchQuery && !categoryFilterId) {
        nextSearchResultsDelta = !loadMore ?
            headDocs :
            await search.getDocuments(offset, PAGE_SIZE);
    } else if (searchQuery && !categoryFilterId) {
        nextSearchResultsDelta = await search.query(searchQuery, {
            offset,
            limit: PAGE_SIZE,
            minSearchQueryLength: MIN_SEARCH_QUERY_LENGTH
        });
    } else if (searchQuery && categoryFilterId) {
        nextSearchResultsDelta = await search.queryAndFilterByTags(
            searchQuery,
            [categoryFilterId],
            {
                offset,
                limit: PAGE_SIZE,
                minSearchQueryLength: MIN_SEARCH_QUERY_LENGTH
            }
        );
    } else if (!searchQuery && categoryFilterId) {
        nextSearchResultsDelta = await search.getDocumentsByTags(
            [categoryFilterId],
            offset,
            PAGE_SIZE
        );
    }
    if (requestId !== searchRequestId) {
        return;
    }
    searchResultsDelta = nextSearchResultsDelta;
    searchResults = nextSearchResults.concat(searchResultsDelta);
}

/* -----------------------------------------------------------------------------
 * COMPONENTS
 * ---------------------------------------------------------------------------*/

function getCategoryName(categoryId) {
    return site[PAGE_LANGUAGE].taxonomy.categories[categoryId] ?? categoryId;
}

function updateMessageTemplate(template) {
    let message = template.replace(
        '${searchResults.length} ',
        searchResults.length < PAGE_SIZE ? `${searchResults.length} ` : ''
    );
    if (searchQuery) {
        message = message.replace('${searchQuery}', searchQuery);
    }
    if (categoryFilterId) {
        message = message.replace(
            '${category.name}',
            getCategoryName(categoryFilterId)
        );
    }
    return message;
}

function generateFilteringMessage() {
    if (searchQuery && categoryFilterId) {
        return searchQuery.length >= MIN_SEARCH_QUERY_LENGTH ?
            updateMessageTemplate(site[PAGE_LANGUAGE]
                .content.messages.filters.combined.results) :
            site[PAGE_LANGUAGE].content.messages.filters.search.invalid;
    }
    if (searchQuery) {
        return searchQuery.length >= MIN_SEARCH_QUERY_LENGTH ?
            updateMessageTemplate(site[PAGE_LANGUAGE]
                .content.messages.filters.search.results) :
            site[PAGE_LANGUAGE].content.messages.filters.search.invalid;
    }
    if (categoryFilterId) {
        return updateMessageTemplate(site[PAGE_LANGUAGE]
            .content.messages.filters.categories.results);
    }
    return null;
}

const FilteringMessage = {
    view: () => {
        return searchQuery || categoryFilterId ?
            m('p', generateFilteringMessage()) :
            null;
    }
};

function renderCategoryNames(doc) {
    return (doc.categoryLanguages ?? [])
        .map(category => category.name)
        .filter(Boolean)
        .join('\u00a0');
}

const BlogPost = {
    view: function(vnode) {
        const doc = vnode.attrs.doc;
        const postUrl = buildPostUrl(doc);
        const coverUrl = buildCoverUrl(doc);
        return m('article', {
            class: 'blog-post row mb-5'
        }, [
            m('div', {
                class: 'col-12'
            }, [
                m('div', {
                    class: 'post-slider'
                }, [
                    coverUrl ?
                        m('img', {
                            class: 'img-fluid blog-post-img',
                            loading: 'lazy',
                            src: coverUrl,
                            alt: doc.name ?? ''
                        }) :
                        null
                ])
            ]),
            m('div', {
                class: 'col-12 mx-auto'
            }, [
                m('h3', [
                    m('a', {
                        class: 'post-title blog-post-title',
                        href: postUrl
                    }, doc.name ?? '')
                ]),
                m('ul', {
                    class: 'list-inline post-meta mb-4'
                }, [
                    m('li', {
                        class: 'list-inline-item'
                    }, [
                        m('i', { class: 'fas fa-user me-2' }),
                        m('a', {
                            class: 'blog-post-author',
                            href: normalizeAuthorUrl(doc.authorUrl)
                        }, doc.author ?? '')
                    ]),
                    m('li', {
                        class: 'list-inline-item'
                    }, [
                        m('i', { class: 'fas fa-calendar me-2' }),
                        m('span', {
                            class: 'blog-post-date'
                        }, doc.displayDate ?? '')
                    ]),
                    m('li', {
                        class: 'list-inline-item'
                    }, [
                        m('i', { class: 'fas fa-earth-americas me-2' }),
                        m('span', {
                            class: 'blog-post-categories'
                        }, renderCategoryNames(doc))
                    ])
                ]),
                m('p', {
                    class: 'blog-post-description'
                }, doc.description ?? ''),
                m('a', {
                    class: 'btn btn-outline-primary blog-post-read-more',
                    href: postUrl
                }, site[PAGE_LANGUAGE].content.labels.continueReading)
            ])
        ]);
    }
};

const BlogListing = {
    view: () => {
        return searchResults.map(doc => m(BlogPost, { key: doc.id, doc }));
    }
};

const LoadMore = {
    view: () => {
        return searchResultsDelta.length < PAGE_SIZE ? null :
            m('button', {
                type: 'button',
                class: 'btn btn-primary',
                onclick: async function() {
                    await doSearch(true);
                    m.redraw();
                }
            }, site[PAGE_LANGUAGE].content.labels.loadMore);
    }
};

const SearchForm = {
    view: function() {
        return m('form', {
            class: 'widget-search',
            onsubmit: async function(e) {
                e.preventDefault();
                searchQuery = Search.sanitizeQuery(rawQuery);
                await doSearch();
                m.redraw();
            }
        }, [
            m('input', {
                id: 'blog-search-input',
                type: 'search',
                placeholder: site[PAGE_LANGUAGE]
                    .content.labels.searchPlaceholder,
                value: rawQuery ?? '',
                oninput: async function(e) {
                    rawQuery = Search.sanitizeQuery(e.currentTarget.value);

                    if (!rawQuery) {
                        searchQuery = null;
                        await doSearch();
                        m.redraw();
                    }
                }
            }),
            m('button', { type: 'submit' }, [
                m('i', { class: 'fas fa-magnifying-glass' })
            ])
        ]);
    }
};

const Categories = {
    view: function() {
        return m('ul', { class: 'list-unstyled widget-list' },
            site[PAGE_LANGUAGE].collection.metadata.categories.map(category =>
                m('li', [
                    m('a', {
                        href: '#',
                        class: categoryFilterId === category.id ?
                            'd-flex blog-category active' :
                            'd-flex blog-category',
                        onclick: async function(e) {
                            e.preventDefault();

                            categoryFilterId = categoryFilterId === category.id ?
                                null :
                                category.id;

                            await doSearch();
                            m.redraw();
                        }
                    }, [
                        m('span', category.name),
                        m('small', {
                            class: 'ms-auto'
                        }, `(${category.count})`)
                    ])
                ])
            )
        );
    }
};

function clearSearchForm() {
    const searchForm = elements.blog.filters.search.form;
    if (!searchForm) {
        return;
    }
    Array.from(searchForm.querySelectorAll('input[type=search]')).forEach(
        function(elem) {
            elem.value = '';
        }
    );
}

const Reset = {
    view: function() {
        return m('button', {
            type: 'button',
            class: 'btn btn-primary btn-sm',
            onclick: async function() {
                clearSearchForm();
                rawQuery = null;
                searchQuery = null;
                categoryFilterId = null;
                await doSearch();
                m.redraw();
            }
        }, site[PAGE_LANGUAGE].content.labels.reset);
    }
};

/* -----------------------------------------------------------------------------
 * INITIALISATION
 * ---------------------------------------------------------------------------*/

const search = new Search();
let searchRequestId = 0;
let searchQuery = null;
let rawQuery = null;
let categoryFilterId = null;
let searchResults = [];
let searchResultsDelta = [];
let headDocs = [];

if (hasBlogListingElements()) {
    (async function() {
        await search.loadIndex();
        headDocs = await search.getDocuments(0, PAGE_SIZE);
        await doSearch();
        m.mount(elements.blog.listing.container, BlogListing);
        m.mount(elements.blog.listing.loadMore, LoadMore);
        m.mount(elements.blog.filters.search.form, SearchForm);
        m.mount(elements.blog.filters.message, FilteringMessage);
        m.mount(elements.blog.filters.categories.container, Categories);
        m.mount(elements.blog.filters.reset, Reset);
    }());
}
