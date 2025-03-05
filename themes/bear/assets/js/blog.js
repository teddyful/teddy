/**
 * Basic demo blog listing page using Mithril.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

/* -----------------------------------------------------------------------------
 * BLOG LISTING
 * ---------------------------------------------------------------------------*/

// Blog listing page elements.
const elements = {
    blog: {
        listing: {
            container: document.getElementById('blog-listing'), 
            firstPost: document.getElementsByClassName('blog-post')[0], 
            loadMore: document.getElementById('blog-listing-load-more')
        }, 
        filters: {
            message: document.getElementById('blog-filters-message'), 
            search: {
                form: document.getElementById('blog-search-form')
            }, 
            categories: {
                container: document.getElementById('blog-categories'), 
                items: document.getElementsByClassName('blog-category')
            }, 
            reset: document.getElementById('blog-filters-reset')
        }
    }
}

/* -----------------------------------------------------------------------------
 * SEARCH
 * ---------------------------------------------------------------------------*/

async function doSearch(loadMore = false) {

    searchResultsDelta = [];
    if ( !loadMore ) {
        searchResults = [];
    }

    // No search query and no category filter.
    if ( !searchQuery && !categoryFilter ) {
        searchResultsDelta = !loadMore ? headDocs : 
            await search.getDocuments(searchResults.length, 
                COLLECTION_PAGINATION_SIZE);
    }

    // Search query with no category filter.
    else if ( searchQuery && !categoryFilter ) {
        searchResultsDelta = await search.query(searchQuery, 
            searchResults.length, COLLECTION_PAGINATION_SIZE, 
            MIN_SEARCH_QUERY_LENGTH);
    }

    // Search query with category filter.
    else if ( searchQuery && categoryFilter ) {
        searchResultsDelta = await search.queryAndFilterByTags(searchQuery, 
            categoryFilter, searchResults.length, COLLECTION_PAGINATION_SIZE, 
            MIN_SEARCH_QUERY_LENGTH);
    }

    // Category filter with no search query.
    else if ( !searchQuery && categoryFilter ) {
        searchResultsDelta = await search.getDocumentsByTags(categoryFilter, 
            searchResults.length, COLLECTION_PAGINATION_SIZE);
    }

    searchResults = searchResults.concat(searchResultsDelta);

}

/* -----------------------------------------------------------------------------
 * COMPONENTS
 * ---------------------------------------------------------------------------*/

function updateMessageTemplate(template) {
    let message = template.replace('${searchResults.length} ', 
        searchResults.length < COLLECTION_PAGINATION_SIZE ? 
            `${searchResults.length} ` : '');
    if ( searchQuery )
        message = message.replace('${searchQuery}', searchQuery);
    if ( categoryFilter ) 
        message = message.replace('${category.name}', 
            site[PAGE_LANGUAGE].taxonomy.categories[categoryFilter]);
    return message;
}

function generateFilteringMessage() {

    // Search query with category filter.
    if ( searchQuery && categoryFilter ) {
        return searchQuery.length >= MIN_SEARCH_QUERY_LENGTH ? 
            updateMessageTemplate(site[PAGE_LANGUAGE]
                .content.messages.filters.combined.results) : 
            site[PAGE_LANGUAGE].content.messages.filters.search.invalid;
    }

    // Search query with no category filter.
    else if ( searchQuery ) {
        return searchQuery.length >= MIN_SEARCH_QUERY_LENGTH ? 
            updateMessageTemplate(site[PAGE_LANGUAGE]
                .content.messages.filters.search.results) : 
            site[PAGE_LANGUAGE].content.messages.filters.search.invalid;
    } 
    
    // Category filter with no search query.
    else if ( categoryFilter ) {
        return updateMessageTemplate(site[PAGE_LANGUAGE]
            .content.messages.filters.categories.results);
    }
    
}

const FilteringMessage = {
    view: () => {
        return searchQuery || categoryFilter ? 
            m('p', generateFilteringMessage()) : null;
    }
}

function generateBlogListingPost(doc) {
    let post = elements.blog.listing.firstPost.cloneNode(true);
    let postImage = post.getElementsByClassName('blog-post-img')[0];
    postImage.setAttribute('src', `${doc.relUrl}/${doc.cover}`);
    postImage.setAttribute('alt', doc.name);
    let postTitle = post.getElementsByClassName('blog-post-title')[0];
    postTitle.setAttribute('href', doc.relUrl);
    postTitle.innerHTML = doc.name;
    let postAuthor = post.getElementsByClassName('blog-post-author')[0];
    postAuthor.setAttribute('href', doc.authorUrl);
    postAuthor.innerHTML = doc.author;
    let postDate = post.getElementsByClassName('blog-post-date')[0];
    postDate.innerHTML = doc.displayDate;
    let postDescription = post.getElementsByClassName(
        'blog-post-description')[0];
    postDescription.innerHTML = doc.description;
    let postReadMore = post.getElementsByClassName(
        'blog-post-read-more')[0];
    postReadMore.setAttribute('href', doc.relUrl);
    let categories = '';
    for ( const category of doc.categoryLanguages ) {
        categories += category.name
    }
    let postCategories = post.getElementsByClassName(
        'blog-post-categories')[0];
    postCategories.innerHTML = categories;
    return post.outerHTML;
}

const BlogListing = {
    view: () => {
        return [].concat(
            searchResults.map(doc => m.trust(generateBlogListingPost(doc)))
        );
    }
}

const LoadMore = {
    view: () => {
        return searchResultsDelta.length < COLLECTION_PAGINATION_SIZE ? null : 
            m('button', {
                type: 'button', 
                class: 'btn btn-primary', 
                onclick: async function(e) {
                    await doSearch(true);
                    m.redraw();
                }
            }, site[PAGE_LANGUAGE].content.labels.loadMore);
    }
}

const SearchForm = {
    view: function() {
        return m('form', { 
            class: 'widget-search', 
            onsubmit: async function (e) {
                e.preventDefault();
                searchQuery = rawQuery;
                await doSearch();
                m.redraw();
            }
        }, [
            m('input', {
                id: 'blog-search-input', 
                type: 'search', 
                placeholder: site[PAGE_LANGUAGE]
                    .content.labels.searchPlaceholder,
                onchange: function(e) {
                    rawQuery = Search.sanitizeQuery(
                        e.currentTarget.value);
                }, 
                oninput: async function(e) {

                    // Search query input is cleared.
                    if ( !e.currentTarget.value ) {
                        searchQuery = null;
                        await doSearch();
                        m.redraw();
                    }

                }
            }), 
            m('button', { type: 'submit'}, [
                m('i', { class: 'fas fa-magnifying-glass' })
            ])
        ])
    }
}

function generateCategoryFilterName(category) {
    return `${category.name}<small class="ms-auto">(${category.count})</small>`;
}

function deactivateCategories() {
    Array.from(elements.blog.filters.categories.items).forEach(
        function(elem) {
            elem.classList.remove('active');
        }
    );
}

const Categories = {
    view: function() {
        return m('ul', { class: 'list-unstyled widget-list' }, [].concat(
            site[PAGE_LANGUAGE].collection.metadata.categories.map(category => 
                m('li', [
                    m('a', {
                        href: '#', 
                        class: 'd-flex blog-category', 
                        onclick: async function(e) {
                            e.preventDefault();
                            if (e.currentTarget.classList.contains('active')) {
                                categoryFilter = null;
                                deactivateCategories();
                            } else {
                                categoryFilter = [category.id];
                                deactivateCategories();
                                e.currentTarget.classList.add('active');
                            }
                            await doSearch();
                            m.redraw();
                        }
                    }, m.trust(generateCategoryFilterName(category)))
                ])
            )
        ));
    }
}

function clearSearchForm() {
    Array.from(elements.blog.filters.search.form
        .querySelectorAll('input[type=search]')).forEach(
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
            onclick: async function(e) {
                clearSearchForm();
                deactivateCategories();
                searchQuery = null;
                categoryFilter = null;
                await doSearch();
                m.redraw();
            }
        }, site[PAGE_LANGUAGE].content.labels.reset)
    }
}

// Initialise the search service and mount the components.
const search = new Search();
let searchQuery = null;
let rawQuery = null;
let categoryFilter = null;
let searchResults = [];
let searchResultsDelta = [];
let headDocs = [];
(async function() {
    await search.loadIndex();
    headDocs = await search.getDocuments(0, COLLECTION_PAGINATION_SIZE);
    await doSearch();
    m.mount(elements.blog.listing.container, BlogListing);
    m.mount(elements.blog.listing.loadMore, LoadMore);
    m.mount(elements.blog.filters.search.form, SearchForm);
    m.mount(elements.blog.filters.message, FilteringMessage);
    m.mount(elements.blog.filters.categories.container, Categories);
    m.mount(elements.blog.filters.reset, Reset);
}());
